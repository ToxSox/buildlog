<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { EMMA_CLASSES, MODES } from '../data/schema.js'
import WizardShell from '../components/WizardShell.vue'
import SlotGrid from '../components/SlotGrid.vue'

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

function switchMode(mode) {
  store.setMode(mode)
}
</script>

<template>
  <WizardShell
    step-key="vehicle"
    title="Fahrzeug & Klasse"
    subtitle="Stammdaten der Mappe. Diese Angaben erscheinen später in der Kopfzeile jeder gedruckten Seite."
  >
    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Teilnehmer & Fahrzeug</h2>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field" for="participant">Name des Teilnehmers *</label>
          <input id="participant" v-model="meta.participantName" class="input" placeholder="Max Mustermann" />
        </div>
        <div>
          <label class="field" for="team">Team / Club</label>
          <input id="team" v-model="meta.teamName" class="input" placeholder="optional" />
        </div>
        <div>
          <label class="field" for="make">Marke *</label>
          <input id="make" v-model="meta.vehicleMake" class="input" placeholder="Audi" />
        </div>
        <div>
          <label class="field" for="model">Modell *</label>
          <input id="model" v-model="meta.vehicleModel" class="input" placeholder="A3 8P Sportback" />
        </div>
        <div>
          <label class="field" for="year">Baujahr</label>
          <input id="year" v-model="meta.vehicleYear" class="input" inputmode="numeric" placeholder="2011" />
        </div>
        <div>
          <label class="field" for="plate">Kennzeichen</label>
          <input id="plate" v-model="meta.plate" class="input" placeholder="M-AB 1234" />
          <p class="hint">Erscheint in der Kopfzeile jeder A4-Seite.</p>
        </div>
        <div>
          <label class="field" for="event">Event / Veranstaltung</label>
          <input id="event" v-model="meta.eventName" class="input" placeholder="EMMA Sommerfinale" />
        </div>
        <div>
          <label class="field" for="installer">Einbau durch</label>
          <input id="installer" v-model="meta.installerName" class="input" placeholder="Eigenbau / Fachbetrieb" />
        </div>
        <div class="sm:col-span-2">
          <label class="field" for="notes">Kurzbeschreibung des Projekts</label>
          <textarea
            id="notes"
            v-model="meta.notes"
            class="textarea"
            placeholder="Worum geht es bei diesem Ausbau? Ziel, Besonderheiten, Bauzeit …"
          />
          <p class="hint">Landet als Einleitungstext auf der ersten Seite des Ausdrucks.</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">EMMA-Klasse</h2>
          <p class="mt-0.5 text-sm text-slate-600">In welcher Klasse trittst du an?</p>
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
              @click="meta.emmaClass = c.id"
            >
              {{ c.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Dokumentations-Modus</h2>
          <p class="mt-0.5 text-sm text-slate-600">
            Bestimmt, wie tief der Assistent nachfragt. Ein Wechsel löscht keine Daten.
          </p>
        </div>
      </div>
      <div class="card-body grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          class="rounded-lg border px-4 py-3 text-left transition"
          :class="
            store.mode === MODES.QUICK
              ? 'border-sky-600 bg-sky-50'
              : 'border-slate-200 hover:border-sky-300'
          "
          @click="switchMode(MODES.QUICK)"
        >
          <p class="text-sm font-bold text-slate-900">🚑 Quick Rescue</p>
          <p class="text-xs text-slate-600">Nur Sicherheits-Pflichtfelder – schnellstmöglich abgabefertig.</p>
        </button>
        <button
          type="button"
          class="rounded-lg border px-4 py-3 text-left transition"
          :class="
            store.mode === MODES.MASTER
              ? 'border-sky-600 bg-sky-50'
              : 'border-slate-200 hover:border-sky-300'
          "
          @click="switchMode(MODES.MASTER)"
        >
          <p class="text-sm font-bold text-slate-900">🏆 SQ Masterclass</p>
          <p class="text-xs text-slate-600">Kompletter Bauprozess inkl. Dämmung, Custom-Parts und Messungen.</p>
        </button>
      </div>
    </div>

    <SlotGrid step="vehicle" />
  </WizardShell>
</template>
