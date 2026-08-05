<script setup>
import { computed, onMounted, onBeforeUnmount, nextTick, ref, watch } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useMediaStore } from '../stores/media.js'
import { SECTIONS, isSlotVisible } from '../data/sections.js'
import { EMMA_CLASSES, MODES } from '../data/schema.js'
import { evaluateRules, summarize, toNumber } from '../data/emmaRules.js'
import { signalDefinition, powerDefinition } from '../utils/mermaid.js'
import { assessProject } from '../data/assessment.js'
import { COLUMN_LABELS, columnForClass } from '../data/matrix.js'
import { CABLE_PROTECTION, FABRICATION_TECHNIQUES, optionLabel } from '../data/options.js'
import PrintPage from '../components/PrintPage.vue'
import MermaidDiagram from '../components/MermaidDiagram.vue'
import { useI18n } from '../i18n/index.js'

const { t, tx, locale } = useI18n()

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

/** Leere Zahlenfelder kommen als '' oder null zurück – beides darf nicht als „ cm“ im Druck landen. */
const num = toNumber
const hasNum = (value) => toNumber(value) !== null

/** Der interne Modus-Schlüssel („SQMasterclass“) gehört nicht auf das Deckblatt. */
const modeLabel = computed(() => {
  if (p.value.mode === MODES.QUICK) return t('start.quick.title')
  if (p.value.mode === MODES.MASTER) return t('start.master.title')
  return p.value.mode || '—'
})

/** Zeilen pro Matrix-Blatt, mit Reserve für umbrechende Bemerkungen. */
const MATRIX_ROWS_PER_PAGE = 12

const findings = computed(() => summarize(evaluateRules(p.value)))
const column = computed(() => columnForClass(p.value.meta.emmaClass))
const assessment = computed(() => assessProject(p.value, column.value))
const bonusRequests = computed(() => p.value.bonusRequests.filter((r) => r.title))

const signalDef = computed(() => signalDefinition(p.value.system) || '')
const powerDef = computed(() => powerDefinition(p.value.system) || '')

const powerRows = computed(() => {
  const pw = p.value.power
  const rows = [
    [t('print.battery'), [pw.batteryType, pw.batteryLocation].filter(Boolean).join(', ')],
    [t('print.batteryMount'), pw.batterySecured],
    [t('print.cableSection'), hasNum(pw.mainCableSection) ? `${num(pw.mainCableSection)} mm²` : ''],
    [
      t('print.mainFuse'),
      hasNum(pw.mainFuseAmps)
        ? `${num(pw.mainFuseAmps)} A${pw.mainFuseType ? ` (${pw.mainFuseType})` : ''}`
        : '',
    ],
    [t('print.fuseDistance'), hasNum(pw.mainFuseDistanceCm) ? `${num(pw.mainFuseDistanceCm)} cm` : ''],
    [
      t('print.ground'),
      [
        hasNum(pw.groundCableSection) ? `${num(pw.groundCableSection)} mm²` : '',
        hasNum(pw.groundLengthCm) ? `${num(pw.groundLengthCm)} cm` : '',
        pw.groundPoint,
      ]
        .filter(Boolean)
        .join(', '),
    ],
    [
      t('print.cableProtection'),
      (pw.cableProtection || []).map((entry) => optionLabel(CABLE_PROTECTION, entry)).join(', '),
    ],
  ]
  if (pw.secondBattery) {
    rows.push([
      t('print.secondBattery'),
      [
        hasNum(pw.secondBatteryFuseAmps) ? `${num(pw.secondBatteryFuseAmps)} A` : '',
        hasNum(pw.secondBatteryDistanceCm)
          ? t('print.cmToPost', { cm: num(pw.secondBatteryDistanceCm) })
          : '',
        hasNum(pw.chargingCableSection)
          ? t('print.chargingCable', { section: num(pw.chargingCableSection) })
          : '',
      ]
        .filter(Boolean)
        .join(', '),
    ])
  }
  return rows.filter(([, value]) => value)
})

/**
 * Komponenten-Seiten. Eine große Anlage (Endstufen, DSPs, viele Lautsprecher)
 * sprengte bisher das eine Blatt. Eine Einheit entspricht einer Tabellenzeile,
 * jede Tabelle kostet zwei Einheiten für Überschrift und Spaltenkopf.
 */
const HARDWARE_UNITS_PER_PAGE = 16

