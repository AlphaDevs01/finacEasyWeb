import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FinancEasy',
        short_name: 'FinancEasy',
        description: 'Gerencie suas finanças de forma fácil e eficiente.',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#2d3748',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Você pode customizar aqui se quiser
      },
      includeAssets: [
        '/android-chrome-192x192.png',
        '/android-chrome-512x512.png',
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // Adicione esta linha para proxy das rotas API para o backend
    },
  },
});
