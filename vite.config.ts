import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// VITE_BASE : chemin de publication. « ./ » fonctionne en local et sur
// GitHub Pages (routage par hash) ; on peut forcer « /nom-du-depot/ ».
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE || './',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // Script d'enregistrement différé : il ne bloque pas le premier affichage.
        injectRegister: 'script-defer',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Chalet Guide',
          short_name: 'Chalet Guide',
          description: 'Livret d’accueil digital bilingue, utilisable hors ligne.',
          lang: 'fr',
          start_url: '.',
          scope: '.',
          display: 'standalone',
          background_color: '#f3eee4',
          theme_color: '#1f3a2e',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Application, guides (inclus dans le JS), polices et icônes : disponibles hors ligne
          // dès la première visite. Le registre des établissements (≈ 4 Mo, outil de
          // prospection) n'est pas pré-chargé : il est mis en cache s'il est consulté.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
          // Polices : seulement les sous-ensembles latins (français, anglais).
          globIgnores: ['data/**', '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Tuiles de carte déjà vues, consultables hors ligne (usage modéré, politique OSM).
              urlPattern: ({ url }) => url.hostname === 'tile.openstreetmap.org',
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles',
                expiration: { maxEntries: 400, maxAgeSeconds: 30 * 24 * 3600 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes('/data/etablissements/'),
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'etablissements', expiration: { maxEntries: 30 } },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    build: { target: 'es2022', sourcemap: false },
    test: { include: ['tests/**/*.test.ts'] },
  }
})
