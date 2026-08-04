<script setup>
import { computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useMediaStore } from '../stores/media.js'
import { SECTIONS } from '../data/sections.js'
import { EMMA_CLASSES, MODES } from '../data/schema.js'
import { evaluateRules, summarize } from '../data/emmaRules.js'
import { signalDefinition, powerDefinition } from '../utils/mermaid.js'
import PrintPage from '../components/PrintPage.vue'
import MermaidDiagram from '../components/MermaidDiagram.vue'

const store = useProjectStore()
const media = useMediaStore()

onMounted(() => {
  if (!store.ready) store.load()
})

const p = computed(() => store.project)

const headMeta = computed(() => {
  const m = p.value.meta
  return {
    name: [m.participantName, m.teamName].filter(Boolean).join(' · '),
    className: EMMA_CLASSES.find((c) => c.id === m.emmaClass)?.label || '',
    plate: m.plate,
    vehicle: [m.vehicleMake, m.vehicleModel, m.vehicleYear].filter(Boolean).join(' '),
    event: m.eventName,
  }
})

const findings = computed(() => summarize(evaluateRules(p.value)))

const signalDef = computed(() => signalDefinition(p.value.system) || '')
const powerDef = computed(() => powerDefinition(p.value.system) || '')

const powerRows = computed(() => {
  const pw = p.value.power
  const rows = [
    ['Batterie', [pw.batteryType, pw.batteryLocation].filter(Boolean).join(', ')],
    ['Befestigung der Batterie', pw.batterySecured],
    ['Querschnitt Pluskabel', pw.mainCableSection ? `${pw.mainCableSection} mm²` : ''],
    ['Hauptsicherung', pw.mainFuseAmps ? `${pw.mainFuseAmps} A${pw.mainFuseType ? ` (${pw.mainFuseType})` : ''}` : ''],
    ['Abstand Sicherung ↔ Batterie', pw.mainFuseDistanceCm !== null ? `${pw.mainFuseDistanceCm} cm` : ''],
    ['Masse', [pw.groundCableSection ? `${pw.groundCableSection} mm²` : '', pw.groundLengthCm ? `${pw.groundLengthCm} cm` : '', pw.groundPoint].filter(Boolean).join(', ')],
    ['Kabelschutz', (pw.cableProtection || []).join(', ')],
  ]
  if (pw.secondBattery) {
    rows.push([
      'Zweitbatterie',
      [
        pw.secondBatteryFuseAmps ? `${pw.secondBatteryFuseAmps} A` : '',
        pw.secondBatteryDistanceCm !== null ? `${pw.secondBatteryDistanceCm} cm zum Pol` : '',
        pw.chargingCableSection ? `Ladekabel ${pw.chargingCableSection} mm²` : '',
      ]
        .filter(Boolean)
        .join(', '),
    ])
  }
  return rows.filter(([, value]) => value)
})

/** Foto-Seiten: pro Abschnitt in Blöcke à 6 Bildern. */
const photoPages = computed(() => {
  const pages = []
  const mode = store.mode
  SECTIONS.forEach((section) => {
    const figures = []
    section.slots
      .filter((slot) => !mode || slot.shown.includes(mode))
      .forEach((slot) => {
        store.mediaFor(slot.key).forEach((item, i) => {
          figures.push({
            id: item.id,
            title: i === 0 ? slot.label : `${slot.label} (Detail ${i + 1})`,
            caption: item.caption || '',
          })
        })
      })
    for (let i = 0; i < figures.length; i += 6) {
      const chunk = figures.slice(i, i + 6)
      pages.push({
        kind: 'photos',
        title: section.title + (figures.length > 6 ? ` (${Math.floor(i / 6) + 1})` : ''),
        intro: i === 0 ? section.intro : '',
        figures: chunk,
        cols: chunk.length === 1 ? 1 : chunk.length <= 4 ? 2 : 3,
      })
    }
  })
  return pages
})

