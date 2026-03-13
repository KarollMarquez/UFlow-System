import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.png', 'icon-192.png', 'icon-512.png', 'robots.txt', 'sitemap.xml'],
          manifest: {
            name: 'uFlow — Tu copiloto financiero personal',
            short_name: 'uFlow',
            description: 'Registra gastos con IA, gestiona múltiples cuentas y toma decisiones con datos reales.',
            lang: 'es',
            theme_color: '#7C5CFF',
            background_color: '#0B0B12',
            display: 'standalone',
            start_url: '/',
            scope: '/',
            icons: [
              { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
              { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
              { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api\//],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
