import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  base: './',
  /** Versionsnummer aus package.json – erscheint im Seitenfuß und im Ausdruck. */
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    vue(),
    tailwindcss(),
    /**
     * Auf dem Showplatz gibt es oft kein Netz – genau dort wird die App
     * gebraucht. Der Service Worker legt alle Build-Assets im Precache ab,
     * inklusive der nachgeladenen mermaid-Chunks.
     */
    VitePWA({
      /**
       * Bewusst 'prompt' statt 'autoUpdate': Bei autoUpdate uebernimmt der neue
       * Worker still im Hintergrund, und bis er die Kontrolle hat, liefert der
       * alte weiter die alten Dateien aus – in Safari brauchte es dafuer
       * mehrere Reloads, ohne dass der Nutzer wusste, worauf er wartet. Jetzt
       * meldet die App die neue Version sichtbar und laedt sie auf Klick.
       */
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // mermaid + Abhängigkeiten sind groß, sollen aber offline verfügbar sein.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'EMMA Build Log Creator',
        short_name: 'Build Log',
        description:
          'Geführter Assistent für EMMA-konforme Car-HiFi-Einbaudokumentationen. Läuft komplett offline im Browser.',
        lang: 'de',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f1f5f9',
        theme_color: '#0f172a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
