import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  base: "/",
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      "/socket.io": {
        target:
          process.env.NODE_ENV === "production"
            ? "https://b1.kalliq.com"
            : "http://localhost:3000",
        ws: true,
      },
      // "/api": {
      //   target: "http://localhost:3000", 
      //   changeOrigin: true,
      //   secure: false,
      // },
    },
  },
});
