# Next.js standalone Dockerfile (npm + Prisma)
# next.config.ts déclare output: "standalone"

FROM node:20-bullseye-slim AS base
WORKDIR /app

# 1) deps
FROM base AS deps
COPY package.json package-lock.json ./
# prisma generate (déclenché par postinstall) a besoin du schema avant `npm ci`
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci

# 2) build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# next build charge lib/session.ts pour analyser /api/auth/cla/callback, qui
# lève une erreur si SESSION_SECRET est absent/trop court. Valeur factice
# utilisée uniquement pendant le build : elle ne part pas dans l'image finale
# (le runner ne copie pas les variables d'env du builder), la vraie valeur
# est injectée au lancement du conteneur en production.
ENV SESSION_SECRET="build-time-placeholder-do-not-use-in-prod-32chars"
# Le client Prisma est généré vers app/generated/prisma (cf. schema.prisma),
# donc hors node_modules : celui produit par le postinstall du stage `deps`
# est écrasé par le `COPY . .` ci-dessus. On le régénère ici, une fois la
# source complète (et donc prisma/schema.prisma) en place.
RUN npx prisma generate
RUN npm run build

# 3) migrator
# Image dédiée aux migrations, à lancer comme job one-shot (`prisma migrate
# deploy`) avant de faire tourner la nouvelle image `runner`. Contrairement au
# runner en mode standalone, ce stage garde le node_modules complet du build
# (CLI prisma, dotenv, tsx) ainsi que prisma.config.ts et prisma/ : c'est le
# seul endroit de l'image où `prisma migrate deploy` peut réellement tourner.
FROM builder AS migrator
CMD ["npx", "prisma", "migrate", "deploy"]

# 4) runner
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Standalone output (serveur Node autonome + node_modules minimaux)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Le node_modules tracé par Next.js n'inclut pas le CLI prisma (rien ne
# l'importe statiquement). On le remplace par le node_modules complet du
# build pour que la route cachée /api/internal/migrate-db (voir ce fichier)
# puisse lancer `prisma migrate deploy` depuis ce même conteneur — utile
# quand on n'a pas d'accès shell au serveur pour lancer l'image `migrator`
# séparément.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
