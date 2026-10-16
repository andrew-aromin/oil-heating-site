// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://andrew-aromin.github.io',
  base: '/oil-heating-site',
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  }
});