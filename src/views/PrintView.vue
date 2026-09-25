<script setup>
import { computed, onMounted, onBeforeUnmount, nextTick, ref, watch } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useMediaStore } from '../stores/media.js'
import { SECTIONS, isSlotVisible } from '../data/sections.js'
import { EMMA_CLASSES, MODES, COMPONENT_TYPES } from '../data/schema.js'
import { toNumber } from '../data/emmaRules.js'
import { signalDefinition, powerDefinition } from '../utils/mermaid.js'
import { paginateFigures, layoutFor, photosPerPage } from '../utils/photoPages.js'
import { flowTables, estimateRow, estimateText, ESTIMATE, BLOCK_GAP_MM } from '../utils/tableFlow.js'
import { columnForClass } from '../data/matrix.js'
import { CABLE_PROTECTION, FABRICATION_TECHNIQUES, optionLabel } from '../data/options.js'
import PrintPage from '../components/PrintPage.vue'
import MermaidDiagram from '../components/MermaidDiagram.vue'
import { useI18n } from '../i18n/index.js'

const { t, tx, locale } = useI18n()

const store = useProjectStore()
const media = useMediaStore()
const appVersion = __APP_VERSION__

onMounted(() => {
  if (!store.ready) store.load()
})

const p = computed(() => store.project)

