import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dmcavision.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' }
});
