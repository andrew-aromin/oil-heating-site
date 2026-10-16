// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    site: 'https://andrew-aromin.github.io',
    base: '/oil-heating-site',
    plugins: [tailwindcss()],
    output: 'static'
  }
});