import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/DBmerger/',
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000
  }
})