const headMeta = computed(() => {
  const m = p.value.meta
  const classLabel = EMMA_CLASSES.find((c) => c.id === m.emmaClass)?.label || ''
  return {
    name: [m.participantName, m.teamName].filter(Boolean).join(' · '),
    // Die Unterklasse (Budget-/OEM-Variante) entscheidet mit, wogegen gewertet
    // wird – sie gehört deshalb auf jede Seite neben die Kategorie.
    className: [classLabel, m.emmaSubclass].filter(Boolean).join(' · '),
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

// Die Selbsteinschätzung und die Regel-Befunde bleiben bewusst aus dem
// Ausdruck: Die Mappe geht an den Juror, und dort haben weder selbst vergebene
// Punkte noch eine Liste eigener Mängel etwas verloren. In der App (Wizard und
// Prüfansicht) sind beide unverändert vorhanden.
const column = computed(() => columnForClass(p.value.meta.emmaClass))
const bonusRequests = computed(() => p.value.bonusRequests.filter((r) => r.title))

const signalDef = computed(() => signalDefinition(p.value.system) || '')
const powerDef = computed(() => powerDefinition(p.value.system, p.value.power) || '')

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

/** Verteiler-Abgänge für den Druck: Stromverbindungen ab Batterie/Verteiler/Sicherung. */
const branchRows = computed(() => {
  const sys = p.value.system
  const comps = sys.components || []
  const byId = (id) => comps.find((c) => c.id === id)
  const componentLabel = (c) => c?.name || tx(COMPONENT_TYPES.find((x) => x.id === c?.type)?.label) || ''
  const sourceTypes = new Set(['battery', 'distributor', 'fuse'])
  return (sys.powerLinks || [])
    .filter((l) => {
      const from = byId(l.from)
      if (from) return sourceTypes.has(from.type)
      // Noch nicht zugeordnete Abgänge (z. B. aus der Migration) drucken, sobald sie Daten tragen.
      return Boolean(l.label) || hasNum(l.section) || hasNum(l.fuseAmps)
    })
    .map((l) => {
      const from = byId(l.from)
      const to = byId(l.to)
      return {
        id: l.id,
        source: from ? componentLabel(from) : '—',
        target: to ? componentLabel(to) : l.label || '—',
        polarity:
          l.polarity === 'plus'
            ? t('power.polarityPlus')
            : l.polarity === 'minus'
              ? t('power.polarityMinus')
              : '—',
        section: l.oem ? 'OEM' : hasNum(l.section) ? `${num(l.section)} mm²` : '—',
        fuse: l.oem ? 'OEM' : hasNum(l.fuseAmps) ? `${num(l.fuseAmps)} A` : '—',
      }
    })
})

/**
 * Nachgemessene Höhen in mm, je Messschlüssel (`data-mk` im Template). Die
 * Vorschau misst jede gedruckte Zeile, Überschrift und Notiz nach, die
 * Aufteilung rechnet dann mit echten Höhen statt mit Schätzwerten – eine
 * Schätzung mit Sicherheitsreserve schob sonst Tabellen auf ein neues Blatt,
 * obwohl sie noch passten. Die Werte wachsen nur: Bricht eine Zeile auf dem
 * einen Blatt minimal anders um als auf dem anderen, kommt die Aufteilung
 * trotzdem nach ein, zwei Durchläufen zur Ruhe.
 */
const measured = ref({})
/** Nachgemessene nutzbare Blatthöhe in mm; bis dahin gilt die Schätzung. */
const measuredCapacity = ref(null)
const heightOf = (key, estimate) => measured.value[key] ?? estimate
const gapStyle = `margin-top: ${BLOCK_GAP_MM}mm`

/** Eine Tabelle für flowTables(); jede Zeile bekommt ihren Messschlüssel `mk` mit. */
function tableSection(key, rows, { cells, charsPerLine, head = true }) {
  return {
    key,
    heading: heightOf(`heading|${key}`, ESTIMATE.heading),
    head: head ? heightOf(`head|${key}`, ESTIMATE.row) : 0,
    rows: rows.map((row) => {
      const mk = `${key}|${JSON.stringify(row)}`
      return { row: { ...row, mk }, height: heightOf(mk, estimateRow(cells(row), charsPerLine)) }
    }),
  }
}

const flowOptions = (trailer = 0) => ({ capacity: measuredCapacity.value ?? ESTIMATE.capacity, trailer })

/**
 * Blätter von „Strom & Sicherheit“. Eine lange Abgangstabelle beginnt auf einem
 * eigenen Blatt, statt mit zwei Zeilen auf ein Zusatzblatt zu rutschen – siehe
 * utils/tableFlow.js.
 */
const powerDataPages = computed(() => {
  const supply = powerRows.value.map(([label, value]) => ({ id: label, label, value }))
  const sections = [
    {
      ...tableSection('supply', supply, { cells: (r) => [r.value], charsPerLine: 120, head: false }),
      // Die Überschrift steht auch ohne Einträge – wie bisher.
      keepEmpty: true,
    },
    tableSection('branches', branchRows.value, {
      cells: (r) => [r.source, r.target, r.polarity, r.section, r.fuse],
      charsPerLine: 50,
    }),
  ]
  return flowTables(sections, flowOptions()).map((page) => ({
    kind: 'powerData',
    title: t('print.powerData'),
    blocks: page.blocks,
  }))
})

/**
 * Komponenten-Seiten. Eine große Anlage (Endstufen, DSPs, viele Lautsprecher)
 * sprengt ein Blatt; aufgeteilt wird nach denselben Regeln wie bei „Strom &
 * Sicherheit“ – siehe utils/tableFlow.js.
 */
const hardwarePages = computed(() => {
  const system = p.value.system
  // Absicherung kommt aus den Stromverbindungen des Blockdiagramms.
  const fuseFor = (component) =>
    (system.powerLinks || [])
      .filter((l) => l.to === component.id && !l.oem && (hasNum(l.fuseAmps) || hasNum(l.section)))
      .map((l) =>
        hasNum(l.fuseAmps)
          ? `${num(l.fuseAmps)} A${hasNum(l.section) ? ` (${num(l.section)} mm²)` : ''}`
          : `${num(l.section)} mm²`,
      )
      .join(', ')
  const rowsFor = (type) =>
    (system.components || [])
      .filter((c) => c.type === type)
      .map((c) => ({
        id: c.id,
        brand: c.name,
        channels: c.channels,
        fuse: fuseFor(c),
        ...(c.install || {}),
      }))
  const titles = {
    amps: t('print.amps'),
    dsp: t('print.dsp'),
    speakers: t('print.speakers'),
    subs: t('print.subs'),
  }
  const cells = (row) => Object.values(row)
  const sections = [
    tableSection('amps', rowsFor('amp'), { cells, charsPerLine: 40 }),
    tableSection('dsp', rowsFor('dsp'), { cells, charsPerLine: 40 }),
    tableSection('speakers', rowsFor('speaker'), { cells, charsPerLine: 40 }),
    tableSection('subs', rowsFor('sub'), { cells, charsPerLine: 40 }),
  ].filter((section) => section.rows.length)
  if (!sections.length) return []

  // Die Einbau-Notiz gehört ans Ende des letzten Komponentenblatts.
  const notes = p.value.hardware.mountingNotes || ''
  const notesKey = `trailer|${notes}`
  const trailer = notes ? heightOf(notesKey, BLOCK_GAP_MM + estimateText(notes)) : 0

  return flowTables(sections, flowOptions(trailer)).map((page) => ({
    kind: 'hardware',
    title: t('print.components'),
    blocks: page.blocks.map((block) => ({ ...block, title: titles[block.key] })),
    notes: page.trailer ? notes : '',
    notesKey,
  }))
})

/**
 * Blätter von „Dämmung & Türaufbau“. Bisher fest ein Blatt: Viele Custom-Parts
 * oder Messungen liefen über und landeten auf einem Zusatzblatt ohne Kopfzeile.
 * Die Abstimmungs-Notiz steht am Ende, wie die Einbau-Notiz bei den Komponenten.
 */
const craftPages = computed(() => {
  const c = p.value.craft
  if (!(
    c.dampingDoors ||
    c.dampingFloor ||
    c.dampingTrunk ||
    c.customParts.length ||
    c.measurements.length ||
    c.tuningNotes
  )) {
    return []
  }
  const damping = [
    ['doors', t('print.doors'), c.dampingDoors],
    ['floor', t('print.floor'), c.dampingFloor],
    ['trunk', t('print.trunk'), c.dampingTrunk],
  ]
    .filter(([, , value]) => value)
    .map(([id, label, value]) => ({ id, label, value }))
  const parts = c.customParts.map((part) => ({
    id: part.id,
    name: part.name || '—',
    technique: optionLabel(FABRICATION_TECHNIQUES, part.technique),
    material: part.material,
    purpose: [part.purpose, part.notes].filter(Boolean).join(' – '),
  }))
  const measurements = c.measurements.map((m) => ({
    id: m.id,
    name: m.name || '—',
    tool: m.tool,
    position: m.position,
    result: m.result,
  }))
  const cells = (row) => Object.values(row)
  const sections = [
    // Die Überschrift steht auch ohne Einträge – wie bisher.
    { ...tableSection('damping', damping, { cells, charsPerLine: 120, head: false }), keepEmpty: true },
    tableSection('parts', parts, { cells, charsPerLine: 50 }),
    tableSection('measurements', measurements, { cells, charsPerLine: 50 }),
  ]
  const notes = c.tuningNotes || ''
  const notesKey = `trailer|tuning|${notes}`
  const trailer = notes ? heightOf(notesKey, BLOCK_GAP_MM + ESTIMATE.heading + estimateText(notes)) : 0
  return flowTables(sections, flowOptions(trailer)).map((page) => ({
    kind: 'craft',
    title: t('print.craft'),
    blocks: page.blocks,
    notes: page.trailer ? notes : '',
    notesKey,
  }))
})

/**
 * Blätter der Bonuspunkte. Bisher fest acht Einträge pro Blatt – mit langen
 * Begründungen lief das Blatt über, mit kurzen blieb die Hälfte leer.
 */
const bonusPages = computed(() => {
  const items = bonusRequests.value.map((req, i) => ({
    id: req.id,
    n: i + 1,
    title: req.title,
    area: req.area,
    description: req.description,
  }))
  if (!items.length) return []
  const section = tableSection('bonus', items, { cells: (r) => [r.description], charsPerLine: 100 })
  return flowTables([section], flowOptions()).map((page) => ({
    kind: 'bonus',
    title: t('print.bonusTitle'),
    items: page.blocks[0]?.rows || [],
  }))
})

/**
 * Foto-Seiten. Wie viele Bilder auf ein Blatt passen, hängt an der Ausrichtung –
 * siehe utils/photoPages.js.
 */
const perPage = computed(() => photosPerPage(p.value.print.photosPerPage))

/** Baut aus einer Figurenliste die Blätter eines Abschnitts. */
function sheetsFor(figures, title, step) {
  const chunks = paginateFigures(figures, perPage.value)
  return chunks.map((chunk, i) => ({
    kind: 'photos',
    step,
    // Die Abschnitts-Einleitung („Der wichtigste Sicherheitsblock …“) bleibt
    // bewusst draußen: Sie richtet sich an den Teilnehmer, nicht an den Juror.
    title: title + (chunks.length > 1 ? ` (${i + 1})` : ''),
    figures: chunk.figures,
    layout: layoutFor(chunk),
  }))
}

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
    pages.push(...sheetsFor(figures, tx(section.title), section.step))
  })

  // Fotos, die direkt an einem Eintrag hängen (Custom-Parts, Messungen).
  // Sie gehören inhaltlich zum Handwerk-Schritt und stehen deshalb dort.
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
    // Bisher trugen mehrere Blätter denselben Titel – jetzt durchnummeriert.
    pages.push(...sheetsFor(figures, title, 'craft'))
  })

  return pages
})

