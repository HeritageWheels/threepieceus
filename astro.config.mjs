// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://gallery.threepiece.us",
  adapter: vercel({
    imageService: true,
    isr: {
      expiration: 60 * 60 * 24,
      // /api/cart/:id mints a single-use BigCommerce checkout redirect per
      // click — caching it would serve every visitor the same consumed token.
      exclude: [/^\/api\/cart\/.+/],
    },
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
