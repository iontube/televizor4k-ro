import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://televizor4k.ro',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  vite: {
    build: {
      cssMinify: true,
      minify: true,
    },
  },
});
