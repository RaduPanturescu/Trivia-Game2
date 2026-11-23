import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

/** Serves the untouched legacy site from legacy/ for side-by-side comparison. */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  server: {
    port: 5174,
  },
})
