<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useScore } from '../composables/useScore.js'
import { slotsForCriterion } from '../data/sections.js'
import { MAX_BONUS_REQUESTS, BONUS_POINTS_PER_REQUEST } from '../data/matrix.js'
import WizardShell from '../components/WizardShell.vue'
import { useI18n } from '../i18n/index.js'

const { t, tx } = useI18n()

const store = useProjectStore()
const { assessment, column, columnLabel } = useScore()

const STATES = computed(() => [
  { value: 'yes', label: t('matrix.stateYes'), klass: 'bg-emerald-600 border-emerald-600 text-white' },
  { value: 'partly', label: t('matrix.statePartly'), klass: 'bg-amber-500 border-amber-500 text-white' },
  { value: 'no', label: t('matrix.stateNo'), klass: 'bg-rose-600 border-rose-600 text-white' },
])

const autoCriteria = computed(() => assessment.value.criteria.filter((c) => c.basis === 'auto'))
const selfCriteria = computed(() => assessment.value.criteria.filter((c) => c.basis !== 'auto'))

const bonus = computed(() => assessment.value.criteria.find((c) => c.id === 'bonus'))
const bonusCap = computed(() => (bonus.value ? Math.floor(bonus.value.max / BONUS_POINTS_PER_REQUEST) : 0))

function photoHint(criterionId) {
  if (!column.value) return []
  return slotsForCriterion(criterionId, column.value).map((s) => tx(s.label))
}
</script>

