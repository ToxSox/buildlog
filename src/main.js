import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './style.css'
import './print/print.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Service Worker: macht die App auf dem Showplatz auch ohne Netz startklar.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch((err) => console.warn('[emma] Offline-Modus nicht verfügbar', err))
}
