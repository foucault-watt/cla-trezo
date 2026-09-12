import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nécessaire pour le build Docker (serveur Node autonome et minimal), mais
  // incompatible avec le build Vercel qui a son propre packaging serverless
  // et échoue si ce mode est actif. Vercel injecte VERCEL=1 pendant son build.
  output: process.env.VERCEL ? undefined : "standalone",
  experimental: {
    serverActions: {
      // Jusqu'à 10 Justificatifs de 10 Mo par soumission (cf. T10), plus la
      // marge multipart/form-data (boundaries, en-têtes de parties).
      bodySizeLimit: "110mb",
    },
  },
};

export default nextConfig;
