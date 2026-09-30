FROM node:22.14-bookworm-slim

WORKDIR /app

# Prisma / TLS
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

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

# Build Next.js
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["npm", "start"]