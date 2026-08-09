<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project.js'
import { neighbours } from '../data/steps.js'
import { useScore } from '../composables/useScore.js'
import SkipDialog from './SkipDialog.vue'
import { useI18n } from '../i18n/index.js'

const props = defineProps({
  stepKey: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

const router = useRouter()
const store = useProjectStore()
const { missingForStep, missingMetaForStep } = useScore()
const { t } = useI18n()

const nav = computed(() => neighbours(store.column, props.stepKey))
/*
 * Fehlende Stammdaten stehen bewusst in derselben Liste wie fehlende Fotos.
 * Die App lebt vom „überspringen und später ergänzen“ – ein eigener
 * Pflichtfeld-Alarm wäre eine zweite Unterbrechung an einer Stelle, an der es
 * schon eine gibt. Der Nutzer entscheidet einmal, informiert, und sieht es auf
 * diesem Schritt nie wieder.
 */
const missing = computed(() => [...missingMetaForStep(props.stepKey), ...missingForStep(props.stepKey)])
const dialogOpen = ref(false)

function goNext() {
  if (missing.value.length) {
    dialogOpen.value = true
    return
  }
  proceed()
}

function proceed() {
  dialogOpen.value = false
  if (nav.value.next) router.push(nav.value.next.path)
}

function skipAll() {
  // Nur echte Foto-Slots bekommen einen Skip-Eintrag: Ein Textfeld hat keinen
  // Slot, ein Vermerk darauf landete als Geisteintrag in der Mappe.
  missing.value.filter((slot) => !slot.meta).forEach((slot) => store.skip(slot.key))
  proceed()
}

function goPrev() {
  if (nav.value.prev) router.push(nav.value.prev.path)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-sky-600">
          {{ t('common.step', { index: nav.index + 1, total: nav.total }) }}
        </p>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 max-w-2xl text-sm text-slate-600">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>

    <slot />

    <div
      class="wizard-ui sticky bottom-0 -mx-4 mt-8 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"
    >
      <div class="flex items-center justify-between gap-3">
        <button type="button" class="btn-ghost" :disabled="!nav.prev" @click="goPrev">
          ← <span class="hidden sm:inline">{{ nav.prev ? t(nav.prev.labelKey) : t('common.back') }}</span>
        </button>

        <!-- Der Hinweis war `hidden sm:block`, also unsichtbar genau auf dem
             Telefon, wo man am Auto arbeitet. Am Handy nur die Zahl, damit die
             Zeile zwischen den beiden Knöpfen nicht seitlich aufreißt. -->
        <p v-if="missing.length" class="min-w-0 truncate text-xs font-semibold text-amber-700">
          <span class="hidden sm:inline">{{ t('skip.stillMissing', { n: missing.length }) }}</span>
          <span class="sm:hidden" :aria-label="t('skip.stillMissing', { n: missing.length })"
            >⚠ {{ missing.length }}</span
          >
        </p>

        <button v-if="nav.next" type="button" class="btn-primary" @click="goNext">
          <span class="hidden sm:inline">{{ t(nav.next.labelKey) }}</span
          ><span class="sm:hidden">{{ t('common.next') }}</span> →
        </button>
        <router-link v-else to="/druck" class="btn-primary">{{ t('review.openPrint') }}</router-link>
      </div>
    </div>

    <SkipDialog :open="dialogOpen" :missing="missing" @close="dialogOpen = false" @skip="skipAll" />
  </div>
</template>
