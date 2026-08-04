<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { allSlots, isSlotRequired } from '../data/sections.js'
import { evaluateRules, summarize } from '../data/emmaRules.js'
import { useScore } from '../composables/useScore.js'
import WizardShell from '../components/WizardShell.vue'
import RuleReport from '../components/RuleReport.vue'
import ArchiveTools from '../components/ArchiveTools.vue'
import StorageStatus from '../components/StorageStatus.vue'

const store = useProjectStore()
const { percent, level, missingRequired, assessment, column, columnLabel } = useScore()

const findings = computed(() => summarize(evaluateRules(store.project)))

const checklist = computed(() =>
  allSlots(store.column, store.mode).map((slot) => ({
    key: slot.key,
    label: slot.label,
    step: slot.section.step,
    section: slot.section.title,
    required: isSlotRequired(slot, store.column),
    count: store.mediaFor(slot.key).length,
    skipped: store.isSkipped(slot.key),
  })),
)

const grouped = computed(() => {
  const map = new Map()
  checklist.value.forEach((item) => {
    if (!map.has(item.section)) map.set(item.section, [])
    map.get(item.section).push(item)
  })
  return [...map.entries()]
})
</script>

<template>
  <WizardShell
    step-key="review"
    title="Prüfen & Export"
    subtitle="Letzte Kontrolle vor dem Druck: Was fehlt, was ist kritisch, was ist bereit?"
  >
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="card card-body">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          {{ column ? 'Installationspunkte' : 'Pflichtfotos' }}
        </p>
        <p class="mt-1 text-3xl font-black text-slate-900">
          {{ assessment.earned || percent }}<span class="text-lg text-slate-400">/{{ assessment.max || 100 }}</span>
        </p>
        <p class="text-xs text-slate-500">{{ columnLabel || level }}</p>
      </div>
      <div class="card card-body">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Kritische Befunde</p>
        <p class="mt-1 text-3xl font-black" :class="findings.errors.length ? 'text-rose-600' : 'text-emerald-600'">
          {{ findings.errors.length }}
        </p>
        <p class="text-xs text-slate-500">Disqualifikationsgefahr</p>
      </div>
      <div class="card card-body">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Fehlende Pflichtfotos</p>
        <p class="mt-1 text-3xl font-black" :class="missingRequired.length ? 'text-amber-600' : 'text-emerald-600'">
          {{ missingRequired.length }}
        </p>
        <p class="text-xs text-slate-500">von {{ checklist.filter((c) => c.required).length }} Pflicht-Slots</p>
      </div>
    </div>

    <div class="card border-sky-200">
      <div class="card-header">
        <div>
          <h2 class="section-title">Ausdruck & Archiv</h2>
          <p class="mt-0.5 text-sm text-slate-600">
            Die Druckansicht erzeugt ein DIN-A4-Querformat-Dokument. Dein Browser rendert daraus direkt ein
            PDF – zum Speichern, Teilen oder Ausdrucken.
          </p>
        </div>
      </div>
      <div class="card-body space-y-4">
        <router-link to="/druck" class="btn-primary">🖨️ Druckansicht öffnen</router-link>
        <ArchiveTools />
        <StorageStatus />
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Regelwerk-Prüfung</h2>
      </div>
      <div class="card-body">
        <RuleReport />
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Foto-Checkliste</h2>
      </div>
      <div class="card-body space-y-4">
        <div v-for="[section, items] in grouped" :key="section">
          <p class="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">{{ section }}</p>
          <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
            <li v-for="item in items" :key="item.key" class="flex items-center gap-3 px-3 py-2">
              <span class="text-base">
                {{ item.count ? '✅' : item.required ? '⛔' : '○' }}
              </span>
              <span class="min-w-0 flex-1 truncate text-sm text-slate-700">{{ item.label }}</span>
              <span v-if="item.count" class="badge bg-emerald-100 text-emerald-700">{{ item.count }} Foto(s)</span>
              <span v-else-if="item.skipped" class="badge bg-slate-200 text-slate-600">übersprungen</span>
              <span v-else-if="item.required" class="badge bg-rose-100 text-rose-700">fehlt</span>
              <span v-else class="badge bg-slate-100 text-slate-500">optional</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </WizardShell>
</template>
