<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useScore } from '../composables/useScore.js'
import { uid } from '../data/schema.js'
import { toNumber } from '../data/emmaRules.js'
import { FABRICATION_TECHNIQUES, optionLabel } from '../data/options.js'
import WizardShell from '../components/WizardShell.vue'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

const store = useProjectStore()
const { assessment, column } = useScore()

const pres = computed(() => store.project.presentation)

/** X Unlimited bekommt 15 Minuten, alle anderen 7. */
const minutes = computed(() => (column.value === 'XUNL' ? 15 : 7))

const criterion = computed(() => assessment.value.criteria.find((c) => c.id === 'explanation'))

/**
 * Gesprächsleitfaden aus den bereits erfassten Daten.
 * Das Regelwerk empfiehlt ausdrücklich den Fokus auf „wie und warum gebaut“
 * statt auf Marken und Endergebnis.
 */
const outline = computed(() => {
  const p = store.project
  const blocks = []

  blocks.push({
    minutes: 1,
    title: t('presentation.block.intro'),
    points: [
      pres.value.goal || t('presentation.block.introFallback'),
      p.meta.vehicleMake || p.meta.vehicleModel
        ? t('presentation.block.vehicle', {
            vehicle: [p.meta.vehicleMake, p.meta.vehicleModel, p.meta.vehicleYear].filter(Boolean).join(' '),
          })
        : t('presentation.block.vehicleFallback'),
    ],
  })

  const sig = p.system.components.filter(
    (c) => !['battery', 'distributor', 'fuse', 'ground'].includes(c.type),
  )
  blocks.push({
    minutes: 1,
    title: t('presentation.block.chain'),
    points: sig.length
      ? [sig.map((c) => c.name || c.type).join(' → ')]
      : [t('presentation.block.chainFallback')],
  })

  const powerBits = []
  const section = toNumber(p.power.mainCableSection)
  const amps = toNumber(p.power.mainFuseAmps)
  const distance = toNumber(p.power.mainFuseDistanceCm)
  if (section && amps) {
    powerBits.push(t('presentation.block.powerFuse', { section, amps }))
  }
  // Ein geleertes Feld ergab hier bisher „… sitzt  cm vom Pluspol“.
  if (distance !== null) {
    powerBits.push(t('presentation.block.powerDistance', { cm: distance }))
  }
  if (p.power.groundPoint) powerBits.push(t('presentation.block.powerGround', { point: p.power.groundPoint }))
  blocks.push({
    minutes: 1,
    title: t('presentation.block.power'),
    points: powerBits.length ? powerBits : [t('presentation.block.powerFallback')],
  })

  const custom = p.craft.customParts.filter((c) => c.name)
  blocks.push({
    minutes: 2,
    title: t('presentation.block.craft'),
    points: custom.length
      ? custom.map((c) => {
          const technique = optionLabel(FABRICATION_TECHNIQUES, c.technique)
          return `${c.name}${technique ? ` (${technique})` : ''}${c.purpose ? ` – ${c.purpose}` : ''}`
        })
      : [t('presentation.block.craftFallback')],
  })

  const challengeBits = [pres.value.challenge].filter(Boolean)
  const measures = p.craft.measurements.filter((m) => m.name)
  if (measures.length) {
    challengeBits.push(
      t('presentation.block.challengeMeasure', { list: measures.map((m) => m.name).join(', ') }),
    )
  }
  if (p.craft.tuningNotes) challengeBits.push(t('presentation.block.challengeTuning'))
  blocks.push({
    minutes: minutes.value === 15 ? 8 : 1,
    title: t('presentation.block.challenge'),
    points: challengeBits.length ? challengeBits : [t('presentation.block.challengeFallback')],
  })

  const bonus = p.bonusRequests.filter((r) => r.title)
  if (bonus.length) {
    blocks.push({
      minutes: 1,
      title: t('presentation.block.bonus'),
      points: bonus.map((r) => r.title),
    })
  }

  blocks.push({
    minutes: 1,
    title: t('presentation.block.outro'),
    points: [pres.value.story || t('presentation.block.outroFallback'), t('presentation.block.outroWait')],
  })

  return blocks
})

const plannedMinutes = computed(() => outline.value.reduce((sum, b) => sum + b.minutes, 0))

function addHighlight() {
  pres.value.highlights.push({ id: uid('hl'), text: '' })
}
function removeHighlight(id) {
  const idx = pres.value.highlights.findIndex((h) => h.id === id)
  if (idx >= 0) pres.value.highlights.splice(idx, 1)
}
</script>

<template>
  <WizardShell
    step-key="presentation"
    :title="t('steps.presentation')"
    :subtitle="t('presentation.subtitle')"
  >
    <div class="card card-body flex flex-wrap items-center justify-between gap-4 border-sky-200 bg-sky-50">
      <div>
        <p class="text-sm font-bold text-sky-900">
          {{ t('presentation.budget', { minutes }) }}
          <span v-if="criterion"> · {{ t('presentation.points', { points: criterion.max }) }}</span>
        </p>
        <p class="text-xs text-sky-800">
          {{ t('presentation.rules') }}
        </p>
      </div>
      <p
        class="text-xs font-semibold"
        :class="plannedMinutes > minutes ? 'text-rose-700' : 'text-emerald-700'"
      >
        {{ t('presentation.planned', { minutes: plannedMinutes }) }}
      </p>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('presentation.thread') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('presentation.threadHint') }}</p>
        </div>
      </div>
      <div class="card-body grid gap-4">
        <div>
          <label class="field" for="goal">{{ t('presentation.goal') }}</label>
          <input
            id="goal"
            v-model="pres.goal"
            class="input"
            :placeholder="t('presentation.goalPlaceholder')"
          />
        </div>
        <div>
          <label class="field" for="challenge">{{ t('presentation.challenge') }}</label>
          <textarea
            id="challenge"
            v-model="pres.challenge"
            class="textarea"
            :placeholder="t('presentation.challengePlaceholder')"
          />
        </div>
        <div>
          <label class="field" for="story">{{ t('presentation.story') }}</label>
          <textarea
            id="story"
            v-model="pres.story"
            class="textarea"
            :placeholder="t('presentation.storyPlaceholder')"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('presentation.highlights') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('presentation.highlightsHint') }}</p>
        </div>
        <button type="button" class="btn-soft btn-xs" @click="addHighlight">
          {{ t('presentation.addDetail') }}
        </button>
      </div>
      <div class="card-body space-y-2">
        <p v-if="!pres.highlights.length" class="text-sm text-slate-500">
          {{ t('presentation.noHighlights') }}
        </p>
        <div v-for="h in pres.highlights" :key="h.id" class="flex gap-2">
          <input
            v-model="h.text"
            class="input"
            :aria-label="t('presentation.highlights')"
            :placeholder="t('presentation.highlightPlaceholder')"
          />
          <button type="button" class="btn-ghost btn-xs" @click="removeHighlight(h.id)">✕</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('presentation.outline') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('presentation.outlineHint') }}</p>
        </div>
      </div>
      <div class="card-body space-y-3">
        <div
          v-for="(block, i) in outline"
          :key="i"
          class="rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-sm font-bold text-slate-800">{{ i + 1 }}. {{ block.title }}</p>
            <span class="badge bg-slate-200 text-slate-600">{{
              t('presentation.approxMinutes', { n: block.minutes })
            }}</span>
          </div>
          <ul class="mt-1 space-y-0.5">
            <li v-for="(point, j) in block.points" :key="j" class="flex gap-2 text-sm text-slate-700">
              <span class="text-sky-500">·</span><span>{{ point }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </WizardShell>
</template>
