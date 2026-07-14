import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy tất cả request /api/* sang BE localhost:7117
      // Giải quyết cả CORS lẫn HTTPS self-signed certificate
      '/api': {
        target: 'https://localhost:7117',
        changeOrigin: true,
        secure: false, // Bỏ qua lỗi self-signed HTTPS cert
      },
    },
  },
})
