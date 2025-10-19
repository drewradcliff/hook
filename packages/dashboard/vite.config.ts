import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/_dashboard/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    proxy: {
      "/_api": {
        target: "http://localhost:3420",
        changeOrigin: true,
      },
    },
  },
});
