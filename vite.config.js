import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // O front chama /api/... na mesma origem e o Vite repassa para a API Node.
    // Assim o cookie de sessão funciona sem CORS e sem configuração extra.
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
})
