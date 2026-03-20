import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Если бэкенд крутится локально на порту 8787 (или другом) — раскомментируй и укажи свой порт:
      // '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
});
