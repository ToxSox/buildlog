<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project.js'
import { neighbours } from '../data/steps.js'
import { useScore } from '../composables/useScore.js'
import SkipDialog from './SkipDialog.vue'

const props = defineProps({
  stepKey: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

const router = useRouter()
const store = useProjectStore()
const { missingForStep } = useScore()

const nav = computed(() => neighbours(store.column, props.stepKey))
const missing = computed(() => missingForStep(props.stepKey))
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
  missing.value.forEach((slot) => store.skip(slot.key))
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
          Schritt {{ nav.index + 1 }} von {{ nav.total }}
        </p>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 max-w-2xl text-sm text-slate-600">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>

    <slot />

    <div class="wizard-ui sticky bottom-0 -mx-4 mt-8 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div class="flex items-center justify-between gap-3">
        <button type="button" class="btn-ghost" :disabled="!nav.prev" @click="goPrev">
          ← <span class="hidden sm:inline">{{ nav.prev?.label || 'Zurück' }}</span>
        </button>

        <p v-if="missing.length" class="hidden text-xs text-amber-700 sm:block">
          {{ missing.length }} Pflichtfoto{{ missing.length === 1 ? '' : 's' }} fehlt noch
        </p>

        <button v-if="nav.next" type="button" class="btn-primary" @click="goNext">
          <span class="hidden sm:inline">{{ nav.next.label }}</span><span class="sm:hidden">Weiter</span> →
        </button>
        <router-link v-else to="/druck" class="btn-primary">Druckansicht öffnen →</router-link>
      </div>
    </div>

    <SkipDialog
      :open="dialogOpen"
      :missing="missing"
      @close="dialogOpen = false"
      @skip="skipAll"
    />
  </div>
</template>
