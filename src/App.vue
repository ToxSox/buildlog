<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from './stores/project.js'
import { requestPersistence } from './utils/storage.js'
import { updateReady, applyUpdate } from './utils/appUpdate.js'
import AppHeader from './components/AppHeader.vue'
import { useI18n } from './i18n/index.js'

const { t } = useI18n()

const route = useRoute()
const store = useProjectStore()

const isPrintRoute = computed(() => Boolean(route.meta.print))
const version = __APP_VERSION__

onMounted(() => {
  if (!store.ready) store.load()
  // Gleich beim Start anfordern, nicht erst in der Prüfansicht: Fotos sammeln
  // sich ab Schritt 1 an, und ohne persistenten Speicher räumt der Browser die
  // Mappe bei Platzmangel weg.
  requestPersistence()
})
</script>

<template>
  <div v-if="isPrintRoute">
    <router-view />
  </div>

  <div v-else class="min-h-screen flex flex-col">
    <AppHeader class="wizard-ui" />

    <!-- Neue Version bereit: Ohne diesen Hinweis merkte niemand, dass er auf
         einem alten Stand arbeitet – und mehrfaches Neuladen half nur zufällig. -->
    <div
      v-if="updateReady"
      role="status"
      data-testid="update-banner"
      class="wizard-ui flex flex-wrap items-center justify-center gap-3 border-b border-sky-200 bg-sky-50 px-4 py-2 text-center text-sm text-sky-900"
    >
      <span>{{ t('app.updateReady') }}</span>
      <button type="button" class="btn-primary btn-xs" @click="applyUpdate">
        {{ t('app.updateNow') }}
      </button>
    </div>

    <!-- Auf jeder Seite und in jeder Breite sichtbar: Wenn der Autosave
         scheitert, liegen die Eingaben nur noch im RAM. Bisher stand das
         ausschließlich in der Prüfansicht. -->
    <div
      v-if="store.storageError"
      role="alert"
      data-testid="storage-banner"
      class="wizard-ui border-b border-rose-200 bg-rose-50 px-4 py-2 text-center text-sm text-rose-800"
    >
      <strong class="font-bold">{{ t('storage.bannerTitle') }}</strong>
      {{ store.storageError }}
    </div>

    <main class="flex-1 w-full max-w-6xl mx-auto px-4 py-6 pb-24">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="wizard-ui border-t border-slate-200 bg-white/70 py-3 text-center text-xs text-slate-500">
      <p>{{ t('app.footer') }} · v{{ version }}</p>
      <p class="mt-1 px-4 text-[11px] text-slate-400">{{ t('app.disclaimer') }}</p>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
