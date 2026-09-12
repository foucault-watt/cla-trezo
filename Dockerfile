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
RUN npm run build

# 3) runner
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

# Prisma CLI/migrations pour lancer `prisma migrate deploy` depuis le conteneur
# (le client généré est déjà inclus dans standalone via node_modules/.prisma)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
