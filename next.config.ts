import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nécessaire pour le build Docker (serveur Node autonome et minimal), mais
  // incompatible avec le build Vercel qui a son propre packaging serverless
  // et échoue si ce mode est actif. Vercel injecte VERCEL=1 pendant son build.
  output: process.env.VERCEL ? undefined : "standalone",
  // Polices et logos des PDF : React PDF les lit sur le disque à l'exécution,
  // via un chemin que le build ne sait pas suivre. Sans cette ligne, ils
  // manquent dans la sortie `standalone` et la génération de PDF échoue.
  outputFileTracingIncludes: {
    "/*": ["./pdf-lab/templates/*/assets/**/*"],
  },
  experimental: {
    serverActions: {
      // Jusqu'à 10 Justificatifs de 10 Mo par soumission (cf. T10), plus la
      // marge multipart/form-data (boundaries, en-têtes de parties).
      bodySizeLimit: "110mb",
    },
  },
};

export default nextConfig;
