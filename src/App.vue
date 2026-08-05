<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from './stores/project.js'
import AppHeader from './components/AppHeader.vue'
import { useI18n } from './i18n/index.js'

const { t } = useI18n()

const route = useRoute()
const store = useProjectStore()

const isPrintRoute = computed(() => Boolean(route.meta.print))
const version = __APP_VERSION__

onMounted(() => {
  if (!store.ready) store.load()
})
</script>

<template>
  <div v-if="isPrintRoute">
    <router-view />
  </div>

  <div v-else class="min-h-screen flex flex-col">
    <AppHeader class="wizard-ui" />

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
