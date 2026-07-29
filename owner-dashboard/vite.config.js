import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('./app', import.meta.url))
const outDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  plugins: [react()],
  build: { outDir, emptyOutDir: false }
})
