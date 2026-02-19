import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    watch: {
      usePolling: true, // Útil para que los cambios en Windows se vean en Docker
    },
    host: true, // Necesario para exponer el puerto
    strictPort: true,
  }
})