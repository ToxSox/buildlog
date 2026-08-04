<script setup>
import { computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useMediaStore } from '../stores/media.js'
import { SECTIONS, isSlotVisible } from '../data/sections.js'
import { EMMA_CLASSES } from '../data/schema.js'
import { evaluateRules, summarize } from '../data/emmaRules.js'
import { signalDefinition, powerDefinition } from '../utils/mermaid.js'
import { assessProject } from '../data/assessment.js'
import { COLUMN_LABELS, columnForClass } from '../data/matrix.js'
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
    [t('print.cableSection'), pw.mainCableSection ? `${pw.mainCableSection} mm²` : ''],
    [t('print.mainFuse'), pw.mainFuseAmps ? `${pw.mainFuseAmps} A${pw.mainFuseType ? ` (${pw.mainFuseType})` : ''}` : ''],
    [t('print.fuseDistance'), pw.mainFuseDistanceCm !== null ? `${pw.mainFuseDistanceCm} cm` : ''],
    [t('print.ground'), [pw.groundCableSection ? `${pw.groundCableSection} mm²` : '', pw.groundLengthCm ? `${pw.groundLengthCm} cm` : '', pw.groundPoint].filter(Boolean).join(', ')],
    [t('print.cableProtection'), (pw.cableProtection || []).join(', ')],
  ]
  if (pw.secondBattery) {
    rows.push([
      t('print.secondBattery'),
      [
        pw.secondBatteryFuseAmps ? `${pw.secondBatteryFuseAmps} A` : '',
        pw.secondBatteryDistanceCm !== null ? t('print.cmToPost', { cm: pw.secondBatteryDistanceCm }) : '',
        pw.chargingCableSection ? t('print.chargingCable', { section: pw.chargingCableSection }) : '',
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
    { list: p.value.craft.customParts, prefix: 'craft.customParts', title: t('print.customPartsPhotos'), nameKey: 'name' },
    { list: p.value.craft.measurements, prefix: 'craft.measurements', title: t('print.measurementPhotos'), nameKey: 'name' },
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

  const hw = p.value.hardware
  if (hw.amps.length || hw.dsp.length || hw.speakers.length || hw.subs.length) {
    list.push({ kind: 'hardware', title: t('print.components') })
  }

  const c = p.value.craft
  if (c.dampingDoors || c.dampingFloor || c.dampingTrunk || c.customParts.length || c.measurements.length || c.tuningNotes) {
    list.push({ kind: 'craft', title: t('print.craft') })
  }

  const pr = p.value.presentation
  if (column.value && ['M', 'X', 'XUNL'].includes(column.value) && (pr.goal || pr.challenge || pr.highlights.length)) {
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

  if (column.value && assessment.value.max) {
    list.push({ kind: 'matrix', title: t('print.matrixTitle') })
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
          <p class="text-sm font-bold text-slate-900">{{ t('print.previewTitle') }}</p>
          <p class="text-xs text-slate-500">
            {{ t('print.previewHint', { pages: total }) }}
          </p>
        </div>
        <div class="flex gap-2">
          <router-link to="/wizard/pruefen" class="btn-ghost btn-xs">{{ t('print.backToWizard') }}</router-link>
          <button type="button" class="btn-primary" @click="print">🖨️ {{ t('common.print') }}</button>
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
                {{ headMeta.vehicle || t('print.documentation') }}
              </h1>
              <p class="print-lead" style="margin-top: 2mm">
                {{ headMeta.className ? t('print.classPrefix', { name: headMeta.className }) : '' }}
                <span v-if="p.meta.eventName"> · {{ p.meta.eventName }}</span>
              </p>
            </div>

            <div class="print-kv">
              <div><span class="print-kv__key">{{ t('print.participant') }}:</span> {{ p.meta.participantName || '—' }}</div>
              <div><span class="print-kv__key">{{ t('print.team') }}:</span> {{ p.meta.teamName || '—' }}</div>
              <div><span class="print-kv__key">{{ t('print.vehicle') }}:</span> {{ headMeta.vehicle || '—' }}</div>
              <div><span class="print-kv__key">{{ t('print.plate') }}:</span> {{ p.meta.plate || '—' }}</div>
              <div><span class="print-kv__key">{{ t('print.installer') }}:</span> {{ p.meta.installerName || '—' }}</div>
              <div><span class="print-kv__key">{{ t('print.documentationMode') }}:</span> {{ p.mode }}</div>
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
              <tr v-for="([key, value], i) in powerRows" :key="i">
                <th style="width: 55mm">{{ key }}</th>
                <td>{{ value }}</td>
              </tr>
            </tbody>
          </table>

          <template v-if="p.power.distributionFuses.length">
            <h2 class="print-h2" style="margin-top: 5mm">{{ t('print.distribution') }}</h2>
            <table class="print-table">
              <thead>
                <tr><th>{{ t('print.branch') }}</th><th>{{ t('print.section') }}</th><th>{{ t('print.fuse') }}</th></tr>
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
              <strong>{{ t(`${f.key}.title`, f.params) }}</strong> – {{ t(`${f.key}.message`, f.params) }}
            </div>
          </div>
        </template>

        <!-- ------------------------------------------------------- Hardware -->
        <template v-else-if="page.kind === 'hardware'">
          <template v-if="p.hardware.amps.length">
            <h2 class="print-h2">{{ t('print.amps') }}</h2>
            <table class="print-table">
              <thead>
                <tr><th>{{ t('print.model') }}</th><th>{{ t('print.channels') }}</th><th>{{ t('print.powerRms') }}</th><th>{{ t('print.location') }}</th><th>{{ t('print.mounting') }}</th><th>{{ t('print.fuse') }}</th></tr>
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
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.dsp') }}</h2>
            <table class="print-table">
              <thead><tr><th>{{ t('print.model') }}</th><th>{{ t('print.io') }}</th><th>{{ t('print.location') }}</th><th>{{ t('print.mounting') }}</th><th>{{ t('print.signalSource') }}</th></tr></thead>
              <tbody>
                <tr v-for="d in p.hardware.dsp" :key="d.id">
                  <td>{{ d.brand || '—' }}</td><td>{{ d.channels }}</td><td>{{ d.location }}</td>
                  <td>{{ d.mounting }}</td><td>{{ d.input }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.hardware.speakers.length">
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.speakers') }}</h2>
            <table class="print-table">
              <thead><tr><th>{{ t('print.model') }}</th><th>{{ t('print.position') }}</th><th>{{ t('print.size') }}</th><th>{{ t('print.mountingAdapter') }}</th><th>{{ t('print.cable') }}</th></tr></thead>
              <tbody>
                <tr v-for="s in p.hardware.speakers" :key="s.id">
                  <td>{{ s.brand || '—' }}</td><td>{{ s.position }}</td><td>{{ s.size }}</td>
                  <td>{{ s.mounting }}</td><td>{{ s.wiring }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.hardware.subs.length">
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.subs') }}</h2>
            <table class="print-table">
              <thead><tr><th>{{ t('print.model') }}</th><th>{{ t('print.enclosure') }}</th><th>{{ t('print.volume') }}</th><th>{{ t('print.location') }}</th><th>{{ t('print.securing') }}</th></tr></thead>
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
          <h2 class="print-h2">{{ t('print.damping') }}</h2>
          <table class="print-table">
            <tbody>
              <tr v-if="p.craft.dampingDoors"><th style="width: 40mm">{{ t('print.doors') }}</th><td>{{ p.craft.dampingDoors }}</td></tr>
              <tr v-if="p.craft.dampingFloor"><th>{{ t('print.floor') }}</th><td>{{ p.craft.dampingFloor }}</td></tr>
              <tr v-if="p.craft.dampingTrunk"><th>{{ t('print.trunk') }}</th><td>{{ p.craft.dampingTrunk }}</td></tr>
            </tbody>
          </table>

          <template v-if="p.craft.customParts.length">
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.customParts') }}</h2>
            <table class="print-table">
              <thead><tr><th>{{ t('print.part') }}</th><th>{{ t('print.technique') }}</th><th>{{ t('print.material') }}</th><th>{{ t('print.purpose') }}</th></tr></thead>
              <tbody>
                <tr v-for="c in p.craft.customParts" :key="c.id">
                  <td>{{ c.name || '—' }}</td><td>{{ c.technique }}</td><td>{{ c.material }}</td>
                  <td>{{ [c.purpose, c.notes].filter(Boolean).join(' – ') }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="p.craft.measurements.length">
            <h2 class="print-h2" style="margin-top: 4mm">{{ t('print.measurements') }}</h2>
            <table class="print-table">
              <thead><tr><th>{{ t('print.measurement') }}</th><th>{{ t('print.system') }}</th><th>{{ t('print.position') }}</th><th>{{ t('print.result') }}</th></tr></thead>
              <tbody>
                <tr v-for="m in p.craft.measurements" :key="m.id">
                  <td>{{ m.name || '—' }}</td><td>{{ m.tool }}</td><td>{{ m.position }}</td><td>{{ m.result }}</td>
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
              <tr><th style="width: 10mm">#</th><th style="width: 55mm">{{ t('print.bonusElement') }}</th><th style="width: 30mm">{{ t('print.bonusArea') }}</th><th>{{ t('print.bonusReason') }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(req, i) in page.items" :key="req.id">
                <td>{{ page.offset + i + 1 }}</td>
                <td><strong>{{ req.title }}</strong></td>
                <td>{{ req.area }}</td>
                <td>{{ req.description }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- ------------------------------------------- Selbsteinschätzung -->
        <template v-else-if="page.kind === 'matrix'">
          <p class="print-lead" style="margin-bottom: 3mm">
            {{ t('print.matrixLead', { category: COLUMN_LABELS[column] }) }}
          </p>
          <table class="print-table">
            <thead>
              <tr><th>{{ t('print.criterion') }}</th><th style="width: 22mm">{{ t('print.points') }}</th><th style="width: 20mm">{{ t('print.basis') }}</th><th>{{ t('print.remark') }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in assessment.criteria" :key="c.id">
                <td>{{ tx(c.label) }}</td>
                <td>{{ c.earned }} / {{ c.max }}</td>
                <td>{{ c.basis === 'auto' ? t('matrix.basisAuto') : c.basis === 'self' ? t('matrix.basisSelf') : t('matrix.basisOpen') }}</td>
                <td>{{ c.note || c.detail }}</td>
              </tr>
              <tr>
                <td><strong>{{ t('print.total') }}</strong></td>
                <td><strong>{{ assessment.earned }} / {{ assessment.max }}</strong></td>
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
