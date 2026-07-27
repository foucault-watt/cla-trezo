import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Jusqu'à 10 Justificatifs de 10 Mo par soumission (cf. T10), plus la
      // marge multipart/form-data (boundaries, en-têtes de parties).
      bodySizeLimit: "110mb",
    },
  },
};

export default nextConfig;
