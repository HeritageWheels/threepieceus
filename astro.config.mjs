// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://gallery.threepiece.us",
  adapter: vercel({
    imageService: true,
    // isr: true,
  }),
  image: {
    // Allow Astro / Vercel to transform remote HTTPS images (gallery API, CDNs, tire product images).
    remotePatterns: [
      { protocol: "https" },
      { protocol: "http", hostname: "34.36.52.148" },
    ],
  },
  compressHTML: false,
  output: "server",
});
