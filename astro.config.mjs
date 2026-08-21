import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { copyFile } from 'node:fs/promises';

const preserveSitemapUrl = () => ({
  name: 'dmca-vision-sitemap-url',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await copyFile(new URL('sitemap-0.xml', dir), new URL('sitemap.xml', dir));
    }
  }
});

export default defineConfig({
  site: 'https://dmcavision.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap(), preserveSitemapUrl()]
});
