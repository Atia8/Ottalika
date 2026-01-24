// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // Frontend on port 3000
    open: true    // Auto-open browser
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
})