/** Fotoblätter eines Wizard-Schritts – sie stehen direkt hinter dessen Textseite. */
const photosForStep = (step) => photoPages.value.filter((page) => page.step === step)

const pages = computed(() => {
  // Fotos stehen direkt hinter der Textseite, zu der sie gehören. Vorher hingen
  // sie gesammelt am Ende – die Messung zum Handwerk auf Seite 6 landete dann
  // auf Seite 22.
  const list = [{ kind: 'cover', title: t('print.cover') }]
  list.push(...photosForStep('vehicle'))

  if (signalDef.value) list.push({ kind: 'signal', title: t('print.signal') })
  if (powerDef.value) list.push({ kind: 'powerDiagram', title: t('print.powerDiagram') })
  list.push(...powerDataPages.value)
  list.push(...photosForStep('power'))

  list.push(...hardwarePages.value)
  list.push(...photosForStep('hardware'))

  list.push(...craftPages.value)
  list.push(...photosForStep('craft'))

  // `story` zählt mit: sonst verschwindet ein nur dort gefüllter Vortrag aus dem Druck.
  // Leere Highlight-Zeilen zählen nicht, sie erzeugten sonst eine leere Seite.
  // Bewusst ohne Kategorie-Filter: Wer den Vortrag in einer höheren Kategorie
  // vorbereitet und danach wechselt, soll seinen Text nicht verlieren – genau
  // wie beim Handwerk-Abschnitt, der ebenfalls am Inhalt hängt.
  const pr = p.value.presentation
  if (pr.goal || pr.story || pr.challenge || (pr.highlights || []).some((h) => h.text)) {
    list.push({ kind: 'presentation', title: t('print.presentationTitle') })
  }

  list.push(...bonusPages.value)

  return list
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
  // Auch in der Breite: Was seitlich übersteht, schneidet das Blatt ab, ohne
  // dass es höher würde.
  overflowPages.value = nodes
    .map((node, i) =>
      node.offsetHeight > SHEET_HEIGHT_PX + 2 || node.scrollWidth > node.clientWidth + 2 ? i + 1 : 0,
    )
    .filter(Boolean)
  measureHeights(nodes)
}

/** Reserve gegen Rundung und Schriftglättung beim Drucken. */
const CAPACITY_RESERVE_MM = 2

/** Misst Zeilen, Überschriften und Notizen für die Aufteilung nach – siehe `measured`. */
function measureHeights(nodes) {
  const next = { ...measured.value }
  let changed = false
  const put = (key, px) => {
    const mm = px / MM_TO_PX
    if (!key || !(mm > 0) || (next[key] ?? 0) >= mm - 0.2) return
    next[key] = mm
    changed = true
  }
  for (const el of docEl.value.querySelectorAll('[data-mk]')) {
    const box = el.getBoundingClientRect()
    if (el.tagName === 'H2' || el.hasAttribute('data-mk-span')) {
      // Überschrift (oder Einleitung) samt Abstand bis zur Tabelle darunter.
      put(el.dataset.mk, (el.nextElementSibling?.getBoundingClientRect().top ?? box.bottom) - box.top)
    } else {
      // Zeilen haben keinen Außenabstand, Notizen tragen ihren Abstand nach oben mit.
      put(el.dataset.mk, box.height + parseFloat(getComputedStyle(el).marginTop || 0))
    }
  }
  if (changed) measured.value = next

  const heightPx = (node, selector) =>
    Math.max(0, ...nodes.map((n) => n.querySelector(selector)?.getBoundingClientRect().height || 0))
  const body = nodes[0].querySelector('.print-body')
  if (!body) return
  const style = getComputedStyle(body)
  const capacity =
    (SHEET_HEIGHT_PX -
      heightPx(nodes, '.print-head') -
      heightPx(nodes, '.print-foot') -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom)) /
      MM_TO_PX -
    CAPACITY_RESERVE_MM
  if (capacity > 0 && Math.abs(capacity - (measuredCapacity.value ?? 0)) > 0.3) {
    measuredCapacity.value = capacity
  }
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
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-slate-500">{{ t('print.photosPerPage') }}</span>
          <div class="flex gap-1">
            <button
              v-for="n in [1, 2]"
              :key="n"
              type="button"
              class="rounded-lg border px-3 py-1 text-xs font-semibold transition"
              :class="
                perPage === n
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400'
              "
              :aria-pressed="perPage === n"
              @click="p.print.photosPerPage = n"
            >
              {{ n }}
            </button>
          </div>
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
                Build Log
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

            <p style="margin-top: auto; font-size: 7.5pt; color: #64748b">
              {{
                t('print.createdWith', {
                  version: appVersion,
                  date: new Date(p.updatedAt).toLocaleDateString(locale),
                })
              }}
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
          <template v-for="(block, bi) in page.blocks" :key="`${block.key}-${bi}`">
            <template v-if="block.key === 'supply'">
              <h2 class="print-h2" data-mk="heading|supply">{{ t('print.powerSupply') }}</h2>
              <table class="print-table">
                <tbody>
                  <tr v-for="row in block.rows" :key="row.id" :data-mk="row.mk">
                    <th style="width: 55mm">{{ row.label }}</th>
                    <td>{{ row.value }}</td>
                  </tr>
                </tbody>
              </table>
            </template>

            <template v-else>
              <h2 class="print-h2" data-mk="heading|branches" :style="bi ? gapStyle : ''">
                {{ t('print.distribution')
                }}<template v-if="block.continued"> ({{ t('print.continued') }})</template>
              </h2>
              <table class="print-table">
                <thead>
                  <tr data-mk="head|branches">
                    <th>{{ t('print.branchSource') }}</th>
                    <th>{{ t('print.branch') }}</th>
                    <th>{{ t('print.polarity') }}</th>
                    <th>{{ t('print.section') }}</th>
                    <th>{{ t('print.fuse') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="b in block.rows" :key="b.id" :data-mk="b.mk">
                    <td>{{ b.source }}</td>
                    <td>{{ b.target }}</td>
                    <td>{{ b.polarity }}</td>
                    <td>{{ b.section }}</td>
                    <td>{{ b.fuse }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
          </template>
        </template>

        <!-- ------------------------------------------------------- Hardware -->
        <template v-else-if="page.kind === 'hardware'">
          <template v-for="(block, bi) in page.blocks" :key="`${block.key}-${bi}`">
            <h2 class="print-h2" :data-mk="`heading|${block.key}`" :style="bi ? gapStyle : ''">
              {{ block.title }}<template v-if="block.continued"> ({{ t('print.continued') }})</template>
            </h2>
            <table class="print-table">
              <thead>
                <tr v-if="block.key === 'amps'" :data-mk="`head|${block.key}`">
                  <th>{{ t('print.model') }}</th>
                  <th>{{ t('print.channels') }}</th>
                  <th>{{ t('print.powerRms') }}</th>
                  <th>{{ t('print.location') }}</th>
                  <th>{{ t('print.mounting') }}</th>
                  <th>{{ t('print.fuse') }}</th>
                </tr>
                <tr v-else-if="block.key === 'dsp'" :data-mk="`head|${block.key}`">
                  <th>{{ t('print.model') }}</th>
                  <th>{{ t('print.io') }}</th>
                  <th>{{ t('print.location') }}</th>
                  <th>{{ t('print.mounting') }}</th>
                  <th>{{ t('print.signalSource') }}</th>
                </tr>
                <tr v-else-if="block.key === 'speakers'" :data-mk="`head|${block.key}`">
                  <th>{{ t('print.model') }}</th>
                  <th>{{ t('print.position') }}</th>
                  <th>{{ t('print.size') }}</th>
                  <th>{{ t('print.mountingAdapter') }}</th>
                  <th>{{ t('print.cable') }}</th>
                </tr>
                <tr v-else :data-mk="`head|${block.key}`">
                  <th>{{ t('print.model') }}</th>
                  <th>{{ t('print.enclosure') }}</th>
                  <th>{{ t('print.volume') }}</th>
                  <th>{{ t('print.location') }}</th>
                  <th>{{ t('print.securing') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in block.rows" :key="row.id" :data-mk="row.mk">
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

          <p
            v-if="page.notes"
            :data-mk="page.notesKey"
            :style="`${gapStyle}; font-size: 9pt; white-space: pre-line`"
          >
            {{ page.notes }}
          </p>
        </template>

        <!-- -------------------------------------------------------- Handwerk -->
        <template v-else-if="page.kind === 'craft'">
          <template v-for="(block, bi) in page.blocks" :key="`${block.key}-${bi}`">
            <template v-if="block.key === 'damping'">
              <h2 class="print-h2" data-mk="heading|damping" :style="bi ? gapStyle : ''">
                {{ t('print.damping') }}
              </h2>
              <table class="print-table">
                <tbody>
                  <tr v-for="row in block.rows" :key="row.id" :data-mk="row.mk">
                    <th style="width: 40mm">{{ row.label }}</th>
                    <td>{{ row.value }}</td>
                  </tr>
                </tbody>
              </table>
            </template>

            <template v-else-if="block.key === 'parts'">
              <h2 class="print-h2" data-mk="heading|parts" :style="bi ? gapStyle : ''">
                {{ t('print.customParts')
                }}<template v-if="block.continued"> ({{ t('print.continued') }})</template>
              </h2>
              <table class="print-table">
                <thead>
                  <tr data-mk="head|parts">
                    <th>{{ t('print.part') }}</th>
                    <th>{{ t('print.technique') }}</th>
                    <th>{{ t('print.material') }}</th>
                    <th>{{ t('print.purpose') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in block.rows" :key="row.id" :data-mk="row.mk">
                    <td>{{ row.name }}</td>
                    <td>{{ row.technique }}</td>
                    <td>{{ row.material }}</td>
                    <td>{{ row.purpose }}</td>
                  </tr>
                </tbody>
              </table>
            </template>

            <template v-else>
              <h2 class="print-h2" data-mk="heading|measurements" :style="bi ? gapStyle : ''">
                {{ t('print.measurements')
                }}<template v-if="block.continued"> ({{ t('print.continued') }})</template>
              </h2>
              <table class="print-table">
                <thead>
                  <tr data-mk="head|measurements">
                    <th>{{ t('print.measurement') }}</th>
                    <th>{{ t('print.system') }}</th>
                    <th>{{ t('print.position') }}</th>
                    <th>{{ t('print.result') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in block.rows" :key="row.id" :data-mk="row.mk">
                    <td>{{ row.name }}</td>
                    <td>{{ row.tool }}</td>
                    <td>{{ row.position }}</td>
                    <td>{{ row.result }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
          </template>

          <div v-if="page.notes" :data-mk="page.notesKey" :style="gapStyle">
            <h2 class="print-h2">{{ t('print.tuning') }}</h2>
            <p style="font-size: 9pt; white-space: pre-line">{{ page.notes }}</p>
          </div>
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
          <p class="print-lead" style="margin-bottom: 3mm" data-mk="heading|bonus" data-mk-span>
            {{ t('print.bonusLead') }}
          </p>
          <table class="print-table">
            <thead>
              <tr data-mk="head|bonus">
                <th style="width: 10mm">#</th>
                <th style="width: 55mm">{{ t('print.bonusElement') }}</th>
                <th style="width: 30mm">{{ t('print.bonusArea') }}</th>
                <th>{{ t('print.bonusReason') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in page.items" :key="req.id" :data-mk="req.mk">
                <td>{{ req.n }}</td>
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
        <!-- ------------------------------------------------------ Fotoseiten -->
        <template v-else-if="page.kind === 'photos'">
          <div class="print-grid" :class="`print-grid--${page.layout}`">
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
