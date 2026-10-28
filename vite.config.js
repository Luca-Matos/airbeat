import { defineConfig } from 'vite';

// No GitHub Pages o site fica em /<repositório>/. O workflow de deploy define
// BASE_PATH com o nome do repositório; em desenvolvimento a base é a raiz.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
