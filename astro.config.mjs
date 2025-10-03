import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  integrations: [tailwind()],
  output: "static", // default for static sites
  server: {
    port: 4321, // or change to any port you like
    host: true
  }
});