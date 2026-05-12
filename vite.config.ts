import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/app-icon.svg", "icons/maskable-icon.svg"],
      manifest: {
        short_name: "背单词",
        name: "四六级地铁背单词",
        description: "适合地铁通勤使用的四六级背单词 PWA。",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f6f8fb",
        theme_color: "#1769aa",
        lang: "zh-CN",
        icons: [
          {
            src: "/icons/app-icon.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/maskable-icon.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,txt,woff2,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
    }),
  ],
});
