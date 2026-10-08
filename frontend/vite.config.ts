import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/overview': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/demand': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/consumers': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/anomalies': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/forecast': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/household': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/households': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
