<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useScore } from '../composables/useScore.js'
import { uid } from '../data/schema.js'
import WizardShell from '../components/WizardShell.vue'

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
    title: 'Einstieg: Ziel des Projekts',
    points: [
      pres.value.goal || 'Was wolltest du erreichen? (Feld oben ausfüllen)',
      p.meta.vehicleMake || p.meta.vehicleModel
        ? `Fahrzeug: ${[p.meta.vehicleMake, p.meta.vehicleModel, p.meta.vehicleYear].filter(Boolean).join(' ')}`
        : 'Fahrzeug im Schritt „Fahrzeug & Klasse“ eintragen',
    ],
  })

  const sig = p.system.components.filter((c) => !['battery', 'fuse'].includes(c.type))
  blocks.push({
    minutes: 1,
    title: 'Signalkette in einem Satz',
    points: sig.length
      ? [sig.map((c) => c.name || c.type).join(' → ')]
      : ['Komponenten im Schritt „Blockdiagramme“ anlegen'],
  })

  const powerBits = []
  if (p.power.mainCableSection && p.power.mainFuseAmps) {
    powerBits.push(`${p.power.mainCableSection} mm² mit ${p.power.mainFuseAmps} A abgesichert`)
  }
  if (p.power.mainFuseDistanceCm !== null) powerBits.push(`Hauptsicherung ${p.power.mainFuseDistanceCm} cm vom Pol`)
  if (p.power.groundPoint) powerBits.push(`Masse: ${p.power.groundPoint}`)
  blocks.push({
    minutes: 1,
    title: 'Strom & Sicherheit',
    points: powerBits.length ? powerBits : ['Angaben im Schritt „Strom & Sicherheit“ ergänzen'],
  })

  const custom = p.craft.customParts.filter((c) => c.name)
  blocks.push({
    minutes: 2,
    title: 'Handwerk: was du selbst gebaut hast',
    points: custom.length
      ? custom.map((c) => `${c.name}${c.technique ? ` (${c.technique})` : ''}${c.purpose ? ` – ${c.purpose}` : ''}`)
      : ['Eigenbau-Teile im Schritt „Handwerk & Akustik“ erfassen'],
  })

  const challengeBits = [pres.value.challenge].filter(Boolean)
  const measures = p.craft.measurements.filter((m) => m.name)
  if (measures.length) challengeBits.push(`Messungen: ${measures.map((m) => m.name).join(', ')}`)
  if (p.craft.tuningNotes) challengeBits.push('Abstimmung erklären (Trennfrequenzen, Laufzeiten, Zielkurve)')
  blocks.push({
    minutes: minutes.value === 15 ? 8 : 1,
    title: 'Die größte Herausforderung – und deine Lösung',
    points: challengeBits.length ? challengeBits : ['Feld „Größte Herausforderung“ oben ausfüllen'],
  })

  const bonus = p.bonusRequests.filter((r) => r.title)
  if (bonus.length) {
    blocks.push({
      minutes: 1,
      title: 'Bonuspunkte-Anträge benennen',
      points: bonus.map((r) => r.title),
    })
  }

  blocks.push({
    minutes: 1,
    title: 'Abschluss',
    points: [
      pres.value.story || 'Warum lohnt sich der Blick auf genau dieses Auto?',
      'Fragen der Richter abwarten – nicht überziehen.',
    ],
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
    title="Erklärung an die Richter"
    subtitle="Der Vortrag am Fahrzeug ist ein eigenes Bewertungskriterium – und der einzige Moment, in dem du deine Entscheidungen selbst erklären kannst."
  >
    <div class="card card-body flex flex-wrap items-center justify-between gap-4 border-sky-200 bg-sky-50">
      <div>
        <p class="text-sm font-bold text-sky-900">
          {{ minutes }} Minuten
          <span v-if="criterion"> · {{ criterion.max }} Punkte</span>
        </p>
        <p class="text-xs text-sky-800">
          Vorgetragen vom Fahrzeughalter persönlich. Je 30 Sekunden Überzug wird 1 Punkt abgezogen.
          Bei nationalen und internationalen Finals gibt es 0 Punkte, wenn jemand anderes vorträgt.
        </p>
      </div>
      <p class="text-xs font-semibold" :class="plannedMinutes > minutes ? 'text-rose-700' : 'text-emerald-700'">
        Leitfaden unten: ca. {{ plannedMinutes }} min
      </p>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Dein roter Faden</h2>
          <p class="mt-0.5 text-sm text-slate-600">
            Das Regelwerk empfiehlt: Fokus auf <em>wie</em> und <em>warum</em> gebaut wurde – nicht auf
            Marken und nicht auf das Endergebnis.
          </p>
        </div>
      </div>
      <div class="card-body grid gap-4">
        <div>
          <label class="field" for="goal">Ziel des Projekts (ein Satz)</label>
          <input
            id="goal"
            v-model="pres.goal"
            class="input"
            placeholder="Eine Bühne auf Augenhöhe, ohne den Alltagsnutzen des Kombis aufzugeben"
          />
        </div>
        <div>
          <label class="field" for="challenge">Größte Herausforderung – und wie du sie gelöst hast</label>
          <textarea
            id="challenge"
            v-model="pres.challenge"
            class="textarea"
            placeholder="Die A-Säule gab keinen Winkel her, also habe ich das Podest in CAD auf den Hörplatz gerechnet und in ASA gedruckt …"
          />
        </div>
        <div>
          <label class="field" for="story">Womit willst du enden?</label>
          <textarea
            id="story"
            v-model="pres.story"
            class="textarea"
            placeholder="Der Satz, der beim Richter hängen bleiben soll."
          />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Details, auf die du hinweisen willst</h2>
          <p class="mt-0.5 text-sm text-slate-600">
            Dinge, die der Richter sonst übersieht – verdeckte Lösungen, Kleinigkeiten mit Aufwand.
          </p>
        </div>
        <button type="button" class="btn-soft btn-xs" @click="addHighlight">+ Detail</button>
      </div>
      <div class="card-body space-y-2">
        <p v-if="!pres.highlights.length" class="text-sm text-slate-500">Noch nichts notiert.</p>
        <div v-for="h in pres.highlights" :key="h.id" class="flex gap-2">
          <input v-model="h.text" class="input" placeholder="z. B. Kabeldurchführung in der Tür wasserdicht gekapselt" />
          <button type="button" class="btn-ghost btn-xs" @click="removeHighlight(h.id)">✕</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Generierter Leitfaden</h2>
          <p class="mt-0.5 text-sm text-slate-600">
            Aus deinen erfassten Daten zusammengestellt. Landet auf einer eigenen Seite im Ausdruck –
            zum Mitnehmen ans Auto.
          </p>
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
            <span class="badge bg-slate-200 text-slate-600">ca. {{ block.minutes }} min</span>
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
