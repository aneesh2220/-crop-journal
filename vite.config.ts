import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Vite ignores PORT and always defaults to 5173, so two dev servers on one
    // machine silently land on different ports than whatever started them expects.
    // Honouring PORT lets the caller decide, while keeping 5173 as the default.
    port: Number(process.env.PORT) || 5173,
  },
})
