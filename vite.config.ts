import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/tavusapi': {
        target: 'https://tavusapi.com/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tavusapi/, ''),
        secure: true,
      },
    },
  },
});