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
import { useI18n } from '../i18n/index.js'

const { t, tx } = useI18n()

const store = useProjectStore()
const { level, missingRequired, assessment, column, columnLabel, photos } = useScore()

const findings = computed(() => summarize(evaluateRules(store.project)))

const checklist = computed(() =>
  allSlots(store.column, store.mode).map((slot) => ({
    key: slot.key,
    label: tx(slot.label),
    step: slot.section.step,
    section: tx(slot.section.title),
    required: isSlotRequired(slot, store.column),
    count: store.mediaFor(slot.key).length,
    skipped: store.isSkipped(slot.key),
    visible: store.isVisibleNoPhoto(slot.key),
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
  <WizardShell step-key="review" :title="t('steps.review')" :subtitle="t('review.subtitle')">
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="card card-body">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          {{ column ? t('review.installPoints') : t('review.requiredPhotos') }}
        </p>
        <!-- ohne Kategorie gibt es keine Matrixpunkte: dann die echten Fotozahlen statt einer Prozentzahl -->
        <p class="mt-1 text-3xl font-black text-slate-900">
          {{ column ? assessment.earned : photos.done
          }}<span class="text-lg text-slate-400">/{{ column ? assessment.max : photos.total }}</span>
        </p>
        <p class="text-xs text-slate-500">{{ columnLabel || level }}</p>
      </div>
      <div class="card card-body">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          {{ t('review.criticalFindings') }}
        </p>
        <p
          class="mt-1 text-3xl font-black"
          :class="findings.errors.length ? 'text-rose-600' : 'text-emerald-600'"
        >
          {{ findings.errors.length }}
        </p>
        <p class="text-xs text-slate-500">{{ t('review.criticalHint') }}</p>
      </div>
      <div class="card card-body">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          {{ t('review.missingPhotos') }}
        </p>
        <p
          class="mt-1 text-3xl font-black"
          :class="missingRequired.length ? 'text-amber-600' : 'text-emerald-600'"
        >
          {{ missingRequired.length }}
        </p>
        <p class="text-xs text-slate-500">
          {{ t('review.ofSlots', { n: checklist.filter((c) => c.required).length }) }}
        </p>
      </div>
    </div>

    <div class="card border-sky-200">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('review.exportSection') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('review.exportHint') }}</p>
        </div>
      </div>
      <div class="card-body space-y-4">
        <router-link to="/druck" class="btn-primary">{{ t('review.openPrint') }}</router-link>
        <ArchiveTools />
        <StorageStatus />
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">{{ t('review.rulesSection') }}</h2>
      </div>
      <div class="card-body">
        <RuleReport />
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">{{ t('review.checklist') }}</h2>
      </div>
      <div class="card-body space-y-4">
        <div v-for="[section, items] in grouped" :key="section">
          <p class="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">{{ section }}</p>
          <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
            <li v-for="item in items" :key="item.key" class="flex items-center gap-3 px-3 py-2">
              <span class="text-base">
                {{ item.count ? '✅' : item.visible ? '👁️' : item.required ? '⛔' : '○' }}
              </span>
              <span class="min-w-0 flex-1 truncate text-sm text-slate-700">{{ item.label }}</span>
              <span v-if="item.count" class="badge bg-emerald-100 text-emerald-700">{{
                t('common.photos', { n: item.count })
              }}</span>
              <span v-else-if="item.visible" class="badge bg-emerald-100 text-emerald-700">{{
                t('uploader.visibleBadge')
              }}</span>
              <span v-else-if="item.skipped" class="badge bg-slate-200 text-slate-600">{{
                t('common.skipped')
              }}</span>
              <span v-else-if="item.required" class="badge bg-rose-100 text-rose-700">{{
                t('common.missing')
              }}</span>
              <span v-else class="badge bg-slate-100 text-slate-500">{{ t('common.optional') }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </WizardShell>
</template>
