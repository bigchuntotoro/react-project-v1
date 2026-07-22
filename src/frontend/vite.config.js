import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Vite 기본 포트 (필요 시 변경)
    proxy: {
      // '/api'로 시작하는 요청을 Spring Boot 백엔드 서버로 전달합니다.
      "/api": {
        target: "http://localhost:8080", // Spring Boot 포트
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
