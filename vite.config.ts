import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development"].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the rarely-changing vendor libs into their own chunk so they
        // cache independently of our app code (and download in parallel).
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          data: ["@tanstack/react-query"],
        },
      },
    },
  },
}));
