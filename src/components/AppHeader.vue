<script setup>
import { useI18n } from '../i18n/index.js'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project.js'
import { stepsForColumn } from '../data/steps.js'
import { useScore } from '../composables/useScore.js'
import ProgressBar from './ProgressBar.vue'
import LanguageSwitch from './LanguageSwitch.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectStore()
const {
  score,
  maxScore,
  percent,
  level,
  columnLabel,
  column,
  missingForStep,
  missingMetaForStep,
  requiredCountForStep,
} = useScore()
const { t, locale } = useI18n()

const steps = computed(() => stepsForColumn(store.column))
const currentKey = computed(() => route.meta.step)
const showWizard = computed(() => store.hasProject && Boolean(route.meta.step))

// Ein Autosave dauert meist nur wenige Millisekunden. Würde die Anzeige sofort
// umschalten, blitzte bei jeder Eingabe kurz „speichert …“ auf. Deshalb erst
// nach einer halben Sekunde anzeigen – dann sieht man nur echte Wartezeiten.
const showSaving = ref(false)
let savingTimer = null

watch(
  () => store.saving,
  (isSaving) => {
    clearTimeout(savingTimer)
    if (isSaving) savingTimer = setTimeout(() => (showSaving.value = true), 500)
    else showSaving.value = false
  },
)

onBeforeUnmount(() => clearTimeout(savingTimer))

const savedLabel = computed(() => {
  // Der Fehler hat Vorrang: Sonst stünde hier weiter „Gespeichert um 14:12“ mit
  // dem Zeitstempel des letzten ERFOLGREICHEN Saves, während nichts mehr ankommt.
  if (store.storageError) return t('app.notSaved')
  if (showSaving.value) return t('app.saving')
  if (!store.lastSavedAt) return t('app.autosave')
  return t('app.savedAt', {
    time: store.lastSavedAt.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' }),
  })
})

function go(step) {
  router.push(step.path)
}

/**
 * Wie weit ein Schritt ist, stand bisher nirgends – man musste ihn aufsuchen,
 * um zu sehen, ob noch Pflichtfotos fehlen. `missingForStep` gab es längst,
 * benutzt hat es nur die Fußleiste des jeweils offenen Schritts.
 *
 * Der Zustand darf nicht allein an der Farbe hängen: erledigt zeigt ein Haken
 * statt der Nummer, offen zeigt die Zahl der offenen Pflichtangaben. Beides
 * steht zusätzlich im `aria-label`, das am Handy ohnehin gebraucht wird – dort
 * rendert nur das Kurzlabel und ein Screenreader las sonst „1 Fahrz.“.
 *
 * Ein Haken setzt voraus, dass es überhaupt etwas abzuhaken gab: Ohne gewählte
 * Kategorie ist nichts Pflicht, also fehlte auch nichts – die Leiste meldete
 * eine frisch geöffnete, leere Mappe komplett als erledigt. `requiredCountForStep`
 * trennt „nichts offen“ von „nichts verlangt“.
 *
 * Die Stammdaten zählen mit: Die Fußleiste des Fahrzeug-Schritts führt sie über
 * `missingMetaForStep` längst neben den Fotos, die Schrittleiste kannte sie
 * nicht und hakte den Schritt ab, während Name, Marke und Modell leer waren.
 */
