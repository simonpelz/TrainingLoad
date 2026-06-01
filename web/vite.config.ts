import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// On GitHub Pages a project site is served from /<repo>/.
// CI sets GITHUB_PAGES=1 so the built asset paths are correct.
const base = process.env.GITHUB_PAGES ? '/TrainingLoad/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
