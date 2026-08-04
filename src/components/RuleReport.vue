<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { evaluateRules } from '../data/emmaRules.js'

const props = defineProps({
  step: { type: String, default: '' },
  showOk: { type: Boolean, default: true },
})

const store = useProjectStore()

const findings = computed(() => {
  const all = evaluateRules(store.project)
  const scoped = props.step ? all.filter((f) => f.step === props.step) : all
  return props.showOk ? scoped : scoped.filter((f) => f.severity !== 'ok')
})

const order = { error: 0, warn: 1, info: 2, ok: 3 }
const sorted = computed(() => [...findings.value].sort((a, b) => order[a.severity] - order[b.severity]))

const styles = {
  error: { box: 'border-rose-300 bg-rose-50', title: 'text-rose-900', text: 'text-rose-800', icon: '⛔' },
  warn: { box: 'border-amber-300 bg-amber-50', title: 'text-amber-900', text: 'text-amber-800', icon: '⚠️' },
  info: { box: 'border-sky-200 bg-sky-50', title: 'text-sky-900', text: 'text-sky-800', icon: 'ℹ️' },
  ok: { box: 'border-emerald-200 bg-emerald-50', title: 'text-emerald-900', text: 'text-emerald-800', icon: '✅' },
}
</script>

<template>
  <div v-if="sorted.length" class="space-y-2">
    <div
      v-for="f in sorted"
      :key="f.id"
      class="flex gap-3 rounded-lg border px-3 py-2.5"
      :class="styles[f.severity].box"
    >
      <span class="text-lg leading-none">{{ styles[f.severity].icon }}</span>
      <div class="min-w-0">
        <p class="text-sm font-bold" :class="styles[f.severity].title">{{ f.title }}</p>
        <p class="text-xs leading-relaxed" :class="styles[f.severity].text">{{ f.message }}</p>
        <p v-if="f.fix" class="mt-1 text-xs font-semibold" :class="styles[f.severity].text">
          → {{ f.fix }}
        </p>
      </div>
    </div>
  </div>
</template>
