import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    manifest: true,
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
  },
})
