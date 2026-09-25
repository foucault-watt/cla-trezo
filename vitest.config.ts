import "dotenv/config";
import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    // `next build` (output: "standalone") recopie le projet, tests compris,
    // dans .next/standalone avec un node_modules élagué (sans sharp natif).
    exclude: [...configDefaults.exclude, ".next/**"],
  },
});
