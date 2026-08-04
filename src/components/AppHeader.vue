<script setup>
import { useI18n } from '../i18n/index.js'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project.js'
import { stepsForColumn } from '../data/steps.js'
import { useScore } from '../composables/useScore.js'
import ProgressBar from './ProgressBar.vue'
import LanguageSwitch from './LanguageSwitch.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectStore()
const { score, maxScore, percent, level, columnLabel, column } = useScore()
const { t, locale } = useI18n()

const steps = computed(() => stepsForColumn(store.column))
const currentKey = computed(() => route.meta.step)
const showWizard = computed(() => store.hasProject && Boolean(route.meta.step))

const savedLabel = computed(() => {
  if (store.saving) return t('app.saving')
  if (!store.lastSavedAt) return t('app.autosave')
  return t('app.savedAt', {
    time: store.lastSavedAt.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' }),
  })
})

function go(step) {
  router.push(step.path)
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
      <router-link to="/" class="flex items-center gap-2 shrink-0">
        <span class="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white text-lg">🔊</span>
        <span class="hidden sm:block leading-tight">
          <span class="block text-sm font-extrabold tracking-tight text-slate-900">{{ t('app.name') }}</span>
          <span class="block text-[11px] text-slate-500">{{ t('app.sub') }}</span>
        </span>
      </router-link>

      <div v-if="store.hasProject" class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-slate-800">{{ store.title }}</p>
        <p class="truncate text-[11px] text-slate-500">
          {{ columnLabel || store.mode
          }}<span v-if="store.project.meta.plate"> · {{ store.project.meta.plate }}</span>
        </p>
      </div>
      <div v-else class="flex-1"></div>

      <div class="hidden md:block w-56">
        <ProgressBar
          :percent="percent"
          :score="score"
          :max="maxScore"
          :level="level"
          :caption="column ? t('app.progress') : t('app.photoProgress')"
        />
      </div>

      <LanguageSwitch class="shrink-0" />

      <span class="hidden lg:inline text-[11px] text-slate-400 whitespace-nowrap">{{ savedLabel }}</span>
    </div>

    <nav v-if="showWizard" class="border-t border-slate-100 bg-slate-50">
      <ol class="max-w-6xl mx-auto flex gap-1 overflow-x-auto px-2 py-2">
        <li v-for="(step, i) in steps" :key="step.key" class="shrink-0">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            :class="
              step.key === currentKey
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            "
            @click="go(step)"
          >
            <span class="grid h-5 w-5 place-items-center rounded-full text-[10px]"
              :class="step.key === currentKey ? 'bg-white/25' : 'bg-slate-200 text-slate-700'">
              {{ i + 1 }}
            </span>
            <span class="hidden sm:inline">{{ t(step.labelKey) }}</span>
            <span class="sm:hidden">{{ t(step.shortKey) }}</span>
          </button>
        </li>
      </ol>
    </nav>

    <div v-if="store.hasProject" class="md:hidden border-t border-slate-100 px-4 py-2">
      <ProgressBar
          :percent="percent"
          :score="score"
          :max="maxScore"
          :level="level"
          :caption="column ? t('app.progress') : t('app.photoProgress')"
        />
    </div>
  </header>
</template>