const hardwarePages = computed(() => {
  const hw = p.value.hardware
  const tables = [
    { key: 'amps', title: t('print.amps'), rows: hw.amps || [] },
    { key: 'dsp', title: t('print.dsp'), rows: hw.dsp || [] },
    { key: 'speakers', title: t('print.speakers'), rows: hw.speakers || [] },
    { key: 'subs', title: t('print.subs'), rows: hw.subs || [] },
  ].filter((table) => table.rows.length)
  if (!tables.length) return []

  const pages = []
  let blocks = []
  let used = 0
  const flush = () => {
    if (blocks.length) pages.push(blocks)
    blocks = []
    used = 0
  }

  for (const table of tables) {
    const rest = [...table.rows]
    let continued = false
    while (rest.length) {
      const free = HARDWARE_UNITS_PER_PAGE - used - 2
      if (free < 2) {
        flush()
        continue
      }
      const chunk = rest.splice(0, free)
      blocks.push({ ...table, rows: chunk, continued })
      used += chunk.length + 2
      continued = true
    }
  }
  flush()

  return pages.map((entries, i) => ({
    kind: 'hardware',
    title: t('print.components'),
    blocks: entries,
    // Die Einbau-Notiz gehört ans Ende des letzten Komponentenblatts.
    notes: i === pages.length - 1 ? hw.mountingNotes : '',
  }))
})

/** Foto-Seiten: pro Abschnitt in Blöcke à 6 Bildern. */
const photoPages = computed(() => {
  const pages = []
  SECTIONS.forEach((section) => {
    const figures = []
    section.slots
      .filter((slot) => isSlotVisible(slot, column.value, store.mode))
      .forEach((slot) => {
        store.mediaFor(slot.key).forEach((item, i) => {
          figures.push({
            id: item.id,
            title: i === 0 ? tx(slot.label) : t('print.detailSuffix', { label: tx(slot.label), n: i + 1 }),
            caption: item.caption || '',
          })
        })
      })
    for (let i = 0; i < figures.length; i += 6) {
      const chunk = figures.slice(i, i + 6)
      pages.push({
        kind: 'photos',
        title: tx(section.title) + (figures.length > 6 ? ` (${Math.floor(i / 6) + 1})` : ''),
        intro: i === 0 ? tx(section.intro) : '',
        figures: chunk,
        cols: chunk.length === 1 ? 1 : chunk.length <= 4 ? 2 : 3,
      })
    }
  })

  // Fotos, die direkt an einem Eintrag hängen (Custom-Parts, Messungen)
  const perItem = [
    {
      list: p.value.craft.customParts,
      prefix: 'craft.customParts',
      title: t('print.customPartsPhotos'),
      nameKey: 'name',
    },
    {
      list: p.value.craft.measurements,
      prefix: 'craft.measurements',
      title: t('print.measurementPhotos'),
      nameKey: 'name',
    },
  ]
  perItem.forEach(({ list, prefix, title, nameKey }) => {
    const figures = []
    ;(list || []).forEach((item) => {
      store.mediaFor(`${prefix}.${item.id}`).forEach((media, i) => {
        figures.push({
          id: media.id,
          title: `${item[nameKey] || t('print.unnamed')}${i > 0 ? ` (${i + 1})` : ''}`,
          caption: media.caption || '',
        })
      })
    })
    for (let i = 0; i < figures.length; i += 6) {
      const chunk = figures.slice(i, i + 6)
      pages.push({
        kind: 'photos',
        title,
        intro: '',
        figures: chunk,
        cols: chunk.length === 1 ? 1 : chunk.length <= 4 ? 2 : 3,
      })
    }
  })

  return pages
})

