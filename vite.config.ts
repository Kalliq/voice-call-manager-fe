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
            ? "https://p1.echo-o.com"
            : "http://localhost:3000",
        ws: true,
      },
    },
  },
});
