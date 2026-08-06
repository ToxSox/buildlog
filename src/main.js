import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { updateReady, setUpdater } from './utils/appUpdate.js'
import './style.css'
import './print/print.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Service Worker: macht die App auf dem Showplatz auch ohne Netz startklar.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          updateReady.value = true
        },
        onRegisteredSW(_swUrl, registration) {
          if (!registration) return
          // Von sich aus sucht der Browser nur beim Navigieren nach einer neuen
          // Version – in Safari brauchte es dafür mehrere Reloads. Deshalb bei
          // jeder Rückkehr zur App und stündlich aktiv nachfragen.
          const check = () => registration.update().catch(() => {})
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') check()
          })
          globalThis.addEventListener?.('online', check)
          setInterval(check, 60 * 60 * 1000)
        },
      })
      setUpdater(updateSW)
    })
    .catch((err) => console.warn('[emma] Offline-Modus nicht verfügbar', err))
}
