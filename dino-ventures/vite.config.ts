import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 👈 Import this

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isGitHub = env.GITHUB_ACTIONS === 'true';

  return {
    base: isGitHub ? "/family-tree/" : "/",
    plugins: [
      react(),
      // 👇 ADD THIS PWA CONFIGURATION
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true, // Enable caching even in dev mode (localhost)
          type: 'module',
        },
        workbox: {// 👇 1. FORCE CONTROL IMMEDIATELY
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // 1. Match any URL that starts with your image provider
urlPattern: ({ url }) => url.origin === 'https://v3.fal.media',              
              // 2. Strategy: Check Cache First, then Network
              handler: 'CacheFirst', 
              
              options: {
                cacheName: 'fal-images-cache', // Name of the folder in Chrome
                expiration: {
                  maxEntries: 500,               // Keep up to 500 images
                  maxAgeSeconds: 60 * 60 * 24 * 365 // Keep for 1 Year
                },
                cacheableResponse: {
                  statuses: [0, 200] // Cache successful responses
                }
              }
            }
          ]
        }
      })
    ],
    server: {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  }
})