const pages = computed(() => {
  const list = [{ kind: 'cover', title: 'Deckblatt' }]

  if (signalDef.value) list.push({ kind: 'signal', title: 'Signalweg' })
  if (powerDef.value) list.push({ kind: 'powerDiagram', title: 'Stromlaufplan' })
  list.push({ kind: 'powerData', title: 'Strom & Sicherheit' })

  const hw = p.value.hardware
  if (hw.amps.length || hw.dsp.length || hw.speakers.length || hw.subs.length) {
    list.push({ kind: 'hardware', title: 'Verbaute Komponenten' })
  }

  if (store.mode === MODES.MASTER) {
    const c = p.value.craft
    if (c.dampingDoors || c.dampingFloor || c.dampingTrunk || c.customParts.length || c.measurements.length || c.tuningNotes) {
      list.push({ kind: 'craft', title: 'Handwerk, Akustik & Abstimmung' })
    }
  }

  return [...list, ...photoPages.value]
})

const total = computed(() => pages.value.length)

function print() {
  window.print()
}
</script>

<template>
  <div>
    <div class="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p class="text-sm font-bold text-slate-900">Druckvorschau · DIN A4 quer</p>
          <p class="text-xs text-slate-500">
            {{ total }} Seite(n) · im Druckdialog „Hintergrundgrafiken“ aktivieren, Ränder auf „Standard“
          </p>
        </div>
        <div class="flex gap-2">
          <router-link to="/wizard/pruefen" class="btn-ghost btn-xs">← zurück zum Assistenten</router-link>
          <button type="button" class="btn-primary" @click="print">🖨️ PDF generieren / Drucken</button>
        </div>
      </div>
    </div>

    <div class="print-doc">
      <PrintPage
        v-for="(page, i) in pages"
        :key="i"
        :title="page.title"
        :meta="headMeta"
        :page-number="i + 1"
        :page-total="total"
      >
        <!-- ------------------------------------------------------ Deckblatt -->
        <template v-if="page.kind === 'cover'">
          <div style="display: flex; flex-direction: column; height: 100%; gap: 6mm">
            <div>
              <p style="font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase; color: #0284c7; font-weight: 700">
                EMMA Build Log
              </p>
              <h1 class="print-h1" style="margin-top: 2mm">
                {{ headMeta.vehicle || 'Einbaudokumentation' }}
              </h1>
              <p class="print-lead" style="margin-top: 2mm">
                {{ headMeta.className ? `Klasse ${headMeta.className}` : '' }}
                <span v-if="p.meta.eventName"> · {{ p.meta.eventName }}</span>
              </p>
            </div>

            <div class="print-kv">
              <div><span class="print-kv__key">Teilnehmer:</span> {{ p.meta.participantName || '—' }}</div>
              <div><span class="print-kv__key">Team / Club:</span> {{ p.meta.teamName || '—' }}</div>
              <div><span class="print-kv__key">Fahrzeug:</span> {{ headMeta.vehicle || '—' }}</div>
              <div><span class="print-kv__key">Kennzeichen:</span> {{ p.meta.plate || '—' }}</div>
              <div><span class="print-kv__key">Einbau durch:</span> {{ p.meta.installerName || '—' }}</div>
              <div><span class="print-kv__key">Dokumentation:</span> {{ p.mode }}</div>
            </div>

            <div v-if="p.meta.notes">
              <h2 class="print-h2">Über dieses Projekt</h2>
              <p style="font-size: 9pt; white-space: pre-line">{{ p.meta.notes }}</p>
            </div>

            <div v-if="findings.errors.length" class="print-note print-note--error">
              <strong>Offene Sicherheitshinweise ({{ findings.errors.length }}):</strong>
              <ul style="margin: 1mm 0 0 4mm; list-style: disc">
                <li v-for="f in findings.errors" :key="f.id">{{ f.title }}</li>
              </ul>
            </div>
            <div v-else class="print-note">
              Alle geprüften Sicherheitsregeln (Absicherung, Querschnitt, Abstände) sind eingehalten.
            </div>

            <p style="margin-top: auto; font-size: 7.5pt; color: #64748b">
              Erstellt mit dem EMMA Build Log Creator ·
              {{ new Date(p.updatedAt).toLocaleDateString('de-DE') }}
            </p>
          </div>
        </template>

        <!-- ------------------------------------------------------ Diagramme -->
        <template v-else-if="page.kind === 'signal'">
          <p class="print-lead" style="margin-bottom: 3mm">
            Quelle → Verarbeitung → Verstärkung → Wandler. Automatisch aus der Komponentenliste erzeugt.
          </p>
          <div class="print-diagram">
            <MermaidDiagram :definition="signalDef" id-prefix="print-signal" />
          </div>
        </template>

        <template v-else-if="page.kind === 'powerDiagram'">
          <p class="print-lead" style="margin-bottom: 3mm">
            Batterie → Hauptsicherung → Verteiler → Verbraucher, mit Querschnitt je Leitung.
          </p>
          <div class="print-diagram">
            <MermaidDiagram :definition="powerDef" id-prefix="print-power" />
          </div>
        </template>

        <!-- --------------------------------------------------- Strom & Daten -->
        <template v-else-if="page.kind === 'powerData'">
          <h2 class="print-h2">Stromversorgung & Absicherung</h2>
          <table class="print-table">
            <tbody>
              <tr v-for="([key, value], i) in powerRows" :key="i">
                <th style="width: 55mm">{{ key }}</th>
                <td>{{ value }}</td>
              </tr>
            </tbody>
          </table>

          <template v-if="p.power.distributionFuses.length">
            <h2 class="print-h2" style="margin-top: 5mm">Verteiler & Abgänge</h2>
            <table class="print-table">
              <thead>
                <tr><th>Abgang</th><th>Querschnitt</th><th>Absicherung</th></tr>
              </thead>
              <tbody>
                <tr v-for="b in p.power.distributionFuses" :key="b.id">
                  <td>{{ b.label || '—' }}</td>
                  <td>{{ b.section ? `${b.section} mm²` : '—' }}</td>
                  <td>{{ b.amps ? `${b.amps} A` : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <div v-if="findings.errors.length || findings.warnings.length" style="margin-top: 5mm">
            <div v-for="f in [...findings.errors, ...findings.warnings]" :key="f.id"
                 class="print-note" :class="f.severity === 'error' ? 'print-note--error' : 'print-note--warn'"
                 style="margin-bottom: 2mm">
              <strong>{{ f.title }}</strong> – {{ f.message }}
            </div>
          </div>
        </template>

        <!-- ------------------------------------------------------- Hardware -->
        <template v-else-if="page.kind === 'hardware'">
          <template v-if="p.hardware.amps.length">
            <h2 class="print-h2">Endstufen</h2>
            <table class="print-table">
              <thead>
                <tr><th>Modell</th><th>Kanäle</th><th>Leistung</th><th>Einbauort</th><th>Befestigung</th><th>Sicherung</th></tr>
              </thead>
              <tbody>
                <tr v-for="a in p.hardware.amps" :key="a.id">
                  <td>{{ a.brand || '—' }}</td><td>{{ a.channels }}</td><td>{{ a.power }}</td>
                  <td>{{ a.location }}</td><td>{{ a.mounting }}</td><td>{{ a.fuse }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.hardware.dsp.length">
            <h2 class="print-h2" style="margin-top: 4mm">DSP / Prozessor</h2>
            <table class="print-table">
              <thead><tr><th>Modell</th><th>Ein-/Ausgänge</th><th>Einbauort</th><th>Befestigung</th><th>Signalquelle</th></tr></thead>
              <tbody>
                <tr v-for="d in p.hardware.dsp" :key="d.id">
                  <td>{{ d.brand || '—' }}</td><td>{{ d.channels }}</td><td>{{ d.location }}</td>
                  <td>{{ d.mounting }}</td><td>{{ d.input }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.hardware.speakers.length">
            <h2 class="print-h2" style="margin-top: 4mm">Lautsprecher</h2>
            <table class="print-table">
              <thead><tr><th>Modell</th><th>Position</th><th>Größe</th><th>Montage</th><th>Kabel</th></tr></thead>
              <tbody>
                <tr v-for="s in p.hardware.speakers" :key="s.id">
                  <td>{{ s.brand || '—' }}</td><td>{{ s.position }}</td><td>{{ s.size }}</td>
                  <td>{{ s.mounting }}</td><td>{{ s.wiring }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.hardware.subs.length">
            <h2 class="print-h2" style="margin-top: 4mm">Subwoofer</h2>
            <table class="print-table">
              <thead><tr><th>Modell</th><th>Gehäuse</th><th>Volumen</th><th>Einbauort</th><th>Sicherung gegen Verrutschen</th></tr></thead>
              <tbody>
                <tr v-for="s in p.hardware.subs" :key="s.id">
                  <td>{{ s.brand || '—' }}</td><td>{{ s.enclosure }}</td><td>{{ s.volume }}</td>
                  <td>{{ s.location }}</td><td>{{ s.securing }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <p v-if="p.hardware.mountingNotes" style="margin-top: 4mm; font-size: 9pt; white-space: pre-line">
            {{ p.hardware.mountingNotes }}
          </p>
        </template>

        <!-- -------------------------------------------------------- Handwerk -->
        <template v-else-if="page.kind === 'craft'">
          <h2 class="print-h2">Dämmung</h2>
          <table class="print-table">
            <tbody>
              <tr v-if="p.craft.dampingDoors"><th style="width: 40mm">Türen</th><td>{{ p.craft.dampingDoors }}</td></tr>
              <tr v-if="p.craft.dampingFloor"><th>Boden</th><td>{{ p.craft.dampingFloor }}</td></tr>
              <tr v-if="p.craft.dampingTrunk"><th>Kofferraum</th><td>{{ p.craft.dampingTrunk }}</td></tr>
            </tbody>
          </table>

          <template v-if="p.craft.customParts.length">
            <h2 class="print-h2" style="margin-top: 4mm">Eigenbau-Teile</h2>
            <table class="print-table">
              <thead><tr><th>Bauteil</th><th>Fertigung</th><th>Material</th><th>Zweck / Beschreibung</th></tr></thead>
              <tbody>
                <tr v-for="c in p.craft.customParts" :key="c.id">
                  <td>{{ c.name || '—' }}</td><td>{{ c.technique }}</td><td>{{ c.material }}</td>
                  <td>{{ [c.purpose, c.notes].filter(Boolean).join(' – ') }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.craft.measurements.length">
            <h2 class="print-h2" style="margin-top: 4mm">Messungen</h2>
            <table class="print-table">
              <thead><tr><th>Messung</th><th>System</th><th>Position</th><th>Ergebnis</th></tr></thead>
              <tbody>
                <tr v-for="m in p.craft.measurements" :key="m.id">
                  <td>{{ m.name || '—' }}</td><td>{{ m.tool }}</td><td>{{ m.position }}</td><td>{{ m.result }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.craft.tuningNotes">
            <h2 class="print-h2" style="margin-top: 4mm">Abstimmung</h2>
            <p style="font-size: 9pt; white-space: pre-line">{{ p.craft.tuningNotes }}</p>
          </template>
        </template>

        <!-- ------------------------------------------------------ Fotoseiten -->
        <template v-else-if="page.kind === 'photos'">
          <p v-if="page.intro" class="print-lead" style="margin-bottom: 3mm">{{ page.intro }}</p>
          <div class="print-grid" :class="`print-grid--${page.cols}`">
            <figure v-for="fig in page.figures" :key="fig.id" class="print-figure">
              <div class="print-figure__frame">
                <img :src="media.url(fig.id)" :alt="fig.title" />
              </div>
              <figcaption class="print-figure__title">{{ fig.title }}</figcaption>
              <figcaption v-if="fig.caption" class="print-figure__caption">{{ fig.caption }}</figcaption>
            </figure>
          </div>
        </template>
      </PrintPage>
    </div>
  </div>
</template>
