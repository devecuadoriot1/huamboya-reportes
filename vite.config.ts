import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Force IPv4 to avoid ::1 binding issues on Windows
    host: '127.0.0.1',
    // Use a port unlikely to be excluded or reserved
    port: 5175,
  },
  preview: {
    host: '127.0.0.1',
    port: 4175,
  },
})
