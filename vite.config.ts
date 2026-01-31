import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import copy from 'rollup-plugin-copy';


export default defineConfig({
  plugins: [react(), svgr(), copy({
    targets: [
      { src: 'CNAME', dest: 'dist' },
    ],
    hook: 'writeBundle',
  })],
  base: "/",
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      "/socket.io": {
        target:
          process.env.NODE_ENV === "production"
            ? "https://b.llxpress.com"
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
