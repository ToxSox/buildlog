<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useScore } from '../composables/useScore.js'
import { slotsForCriterion } from '../data/sections.js'
import { MAX_BONUS_REQUESTS, BONUS_POINTS_PER_REQUEST } from '../data/matrix.js'
import WizardShell from '../components/WizardShell.vue'

const store = useProjectStore()
const { assessment, column, columnLabel } = useScore()

const STATES = [
  { value: 'yes', label: 'erfüllt', short: 'Ja', klass: 'bg-emerald-600 border-emerald-600 text-white' },
  { value: 'partly', label: 'teilweise', short: 'Teils', klass: 'bg-amber-500 border-amber-500 text-white' },
  { value: 'no', label: 'nicht erfüllt', short: 'Nein', klass: 'bg-rose-600 border-rose-600 text-white' },
]

const autoCriteria = computed(() => assessment.value.criteria.filter((c) => c.basis === 'auto'))
const selfCriteria = computed(() => assessment.value.criteria.filter((c) => c.basis !== 'auto'))

const bonus = computed(() => assessment.value.criteria.find((c) => c.id === 'bonus'))
const bonusCap = computed(() => (bonus.value ? Math.floor(bonus.value.max / BONUS_POINTS_PER_REQUEST) : 0))

function photoHint(criterionId) {
  if (!column.value) return []
  return slotsForCriterion(criterionId, column.value).map((s) => s.label)
}
</script>

<template>
  <WizardShell
    step-key="matrix"
    title="Punkte-Check"
    subtitle="Deine Mappe gegen die offizielle Installation Matrix deiner Kategorie – damit du siehst, wo die Punkte wirklich liegen."
  >
    <div v-if="!column" class="card card-body border-amber-300 bg-amber-50">
      <p class="text-sm font-bold text-amber-900">Noch keine Kategorie gewählt</p>
      <p class="mt-0.5 text-sm text-amber-800">
        Wähle im Schritt „Fahrzeug &amp; Klasse“ deine EMMA-Kategorie. Erst dann weiß die App, welche
        Kriterien bei dir überhaupt bewertet werden und wie viele Punkte darauf entfallen.
      </p>
      <router-link to="/wizard/fahrzeug" class="btn-primary btn-xs mt-3 self-start">
        Zur Kategoriewahl →
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
            geschätzte Installationspunkte
            <span v-if="assessment.unrated"> · {{ assessment.unrated }} Kriterien noch offen</span>
          </p>
        </div>
        <p class="max-w-md text-xs text-slate-600">
          Das ist eine Selbsteinschätzung, keine Wertung. Die App kann nur prüfen, was sie sieht –
          ob eine Crimpung wirklich sauber ist, entscheidet der Richter am Auto.
        </p>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="section-title">Von der App abgeleitet</h2>
            <p class="mt-0.5 text-sm text-slate-600">Ergibt sich aus deinen Eingaben und Fotos.</p>
          </div>
        </div>
        <div class="card-body space-y-2">
          <div
            v-for="c in autoCriteria"
            :key="c.id"
            class="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-800">{{ c.label.de }}</p>
              <p class="text-xs text-slate-500">{{ c.detail }}</p>
            </div>
            <div class="w-28 shrink-0">
              <div class="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full"
                  :class="c.earned >= c.max ? 'bg-emerald-500' : c.earned > 0 ? 'bg-amber-500' : 'bg-rose-400'"
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
            <h2 class="section-title">Selbst einschätzen</h2>
            <p class="mt-0.5 text-sm text-slate-600">
              Das prüft der Richter am Fahrzeug – schätze ehrlich, dann weißt du vor dem Event, wo du stehst.
            </p>
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
                <p class="text-sm font-bold text-slate-800">{{ c.label.de }}</p>
                <p class="mt-0.5 text-xs leading-relaxed text-slate-600">{{ c.help.de }}</p>
                <p v-if="photoHint(c.id).length" class="mt-1 text-[11px] text-sky-700">
                  Belegbar über: {{ photoHint(c.id).join(', ') }}
                </p>
              </div>
              <span class="badge shrink-0 bg-slate-900 text-white">max. {{ c.max }} P.</span>
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
                placeholder="Notiz für dich selbst (z. B. was noch fehlt)"
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
            <h2 class="section-title">Bonuspunkte-Anträge</h2>
            <p class="mt-0.5 text-sm text-slate-600">
              In deiner Kategorie sind das <strong>{{ bonus.max }} Punkte</strong> – bis zu
              {{ bonusCap }} Anträge à {{ BONUS_POINTS_PER_REQUEST }} Punkte. Sie müssen zusammen mit
              der Präsentation eingereicht werden und landen automatisch im Ausdruck.
            </p>
          </div>
          <button
            type="button"
            class="btn-soft btn-xs"
            :disabled="store.project.bonusRequests.length >= MAX_BONUS_REQUESTS"
            @click="store.addBonusRequest()"
          >
            + Antrag
          </button>
        </div>
        <div class="card-body space-y-3">
          <p class="text-xs text-slate-500">
            Punkte gibt es für Elemente, die Komponenten außergewöhnlich in Szene setzen, Zuschauer
            anziehen, die normale Nutzung des Fahrzeugs trotz Anlage erhalten oder die Präsentation
            kreativ machen. 1 Punkt für die Idee, 1 weiterer bei durchschnittlicher, 2 bei guter Umsetzung.
          </p>

          <p v-if="!store.project.bonusRequests.length" class="text-sm text-slate-500">
            Noch kein Antrag formuliert – hier liegen die meisten ungenutzten Punkte.
          </p>

          <div
            v-for="(req, i) in store.project.bonusRequests"
            :key="req.id"
            class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1.2fr_1fr_auto]"
          >
            <span class="text-xs font-bold text-slate-400">#{{ i + 1 }}</span>
            <div>
              <label class="field">Titel</label>
              <input v-model="req.title" class="input" placeholder="Beleuchteter Sicherungsverteiler" />
            </div>
            <div>
              <label class="field">Bereich</label>
              <input v-model="req.area" class="input" placeholder="Kofferraum" />
            </div>
            <button type="button" class="btn-ghost btn-xs self-end" @click="store.removeBonusRequest(req.id)">
              Entfernen
            </button>
            <div class="sm:col-span-4">
              <label class="field">Begründung für die Richter</label>
              <textarea
                v-model="req.description"
                class="textarea"
                placeholder="Was ist die Idee, warum ist sie außergewöhnlich, wie wurde sie umgesetzt?"
              />
            </div>
          </div>

          <p
            v-if="store.project.bonusRequests.length >= MAX_BONUS_REQUESTS"
            class="text-xs font-semibold text-amber-700"
          >
            Maximum von {{ MAX_BONUS_REQUESTS }} Anträgen erreicht.
          </p>
        </div>
      </div>
    </template>
  </WizardShell>
</template>