<template>
  <WizardShell step-key="matrix" :title="t('steps.matrix')" :subtitle="t('matrix.subtitle')">
    <div v-if="!column" class="card card-body border-amber-300 bg-amber-50">
      <p class="text-sm font-bold text-amber-900">{{ t('matrix.noCategory') }}</p>
      <p class="mt-0.5 text-sm text-amber-800">{{ t('matrix.noCategoryHint') }}</p>
      <router-link to="/wizard/fahrzeug" class="btn-primary btn-xs mt-3 self-start">
        {{ t('matrix.toCategory') }}
      </router-link>
    </div>

    <template v-else>
      <div class="card card-body flex flex-wrap items-end justify-between gap-4 border-sky-200 bg-sky-50">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-sky-700">{{ columnLabel }}</p>
          <p class="mt-1 text-3xl font-black text-slate-900">
            {{ assessment.earned }}<span class="text-lg text-slate-500">/{{ assessment.max }}</span>
          </p>
          <p class="text-xs text-slate-600">
            {{ t('matrix.estimated') }}
            <span v-if="assessment.unrated">
              · {{ t('matrix.openCriteria', { n: assessment.unrated }) }}</span
            >
          </p>
        </div>
        <p class="max-w-md text-xs text-slate-600">
          {{ t('matrix.disclaimer') }}
        </p>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="section-title">{{ t('matrix.autoTitle') }}</h2>
            <p class="mt-0.5 text-sm text-slate-600">{{ t('matrix.autoHint') }}</p>
          </div>
        </div>
        <div class="card-body space-y-2">
          <div
            v-for="c in autoCriteria"
            :key="c.id"
            class="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-800">{{ tx(c.label) }}</p>
              <p class="text-xs text-slate-500">{{ c.detail }}</p>
            </div>
            <div class="w-28 shrink-0">
              <div class="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full"
                  :class="
                    c.earned >= c.max ? 'bg-emerald-500' : c.earned > 0 ? 'bg-amber-500' : 'bg-rose-400'
                  "
                  :style="{ width: `${c.max ? (c.earned / c.max) * 100 : 0}%` }"
                />
              </div>
            </div>
            <span class="w-20 shrink-0 text-right text-sm font-bold tabular-nums text-slate-700">
              {{ c.earned }}/{{ c.max }}
            </span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="section-title">{{ t('matrix.selfTitle') }}</h2>
            <p class="mt-0.5 text-sm text-slate-600">{{ t('matrix.selfHint') }}</p>
          </div>
        </div>
        <div class="card-body space-y-3">
          <div
            v-for="c in selfCriteria"
            :key="c.id"
            class="rounded-lg border p-3"
            :class="c.basis === 'unrated' ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-slate-800">{{ tx(c.label) }}</p>
                <p class="mt-0.5 text-xs leading-relaxed text-slate-600">{{ tx(c.help) }}</p>
                <p v-if="photoHint(c.id).length" class="mt-1 text-[11px] text-sky-700">
                  {{ t('matrix.provableVia', { slots: photoHint(c.id).join(', ') }) }}
                </p>
              </div>
              <span class="badge shrink-0 bg-slate-900 text-white">{{
                t('matrix.maxPoints', { n: c.max })
              }}</span>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-2">
              <button
                v-for="s in STATES"
                :key="s.value"
                type="button"
                class="rounded-lg border px-3 py-1 text-xs font-semibold transition"
                :class="
                  c.state === s.value
                    ? s.klass
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                "
                @click="store.setAssessment(c.id, { state: c.state === s.value ? null : s.value })"
              >
                {{ s.label }}
              </button>
              <input
                :value="c.note"
                class="input !py-1 !text-xs sm:max-w-xs"
                :aria-label="t('matrix.notePlaceholder')"
                :placeholder="t('matrix.notePlaceholder')"
                @input="store.setAssessment(c.id, { note: $event.target.value })"
              />
              <span class="ml-auto text-sm font-bold tabular-nums text-slate-700">
                {{ c.earned }}/{{ c.max }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="bonus" class="card border-indigo-200">
        <div class="card-header">
          <div>
            <h2 class="section-title">{{ t('matrix.bonusTitle') }}</h2>
            <p class="mt-0.5 text-sm text-slate-600">
              {{
                t('matrix.bonusHint', { points: bonus.max, cap: bonusCap, each: BONUS_POINTS_PER_REQUEST })
              }}
            </p>
          </div>
          <button
            type="button"
            class="btn-soft btn-xs"
            :disabled="store.project.bonusRequests.length >= MAX_BONUS_REQUESTS"
            @click="store.addBonusRequest()"
          >
            {{ t('matrix.bonusAdd') }}
          </button>
        </div>
        <div class="card-body space-y-3">
          <p class="text-xs text-slate-500">
            {{ t('matrix.bonusExplain') }}
          </p>

          <p v-if="!store.project.bonusRequests.length" class="text-sm text-slate-500">
            {{ t('matrix.bonusEmpty') }}
          </p>

          <div
            v-for="(req, i) in store.project.bonusRequests"
            :key="req.id"
            class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1.2fr_1fr_auto]"
          >
            <span class="text-xs font-bold text-slate-400">#{{ i + 1 }}</span>
            <div>
              <label class="field" :for="`${req.id}-title`">{{ t('matrix.bonusTitleField') }}</label>
              <input
                :id="`${req.id}-title`"
                v-model="req.title"
                class="input"
                placeholder="Beleuchteter Sicherungsverteiler"
              />
            </div>
            <div>
              <label class="field" :for="`${req.id}-area`">{{ t('matrix.bonusArea') }}</label>
              <input :id="`${req.id}-area`" v-model="req.area" class="input" placeholder="Kofferraum" />
            </div>
            <button type="button" class="btn-ghost btn-xs self-end" @click="store.removeBonusRequest(req.id)">
              {{ t('common.remove') }}
            </button>
            <div class="sm:col-span-4">
              <label class="field" :for="`${req.id}-reason`">{{ t('matrix.bonusReason') }}</label>
              <textarea
                :id="`${req.id}-reason`"
                v-model="req.description"
                class="textarea"
                :placeholder="t('matrix.bonusReasonPlaceholder')"
              />
            </div>
          </div>

          <p
            v-if="store.project.bonusRequests.length >= MAX_BONUS_REQUESTS"
            class="text-xs font-semibold text-amber-700"
          >
            {{ t('matrix.bonusMax', { n: MAX_BONUS_REQUESTS }) }}
          </p>
        </div>
      </div>
    </template>
  </WizardShell>
</template>
