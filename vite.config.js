import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8090",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:8090",
        changeOrigin: true,
      },
      "/admin": {
        target: "http://localhost:8090",
        changeOrigin: true,
      },
    },
    "/oauth2": {
      target: "http://localhost:8090", // 👈 여기도 8090이어야 합니다!
      changeOrigin: true,
    },
  },
});