const pages = computed(() => {
  const list = [{ kind: 'cover', title: t('print.cover') }]

  if (signalDef.value) list.push({ kind: 'signal', title: t('print.signal') })
  if (powerDef.value) list.push({ kind: 'powerDiagram', title: t('print.powerDiagram') })
  list.push({ kind: 'powerData', title: t('print.powerData') })

  list.push(...hardwarePages.value)

  const c = p.value.craft
  if (
    c.dampingDoors ||
    c.dampingFloor ||
    c.dampingTrunk ||
    c.customParts.length ||
    c.measurements.length ||
    c.tuningNotes
  ) {
    list.push({ kind: 'craft', title: t('print.craft') })
  }

  // `story` zählt mit: sonst verschwindet ein nur dort gefüllter Vortrag aus dem Druck.
  // Leere Highlight-Zeilen zählen nicht, sie erzeugten sonst eine leere Seite.
  // Bewusst ohne Kategorie-Filter: Wer den Vortrag in einer höheren Kategorie
  // vorbereitet und danach wechselt, soll seinen Text nicht verlieren – genau
  // wie beim Handwerk-Abschnitt, der ebenfalls am Inhalt hängt.
  const pr = p.value.presentation
  if (pr.goal || pr.story || pr.challenge || (pr.highlights || []).some((h) => h.text)) {
    list.push({ kind: 'presentation', title: t('print.presentationTitle') })
  }

  if (bonusRequests.value.length) {
    for (let i = 0; i < bonusRequests.value.length; i += 8) {
      list.push({
        kind: 'bonus',
        title: t('print.bonusTitle'),
        items: bonusRequests.value.slice(i, i + 8),
        offset: i,
      })
    }
  }

  // X und X Unlimited bringen 19–20 Kriterien mit – die passen nicht auf ein Blatt.
  if (column.value && assessment.value.max) {
    const criteria = assessment.value.criteria
    for (let i = 0; i < criteria.length; i += MATRIX_ROWS_PER_PAGE) {
      const items = criteria.slice(i, i + MATRIX_ROWS_PER_PAGE)
      list.push({
        kind: 'matrix',
        title: t('print.matrixTitle'),
        items,
        lead: i === 0,
        sum: i + MATRIX_ROWS_PER_PAGE >= criteria.length,
      })
    }
  }

  return [...list, ...photoPages.value]
})

const total = computed(() => pages.value.length)

/**
 * Ein Abschnitt = ein Blatt. Wird ein Abschnitt länger (viele Einträge, lange
 * Notizen), druckt der Browser den Rest auf ein Zusatzblatt ohne Kopfzeile –
 * die Seitenzahlen im Fuß stimmen dann nicht mehr. Statt das stillschweigend
 * passieren zu lassen, misst die Vorschau nach und sagt Bescheid.
 */
const MM_TO_PX = 96 / 25.4
const SHEET_HEIGHT_PX = 188 * MM_TO_PX
const SHEET_WIDTH_PX = 277 * MM_TO_PX

const docEl = ref(null)
const overflowPages = ref([])
let observer = null

function measurePages() {
  const nodes = [...(docEl.value?.querySelectorAll('.print-page') || [])]
  // Auf schmalen Displays skaliert die Vorschau – dort wäre jede Messung falsch.
  if (!nodes.length || nodes[0].offsetWidth < SHEET_WIDTH_PX - 2) {
    overflowPages.value = []
    return
  }
  overflowPages.value = nodes
    .map((node, i) => (node.offsetHeight > SHEET_HEIGHT_PX + 2 ? i + 1 : 0))
    .filter(Boolean)
}

/** Diagramme und Bilder kommen verzögert – deshalb messen wir bei jeder Größenänderung neu. */
function watchPages() {
  observer?.disconnect()
  measurePages()
  if (typeof ResizeObserver === 'undefined' || !docEl.value) return
  observer = new ResizeObserver(measurePages)
  docEl.value.querySelectorAll('.print-page').forEach((node) => observer.observe(node))
}

onMounted(() => nextTick(watchPages))
watch(pages, () => nextTick(watchPages))
onBeforeUnmount(() => observer?.disconnect())

function print() {
  window.print()
}
</script>

