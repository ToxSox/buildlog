<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { EMMA_CLASSES, EMMA_SUBCLASSES, MODES } from '../data/schema.js'
import WizardShell from '../components/WizardShell.vue'
import SlotGrid from '../components/SlotGrid.vue'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

const store = useProjectStore()
const meta = computed(() => store.project.meta)

const groupedClasses = computed(() => {
  const groups = {}
  EMMA_CLASSES.forEach((c) => {
    groups[c.group] = groups[c.group] || []
    groups[c.group].push(c)
  })
  return groups
})

/** Schnellauswahl bekannter Unterklassen – die Eingabe bleibt trotzdem Freitext. */
const subclassSuggestions = computed(() => EMMA_SUBCLASSES[meta.value.emmaClass] || [])

function selectClass(id) {
  if (meta.value.emmaClass === id) return
  meta.value.emmaClass = id
  // Die Unterklasse gehört zur Kategorie – „Master 8000“ passt nicht zu SQ S.
  meta.value.emmaSubclass = ''
}

function switchMode(mode) {
  store.setMode(mode)
}
</script>

<template>
  <WizardShell step-key="vehicle" :title="t('steps.vehicle')" :subtitle="t('vehicle.subtitle')">
    <div class="card">
      <div class="card-header">
        <h2 class="section-title">{{ t('vehicle.participantSection') }}</h2>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field" for="participant">{{ t('vehicle.participantName') }} *</label>
          <input id="participant" v-model="meta.participantName" class="input" placeholder="Max Mustermann" />
        </div>
        <div>
          <label class="field" for="team">{{ t('vehicle.team') }}</label>
          <input id="team" v-model="meta.teamName" class="input" placeholder="optional" />
        </div>
        <div>
          <label class="field" for="make">{{ t('vehicle.make') }} *</label>
          <input id="make" v-model="meta.vehicleMake" class="input" placeholder="Audi" />
        </div>
        <div>
          <label class="field" for="model">{{ t('vehicle.model') }} *</label>
          <input id="model" v-model="meta.vehicleModel" class="input" placeholder="A3 8P Sportback" />
        </div>
        <div>
          <label class="field" for="year">{{ t('vehicle.year') }}</label>
          <input id="year" v-model="meta.vehicleYear" class="input" inputmode="numeric" placeholder="2011" />
        </div>
        <div>
          <label class="field" for="plate">{{ t('vehicle.plate') }}</label>
          <input id="plate" v-model="meta.plate" class="input" placeholder="M-AB 1234" />
          <p class="hint">{{ t('vehicle.plateHint') }}</p>
        </div>
        <div>
          <label class="field" for="event">{{ t('vehicle.event') }}</label>
          <input id="event" v-model="meta.eventName" class="input" placeholder="EMMA Sommerfinale" />
        </div>
        <div>
          <label class="field" for="installer">{{ t('vehicle.installer') }}</label>
          <input
            id="installer"
            v-model="meta.installerName"
            class="input"
            placeholder="Eigenbau / Fachbetrieb"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="field" for="notes">{{ t('vehicle.notes') }}</label>
          <textarea
            id="notes"
            v-model="meta.notes"
            class="textarea"
            :placeholder="t('vehicle.notesPlaceholder')"
          />
          <p class="hint">{{ t('vehicle.notesHint') }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('vehicle.classSection') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('vehicle.classHint') }}</p>
        </div>
      </div>
      <div class="card-body space-y-4">
        <div v-for="(items, group) in groupedClasses" :key="group">
          <p class="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">{{ group }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in items"
              :key="c.id"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
              :class="
                meta.emmaClass === c.id
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400'
              "
              :aria-pressed="meta.emmaClass === c.id"
              @click="selectClass(c.id)"
            >
              {{ c.label }}
            </button>
          </div>
        </div>

        <div v-if="meta.emmaClass" class="border-t border-slate-100 pt-4">
          <label class="field" for="subclass">{{ t('vehicle.subclass') }}</label>
          <div v-if="subclassSuggestions.length" class="mb-2 flex flex-wrap gap-2">
            <button
              v-for="s in subclassSuggestions"
              :key="s"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
              :class="
                meta.emmaSubclass === s
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400'
              "
              :aria-pressed="meta.emmaSubclass === s"
              @click="meta.emmaSubclass = meta.emmaSubclass === s ? '' : s"
            >
              {{ s }}
            </button>
          </div>
          <input
            id="subclass"
            v-model="meta.emmaSubclass"
            class="input sm:max-w-sm"
            :placeholder="t('vehicle.subclassPlaceholder')"
          />
          <p class="hint">{{ t('vehicle.subclassHint') }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('vehicle.modeSection') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('vehicle.modeHint') }}</p>
        </div>
      </div>
      <div class="card-body grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          class="rounded-lg border px-4 py-3 text-left transition"
          :class="
            store.mode === MODES.QUICK ? 'border-sky-600 bg-sky-50' : 'border-slate-200 hover:border-sky-300'
          "
          :aria-pressed="store.mode === MODES.QUICK"
          @click="switchMode(MODES.QUICK)"
        >
          <p class="text-sm font-bold text-slate-900">🚑 {{ t('start.quick.title') }}</p>
          <p class="text-xs text-slate-600">{{ t('vehicle.quickDesc') }}</p>
        </button>
        <button
          type="button"
          class="rounded-lg border px-4 py-3 text-left transition"
          :class="
            store.mode === MODES.MASTER ? 'border-sky-600 bg-sky-50' : 'border-slate-200 hover:border-sky-300'
          "
          :aria-pressed="store.mode === MODES.MASTER"
          @click="switchMode(MODES.MASTER)"
        >
          <p class="text-sm font-bold text-slate-900">🏆 {{ t('start.master.title') }}</p>
          <p class="text-xs text-slate-600">{{ t('vehicle.masterDesc') }}</p>
        </button>
      </div>
    </div>

    <SlotGrid step="vehicle" />
  </WizardShell>
</template>
