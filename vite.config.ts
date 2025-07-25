import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    checker({
      typescript: {
        enabled: false, // Only enable in development
        buildMode: true, // Ensure it runs during build in development
      },
      eslint: {
        enabled: false, // Disable eslint if you want
      },
    }),
  ],
});
