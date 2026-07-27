import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Il dominio definitivo sarà magicbones.it; finché non è collegato, la build
// di produzione pubblica su GitHub Pages come sottopercorso di progetto
// (https://daniloflex596.github.io/magicbones/), quindi site/base cambiano
// in base a GITHUB_PAGES (settata solo dal workflow CI di deploy).
const isGithubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: isGithubPages ? 'https://daniloflex596.github.io' : 'https://magicbones.it',
  base: isGithubPages ? '/magicbones' : '/',
  integrations: [react(), sitemap()],
  vite: {
    css: {
      devSourcemap: true,
    },
  },
});
