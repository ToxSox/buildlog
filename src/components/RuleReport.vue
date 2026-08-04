<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { evaluateRules, RULEBOOK_EDITION } from '../data/emmaRules.js'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

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

/** fix/ref sind optional – ohne Eintrag im Katalog wird nichts gerendert. */
function optional(key, params) {
  const value = t(key, params)
  return value === key ? '' : value
}
const fixText = (f) => optional(f.fixKey || `${f.key}.fix`, f.params)
const refText = (f) => optional(`${f.key}.ref`, f.params)
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
        <p class="flex flex-wrap items-center gap-2 text-sm font-bold" :class="styles[f.severity].title">
          <span>{{ t(`${f.key}.title`, f.params) }}</span>
          <span
            class="badge"
            :class="f.source === 'praxis' ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white'"
            :title="
              f.source === 'praxis'
                ? t('rules.badgePraxisTitle')
                : t('rules.badgeRulebookTitle', { edition: RULEBOOK_EDITION })
            "
          >
            {{ f.source === 'praxis' ? t('rules.badgePraxis') : t('rules.badgeRulebook') }}
          </span>
        </p>
        <p class="text-xs leading-relaxed" :class="styles[f.severity].text">
          {{ t(`${f.key}.message`, f.params) }}
        </p>
        <p v-if="fixText(f)" class="mt-1 text-xs font-semibold" :class="styles[f.severity].text">
          → {{ fixText(f) }}
        </p>
        <p v-if="refText(f)" class="mt-1 text-[11px] italic opacity-75" :class="styles[f.severity].text">
          {{ refText(f) }}
        </p>
      </div>
    </div>
  </div>
</template>