<template>
  <div>
    <div class="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p class="text-sm font-bold text-slate-900">{{ t('print.previewTitle') }}</p>
          <p class="text-xs text-slate-500">
            {{ t('print.previewHint', { pages: total }) }}
          </p>
        </div>
        <div class="flex gap-2">
          <router-link to="/wizard/pruefen" class="btn-ghost btn-xs">
            {{ t('print.backToWizard') }}
          </router-link>
          <button type="button" class="btn-primary" @click="print">🖨️ {{ t('common.print') }}</button>
        </div>
      </div>
      <p
        v-if="overflowPages.length"
        data-testid="print-overflow"
        class="mx-auto max-w-6xl px-4 pb-3 text-xs font-semibold text-amber-700"
      >
        ⚠️ {{ t('print.overflowWarning', { pages: overflowPages.join(', ') }) }}
      </p>
    </div>

    <div ref="docEl" class="print-doc">
      <PrintPage
        v-for="(page, i) in pages"
        :key="i"
        :class="overflowPages.includes(i + 1) ? 'print-page--overflow' : ''"
        :title="page.title"
        :meta="headMeta"
        :page-number="i + 1"
        :page-total="total"
      >
        <!-- ------------------------------------------------------ Deckblatt -->
        <template v-if="page.kind === 'cover'">
          <div style="display: flex; flex-direction: column; height: 100%; gap: 6mm">
            <div>
              <p
                style="
                  font-size: 9pt;
                  letter-spacing: 0.18em;
                  text-transform: uppercase;
                  color: #0284c7;
                  font-weight: 700;
                "
              >
                EMMA Build Log
              </p>
              <h1 class="print-h1" style="margin-top: 2mm">
                {{ headMeta.vehicle || t('print.documentation') }}
              </h1>
              <p class="print-lead" style="margin-top: 2mm">
                {{ headMeta.className ? t('print.classPrefix', { name: headMeta.className }) : '' }}
                <span v-if="p.meta.eventName"> · {{ p.meta.eventName }}</span>
              </p>
            </div>

            <div class="print-kv">
              <div>
                <span class="print-kv__key">{{ t('print.participant') }}:</span>
                {{ p.meta.participantName || '—' }}
              </div>
              <div>
                <span class="print-kv__key">{{ t('print.team') }}:</span> {{ p.meta.teamName || '—' }}
              </div>
              <div>
                <span class="print-kv__key">{{ t('print.vehicle') }}:</span> {{ headMeta.vehicle || '—' }}
              </div>
              <div>
                <span class="print-kv__key">{{ t('print.plate') }}:</span> {{ p.meta.plate || '—' }}
              </div>
              <div>
                <span class="print-kv__key">{{ t('print.installer') }}:</span>
                {{ p.meta.installerName || '—' }}
              </div>
              <div>
                <span class="print-kv__key">{{ t('print.documentationMode') }}:</span> {{ modeLabel }}
              </div>
            </div>

            <div v-if="p.meta.notes">
              <h2 class="print-h2">{{ t('print.aboutProject') }}</h2>
              <p style="font-size: 9pt; white-space: pre-line">{{ p.meta.notes }}</p>
            </div>

            <div v-if="findings.errors.length" class="print-note print-note--error">
              <strong>{{ t('print.openFindings', { n: findings.errors.length }) }}</strong>
              <ul style="margin: 1mm 0 0 4mm; list-style: disc">
                <li v-for="f in findings.errors" :key="f.id">{{ t(`${f.key}.title`, f.params) }}</li>
              </ul>
            </div>
            <div v-else class="print-note">
              {{ t('print.allClear') }}
            </div>

            <p style="margin-top: auto; font-size: 7.5pt; color: #64748b">
              {{ t('print.createdWith', { date: new Date(p.updatedAt).toLocaleDateString(locale) }) }}
              <!-- Auch auf dem Deckblatt: Der Juror soll wissen, dass die Mappe
                   mit einem unabhängigen Werkzeug entstanden ist. -->
              <br />{{ t('app.disclaimer') }}
            </p>
          </div>
        </template>

        <!-- ------------------------------------------------------ Diagramme -->
        <template v-else-if="page.kind === 'signal'">
          <p class="print-lead" style="margin-bottom: 3mm">
            {{ t('print.signalLead') }}
          </p>
          <div class="print-diagram">
            <MermaidDiagram :definition="signalDef" id-prefix="print-signal" />
          </div>
        </template>

        <template v-else-if="page.kind === 'powerDiagram'">
          <p class="print-lead" style="margin-bottom: 3mm">
            {{ t('print.powerLead') }}
          </p>
          <div class="print-diagram">
            <MermaidDiagram :definition="powerDef" id-prefix="print-power" />
          </div>
        </template>

        <!-- --------------------------------------------------- Strom & Daten -->
        <template v-else-if="page.kind === 'powerData'">
          <h2 class="print-h2">{{ t('print.powerSupply') }}</h2>
          <table class="print-table">
            <tbody>
              <tr v-for="[key, value] in powerRows" :key="key">
                <th style="width: 55mm">{{ key }}</th>
                <td>{{ value }}</td>
              </tr>
            </tbody>
          </table>

          <template v-if="p.power.distributionFuses.length">
            <h2 class="print-h2" style="margin-top: 5mm">{{ t('print.distribution') }}</h2>
            <table class="print-table">
              <thead>
                <tr>
                  <th>{{ t('print.branch') }}</th>
                  <th>{{ t('print.section') }}</th>
                  <th>{{ t('print.fuse') }}</th>
                </tr>
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
            <div
              v-for="f in [...findings.errors, ...findings.warnings]"
              :key="f.id"
              class="print-note"
              :class="f.severity === 'error' ? 'print-note--error' : 'print-note--warn'"
              style="margin-bottom: 2mm"
            >
              <strong>{{ t(`${f.key}.title`, f.params) }}</strong> – {{ t(`${f.key}.message`, f.params) }}
            </div>
          </div>
        </template>

        <!-- ------------------------------------------------------- Hardware -->
        <template v-else-if="page.kind === 'hardware'">
          <template v-for="(block, bi) in page.blocks" :key="`${block.key}-${bi}`">
            <h2 class="print-h2" :style="bi ? 'margin-top: 4mm' : ''">
              {{ block.title }}<template v-if="block.continued"> ({{ t('print.continued') }})</template>
            </h2>
            <table class="print-table">
              <thead>
                <tr v-if="block.key === 'amps'">
                  <th>{{ t('print.model') }}</th>
                  <th>{{ t('print.channels') }}</th>
                  <th>{{ t('print.powerRms') }}</th>
                  <th>{{ t('print.location') }}</th>
                  <th>{{ t('print.mounting') }}</th>
                  <th>{{ t('print.fuse') }}</th>
                </tr>
                <tr v-else-if="block.key === 'dsp'">
                  <th>{{ t('print.model') }}</th>
                  <th>{{ t('print.io') }}</th>
                  <th>{{ t('print.location') }}</th>
                  <th>{{ t('print.mounting') }}</th>
                  <th>{{ t('print.signalSource') }}</th>
                </tr>
                <tr v-else-if="block.key === 'speakers'">
                  <th>{{ t('print.model') }}</th>
                  <th>{{ t('print.position') }}</th>
                  <th>{{ t('print.size') }}</th>
                  <th>{{ t('print.mountingAdapter') }}</th>
                  <th>{{ t('print.cable') }}</th>
                </tr>
                <tr v-else>
                  <th>{{ t('print.model') }}</th>
                  <th>{{ t('print.enclosure') }}</th>
                  <th>{{ t('print.volume') }}</th>
                  <th>{{ t('print.location') }}</th>
                  <th>{{ t('print.securing') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in block.rows" :key="row.id">
                  <td>{{ row.brand || '—' }}</td>
                  <template v-if="block.key === 'amps'">
                    <td>{{ row.channels }}</td>
                    <td>{{ row.power }}</td>
                    <td>{{ row.location }}</td>
                    <td>{{ row.mounting }}</td>
                    <td>{{ row.fuse }}</td>
                  </template>
                  <template v-else-if="block.key === 'dsp'">
                    <td>{{ row.channels }}</td>
                    <td>{{ row.location }}</td>
                    <td>{{ row.mounting }}</td>
                    <td>{{ row.input }}</td>
                  </template>
                  <template v-else-if="block.key === 'speakers'">
                    <td>{{ row.position }}</td>
                    <td>{{ row.size }}</td>
                    <td>{{ row.mounting }}</td>
                    <td>{{ row.wiring }}</td>
                  </template>
                  <template v-else>
                    <td>{{ row.enclosure }}</td>
                    <td>{{ row.volume }}</td>
                    <td>{{ row.location }}</td>
                    <td>{{ row.securing }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </template>

          <p v-if="page.notes" style="margin-top: 4mm; font-size: 9pt; white-space: pre-line">
            {{ page.notes }}
          </p>
        </template>

        <!-- -------------------------------------------------------- Handwerk -->
        <template v-else-if="page.kind === 'craft'">
          <h2 class="print-h2">{{ t('print.damping') }}</h2>
          <table class="print-table">
            <tbody>
              <tr v-if="p.craft.dampingDoors">
                <th style="width: 40mm">{{ t('print.doors') }}</th>
                <td>{{ p.craft.dampingDoors }}</td>
              </tr>
              <tr v-if="p.craft.dampingFloor">
                <th>{{ t('print.floor') }}</th>
                <td>{{ p.craft.dampingFloor }}</td>
              </tr>
              <tr v-if="p.craft.dampingTrunk">
                <th>{{ t('print.trunk') }}</th>
                <td>{{ p.craft.dampingTrunk }}</td>
              </tr>
            </tbody>
          </table>

          <template v-if="p.craft.customParts.length">
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.customParts') }}</h2>
            <table class="print-table">
              <thead>
                <tr>
                  <th>{{ t('print.part') }}</th>
                  <th>{{ t('print.technique') }}</th>
                  <th>{{ t('print.material') }}</th>
                  <th>{{ t('print.purpose') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in p.craft.customParts" :key="c.id">
                  <td>{{ c.name || '—' }}</td>
                  <td>{{ optionLabel(FABRICATION_TECHNIQUES, c.technique) }}</td>
                  <td>{{ c.material }}</td>
                  <td>{{ [c.purpose, c.notes].filter(Boolean).join(' – ') }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.craft.measurements.length">
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.measurements') }}</h2>
            <table class="print-table">
              <thead>
                <tr>
                  <th>{{ t('print.measurement') }}</th>
                  <th>{{ t('print.system') }}</th>
                  <th>{{ t('print.position') }}</th>
                  <th>{{ t('print.result') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in p.craft.measurements" :key="m.id">
                  <td>{{ m.name || '—' }}</td>
                  <td>{{ m.tool }}</td>
                  <td>{{ m.position }}</td>
                  <td>{{ m.result }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.craft.tuningNotes">
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.tuning') }}</h2>
            <p style="font-size: 9pt; white-space: pre-line">{{ p.craft.tuningNotes }}</p>
          </template>
        </template>

        <!-- --------------------------------------------- Vortragsleitfaden -->
        <template v-else-if="page.kind === 'presentation'">
          <p class="print-lead" style="margin-bottom: 3mm">
            {{ t('print.presentationLead') }}
          </p>
          <div class="print-kv" style="margin-bottom: 4mm">
            <div v-if="p.presentation.goal">
              <span class="print-kv__key">{{ t('print.presentationGoal') }}:</span> {{ p.presentation.goal }}
            </div>
            <div v-if="p.presentation.story">
              <span class="print-kv__key">{{ t('print.presentationEnd') }}:</span> {{ p.presentation.story }}
            </div>
          </div>
          <template v-if="p.presentation.challenge">
            <h2 class="print-h2">{{ t('print.presentationChallenge') }}</h2>
            <p style="font-size: 9pt; white-space: pre-line">{{ p.presentation.challenge }}</p>
          </template>
          <template v-if="p.presentation.highlights.filter((h) => h.text).length">
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.presentationShow') }}</h2>
            <ul style="margin-left: 5mm; list-style: disc; font-size: 9pt">
              <li v-for="h in p.presentation.highlights.filter((x) => x.text)" :key="h.id">{{ h.text }}</li>
            </ul>
          </template>
        </template>

        <!-- --------------------------------------------------- Bonuspunkte -->
        <template v-else-if="page.kind === 'bonus'">
          <p class="print-lead" style="margin-bottom: 3mm">
            {{ t('print.bonusLead') }}
          </p>
          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 10mm">#</th>
                <th style="width: 55mm">{{ t('print.bonusElement') }}</th>
                <th style="width: 30mm">{{ t('print.bonusArea') }}</th>
                <th>{{ t('print.bonusReason') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(req, idx) in page.items" :key="req.id">
                <td>{{ page.offset + idx + 1 }}</td>
                <td>
                  <strong>{{ req.title }}</strong>
                </td>
                <td>{{ req.area }}</td>
                <td>{{ req.description }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- ------------------------------------------- Selbsteinschätzung -->
        <template v-else-if="page.kind === 'matrix'">
          <p v-if="page.lead" class="print-lead" style="margin-bottom: 3mm">
            {{ t('print.matrixLead', { category: COLUMN_LABELS[column] }) }}
          </p>
          <table class="print-table">
            <thead>
              <tr>
                <th>{{ t('print.criterion') }}</th>
                <th style="width: 22mm">{{ t('print.points') }}</th>
                <th style="width: 20mm">{{ t('print.basis') }}</th>
                <th>{{ t('print.remark') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in page.items" :key="c.id">
                <td>{{ tx(c.label) }}</td>
                <td>{{ c.earned }} / {{ c.max }}</td>
                <td>
                  {{
                    c.basis === 'auto'
                      ? t('matrix.basisAuto')
                      : c.basis === 'self'
                        ? t('matrix.basisSelf')
                        : t('matrix.basisOpen')
                  }}
                </td>
                <td>{{ c.note || c.detail }}</td>
              </tr>
              <tr v-if="page.sum">
                <td>
                  <strong>{{ t('print.total') }}</strong>
                </td>
                <td>
                  <strong>{{ assessment.earned }} / {{ assessment.max }}</strong>
                </td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
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