function stepState(step) {
  const missing = missingMetaForStep(step.key).length + missingForStep(step.key).length
  const required = requiredCountForStep(step.key)
  const label = t(step.labelKey)
  const index = steps.value.findIndex((s) => s.key === step.key) + 1
  const base = t('common.step', { index, total: steps.value.length })
  return {
    missing,
    // Der Abschluss-Schritt sammelt selbst keine Fotos – dort wäre ein Haken gelogen.
    // Ohne Kategorie hakt die Leiste gar nichts ab: `vehicle.exterior` ist in
    // jeder Kategorie Pflicht, sichtbar wird das aber erst mit der Spalte. Ein
    // Haken nach ausgefüllten Stammdaten hätte einen Schritt als fertig gemeldet,
    // dem noch jedes Foto fehlt.
    done: Boolean(column.value) && required > 0 && missing === 0 && step.key !== 'review',
    ariaLabel: missing ? `${base}: ${label} – ${t('nav.missingItems', { n: missing })}` : `${base}: ${label}`,
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
      <!-- Am Handy ist der Schriftzug ausgeblendet, der Link bestand dann nur
           aus dem Zeichen und hatte gar keinen Namen. -->
      <router-link to="/" class="flex items-center gap-2 shrink-0" :aria-label="t('app.home')">
        <!-- Die App baut eine Mappe, sie spielt keine Musik: ein Lautsprecher
             stand fuer die Anlage, nicht fuer das, was hier entsteht. -->
        <span
          class="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white text-lg"
          aria-hidden="true"
          >🗂️</span
        >
        <span class="hidden sm:block leading-tight">
          <span class="block text-sm font-extrabold tracking-tight text-slate-900">{{ t('app.name') }}</span>
          <span class="block text-[11px] text-slate-500">{{ t('app.sub') }}</span>
        </span>
      </router-link>

      <div v-if="store.hasProject" class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-slate-800">{{ store.title }}</p>
        <p class="truncate text-[11px] text-slate-500">
          {{ columnLabel || store.mode
          }}<span v-if="store.project.meta.emmaSubclass"> · {{ store.project.meta.emmaSubclass }}</span
          ><span v-if="store.project.meta.plate"> · {{ store.project.meta.plate }}</span>
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

      <!-- feste Breite: sonst schiebt der Textwechsel die Kopfzeile hin und her.
           Im Fehlerfall auch am Telefon sichtbar – dort ist der Speicher am
           ehesten voll. -->
      <span
        data-testid="save-status"
        class="w-32 shrink-0 text-right text-[11px] tabular-nums whitespace-nowrap"
        :class="
          store.storageError
            ? 'inline-block font-bold text-rose-600'
            : 'hidden lg:inline-block text-slate-500'
        "
        >{{ savedLabel }}</span
      >
    </div>

    <nav v-if="showWizard" class="border-t border-slate-100 bg-slate-50" :aria-label="t('nav.label')">
      <ol class="max-w-6xl mx-auto flex gap-1 overflow-x-auto px-2 py-2">
        <li v-for="step in steps" :key="step.key" class="shrink-0">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            :class="
              step.key === currentKey
                ? 'bg-sky-600 text-white shadow ring-2 ring-sky-900/25'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            "
            :aria-current="step.key === currentKey ? 'step' : undefined"
            :aria-label="stepState(step).ariaLabel"
            :title="stepState(step).ariaLabel"
            @click="go(step)"
          >
            <span
              class="grid h-5 w-5 place-items-center rounded-full text-[10px]"
              :class="[
                step.key === currentKey ? 'bg-white/25' : 'bg-slate-200 text-slate-700',
                stepState(step).missing && step.key !== currentKey ? '!bg-amber-500 !text-white' : '',
                stepState(step).done && step.key !== currentKey ? '!bg-emerald-500 !text-white' : '',
              ]"
              aria-hidden="true"
            >
              <!-- Eine Ziffer im Kreis heißt immer „so viele offen“ – nie die
                   Schrittnummer. Beides gemischt war nicht lesbar: Schritt 3
                   trug eine 2, weil zwei Fotos fehlten, Schritt 2 trug ebenfalls
                   eine 2, weil er der zweite ist. Am aktiven Schritt fiel selbst
                   die Farbe weg, dort stand die Zahl auf Blau. Die Schrittnummer
                   steht in `aria-label` und Tooltip, sichtbar ist sie ohnehin
                   an der Position. „·“ heißt: hier verlangt die App nichts. -->
              {{ stepState(step).missing || (stepState(step).done ? '✓' : '·') }}
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
