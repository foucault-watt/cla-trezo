# Image en plusieurs étapes : seule la dernière (`runner`) est déployée. Les
# étapes intermédiaires servent à construire puis sont jetées, ce qui garde
# l'image finale légère (rapide à écrire sur le disque du VPS au déploiement).

# ─── Base commune ─────────────────────────────────────────────────────────────
FROM node:22.14-bookworm-slim AS base

WORKDIR /app

# Prisma / TLS, et curl pour le healthcheck Coolify (lancé dans le conteneur)
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# ─── Construction de l'app ───────────────────────────────────────────────────
FROM base AS builder

# Dépendances
COPY package*.json ./

# On évite le postinstall ici car le dossier prisma
# n'a pas encore été copié
RUN npm ci --ignore-scripts

# Code source
COPY . .

# Ton package.json contient "postinstall": "prisma generate"
# mais ici on le lance explicitement après avoir copié le projet
RUN npx prisma generate

# Build Next.js (produit .next/standalone, cf. next.config.ts)
RUN npm run build

# ─── CLI Prisma seule, pour la route /api/internal/migrate-db ────────────────
# La sortie standalone n'embarque que les paquets utiles à l'app : la CLI
# Prisma (une centaine de paquets) est installée à part, à la version exacte
# du package-lock. Les scripts d'installation téléchargent ici le moteur de
# migration, plutôt qu'au premier appel de la route en prod.
FROM base AS prisma-cli

WORKDIR /app/prisma-cli

COPY package-lock.json /tmp/package-lock.json

RUN PRISMA_VERSION=$(node -p "require('/tmp/package-lock.json').packages['node_modules/prisma'].version") \
    && DOTENV_VERSION=$(node -p "require('/tmp/package-lock.json').packages['node_modules/dotenv'].version") \
    && npm install --no-save --no-audit --no-fund "prisma@$PRISMA_VERSION" "dotenv@$DOTENV_VERSION"

# ─── Image finale ────────────────────────────────────────────────────────────
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Serveur Next.js autonome, plus les fichiers statiques qu'il ne copie pas
# lui-même. Le dossier de travail reste /app, donc STORAGE_ROOT_DIR garde le
# même sens qu'avant.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# CLI Prisma + schéma, migrations et config, lus par migrate-db
COPY --from=prisma-cli /app/prisma-cli ./prisma-cli
COPY --from=builder /app/prisma ./prisma-cli/prisma
COPY --from=builder /app/prisma.config.ts ./prisma-cli/prisma.config.ts
ENV PRISMA_CLI_DIR=/app/prisma-cli

EXPOSE 3000

CMD ["node", "server.js"]
