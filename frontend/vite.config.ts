import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Target бекенду для proxy. У Docker — http://backend:8000 (DNS-імʼя сервісу),
// локально — http://localhost:8000. Перевизначається через env BACKEND_URL.
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // open=true відкриває браузер локально, у Docker xdg-open відсутній —
    // через VITE_NO_OPEN вимикаємо (Compose його встановлює).
    open: !process.env.VITE_NO_OPEN,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/media': { target: BACKEND, changeOrigin: true },
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
