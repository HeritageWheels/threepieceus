// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  adapter: vercel({
    imageService: true,
  }),
  image: {
    // Allow Astro / Vercel to transform remote HTTPS images (gallery API, CDNs, tire product images).
    remotePatterns: [{ protocol: "https" }],
  },
  output: "server",
});
