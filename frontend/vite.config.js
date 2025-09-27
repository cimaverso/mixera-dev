import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.pdf'],
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
  }
})