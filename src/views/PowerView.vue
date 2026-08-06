<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { CABLE_SECTIONS, COMPONENT_TYPES } from '../data/schema.js'
import { CABLE_PROTECTION } from '../data/options.js'
import {
  FUSE_LIMITS,
  maxAmpsFor,
  toNumber,
  MAX_FUSE_DISTANCE_CM,
  OEM_GROUND_MAX_MAIN_FUSE_A,
  RULEBOOK_EDITION,
} from '../data/emmaRules.js'
import WizardShell from '../components/WizardShell.vue'
import SlotGrid from '../components/SlotGrid.vue'
import RuleReport from '../components/RuleReport.vue'
import { useI18n } from '../i18n/index.js'

const { t, tx } = useI18n()

const store = useProjectStore()
const power = computed(() => store.project.power)

/** Wird als deutscher Schlüssel gespeichert und beim Anzeigen übersetzt. */
const PROTECTION_OPTIONS = CABLE_PROTECTION

const sectionInfo = computed(() => {
  const mm2 = Number(power.value.mainCableSection)
  if (!mm2) return null
  const entry = FUSE_LIMITS.find((e) => e.mm2 === mm2)
  return { mm2, max: maxAmpsFor(mm2), awg: entry?.awg || '' }
})

function toggleProtection(option) {
  const list = power.value.cableProtection
  const idx = list.indexOf(option.de)
  if (idx >= 0) list.splice(idx, 1)
  else list.push(option.de)
}

// --------------------------------------------------------- Verteiler & Abgänge
// Die Abgänge SIND die Stromverbindungen des Blockdiagramms – hier wird
// dasselbe Link-Objekt bearbeitet, nichts doppelt eingegeben.
const system = computed(() => store.project.system)

const typeLabel = (type) => tx(COMPONENT_TYPES.find((x) => x.id === type)?.label) || type
const typeIcon = (type) => COMPONENT_TYPES.find((x) => x.id === type)?.icon || '•'
const componentName = (c) => c.name || typeLabel(c.type)

/** Verteiler immer zeigen; Batterien/Sicherungen nur, wenn Abgänge dranhängen. */
const branchSources = computed(() =>
  system.value.components.filter(
    (c) =>
      c.type === 'distributor' ||
      (['battery', 'fuse'].includes(c.type) && system.value.powerLinks.some((l) => l.from === c.id)),
  ),
)

const outgoing = (id) => system.value.powerLinks.filter((l) => l.from === id)
const unassigned = computed(() => system.value.powerLinks.filter((l) => !l.from))
const targetsFor = (sourceId) => system.value.components.filter((c) => c.id !== sourceId)

function addBranch(sourceId) {
  store.addPowerLink({ from: sourceId })
}

function removeBranch(id) {
  const list = system.value.powerLinks
  const idx = list.findIndex((l) => l.id === id)
  if (idx >= 0) list.splice(idx, 1)
}

function createDistributor() {
  store.addComponent('distributor')
}

/** OEM-Verkabelung braucht keinen Nachweis – der Hersteller hat dimensioniert und abgesichert. */
function setLinkOem(link, on) {
  link.oem = on
  if (on) {
    link.section = null
    link.fuseAmps = null
  }
}

const POLARITY_OPTIONS = [
  {
    value: 'plus',
    labelKey: 'power.polarityPlus',
    active: 'border-red-600 bg-red-600 font-semibold text-white',
  },
  {
    value: 'minus',
    labelKey: 'power.polarityMinus',
    active: 'border-slate-700 bg-slate-700 font-semibold text-white',
  },
  {
    value: null,
    labelKey: 'power.polarityUnset',
    active: 'border-sky-600 bg-sky-600 font-semibold text-white',
  },
]

/** „Plus-Verteiler“/„Masse-Verteiler“, wenn alle Abgänge dieselbe Polarität haben. */
function panelPolarity(sourceId) {
  const links = outgoing(sourceId)
  if (!links.length) return null
  if (links.every((l) => l.polarity === 'plus')) return 'plus'
  if (links.every((l) => l.polarity === 'minus')) return 'minus'
  return null
}

/** Prefill-Hinweis: Querschnitt des Batterie-Abgangs aus dem Blockdiagramm übernehmen. */
const diagramMainSection = computed(() => {
  if (toNumber(power.value.mainCableSection) !== null) return null
  const batteries = new Set(system.value.components.filter((c) => c.type === 'battery').map((c) => c.id))
  const link = system.value.powerLinks.find(
    (l) => batteries.has(l.from) && l.polarity !== 'minus' && toNumber(l.section) !== null,
  )
  return link ? link.section : null
})

function adoptMainSection() {
  power.value.mainCableSection = diagramMainSection.value
}
</script>

<template>
  <WizardShell step-key="power" :title="t('steps.power')" :subtitle="t('power.subtitle')">
    <p class="text-xs text-slate-500">
      {{ t('power.source', { edition: RULEBOOK_EDITION }) }}
    </p>

    <RuleReport step="power" />

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">{{ t('power.battery') }}</h2>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field" for="batLoc">{{ t('power.location') }}</label>
          <input
            id="batLoc"
            v-model="power.batteryLocation"
            class="input"
            placeholder="Motorraum / Kofferraum"
          />
        </div>
        <div>
          <label class="field" for="batType">{{ t('power.type') }}</label>
          <input id="batType" v-model="power.batteryType" class="input" placeholder="AGM 80 Ah" />
        </div>
        <div class="sm:col-span-2">
          <label class="field" for="batSec">{{ t('power.secured') }}</label>
          <input
            id="batSec"
            v-model="power.batterySecured"
            class="input"
            placeholder="Original Niederhalter verschraubt / Edelstahlwinkel M8"
          />
          <p class="hint">{{ t('power.securedHint') }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('power.mainSection') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('power.mainSectionHint') }}</p>
        </div>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field" for="mainSection">{{ t('power.cableSection') }}</label>
          <select id="mainSection" v-model.number="power.mainCableSection" class="select">
            <option :value="null">{{ t('common.choose') }}</option>
            <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
          </select>
          <p v-if="sectionInfo" class="hint">
            {{ t('power.maxFuse', { awg: sectionInfo.awg, max: sectionInfo.max }) }}
          </p>
          <p v-if="diagramMainSection" class="hint">
            {{ t('power.fromDiagram', { section: diagramMainSection }) }}
            <button type="button" class="font-semibold text-sky-700 underline" @click="adoptMainSection">
              {{ t('power.adopt') }}
            </button>
          </p>
        </div>
        <div>
          <label class="field" for="mainFuse">{{ t('power.mainFuse') }}</label>
          <input
            id="mainFuse"
            v-model.number="power.mainFuseAmps"
            class="input"
            type="number"
            inputmode="numeric"
            min="0"
            placeholder="150"
          />
        </div>
        <div>
          <label class="field" for="fuseType">{{ t('power.fuseType') }}</label>
          <input id="fuseType" v-model="power.mainFuseType" class="input" placeholder="ANL / MIDI / Mega" />
        </div>
        <div>
          <label class="field" for="fuseDist">{{ t('power.fuseDistance') }}</label>
          <input
            id="fuseDist"
            v-model.number="power.mainFuseDistanceCm"
            class="input"
            type="number"
            inputmode="numeric"
            min="0"
            :placeholder="`max. ${MAX_FUSE_DISTANCE_CM}`"
          />
          <p class="hint">{{ t('power.fuseDistanceHint') }}</p>
        </div>

        <div class="sm:col-span-2">
          <span class="field">{{ t('power.panelQuestion') }}</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in [
                { value: true, label: t('power.panelYes') },
                { value: false, label: t('power.panelNo') },
                { value: null, label: t('power.panelUnknown') },
              ]"
              :key="String(opt.value)"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm transition"
              :class="
                power.fuseBeforeMetalPanel === opt.value
                  ? 'border-sky-600 bg-sky-600 font-semibold text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400'
              "
              @click="power.fuseBeforeMetalPanel = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
          <p class="hint">
            {{ t('power.panelHint') }}
          </p>
        </div>

        <div class="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p class="text-sm font-bold text-slate-800">
            {{ t('power.oemTitle', { amps: OEM_GROUND_MAX_MAIN_FUSE_A }) }}
          </p>
          <p class="mt-0.5 text-xs text-slate-600">
            {{ t('power.oemHint', { amps: OEM_GROUND_MAX_MAIN_FUSE_A }) }}
          </p>
          <div class="mt-2 space-y-1.5">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                v-model="power.oemGroundUpgraded"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300"
              />
              {{ t('power.oemUpgraded') }}
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                v-model="power.groundCalculationProvided"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300"
              />
              {{ t('power.oemCalculation') }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">{{ t('power.ground') }}</h2>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-3">
        <div>
          <label class="field" for="gndSection">{{ t('diagram.section') }} (mm²)</label>
          <select id="gndSection" v-model.number="power.groundCableSection" class="select">
            <option :value="null">{{ t('common.choose') }}</option>
            <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
          </select>
        </div>
        <div>
          <label class="field" for="gndLen">{{ t('power.groundLength') }}</label>
          <input
            id="gndLen"
            v-model.number="power.groundLengthCm"
            class="input"
            type="number"
            min="0"
            placeholder="35"
          />
        </div>
        <div>
          <label class="field" for="gndPoint">{{ t('power.groundPoint') }}</label>
          <input
            id="gndPoint"
            v-model="power.groundPoint"
            class="input"
            placeholder="Karosserieschraube Radmulde, blank"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('power.secondBattery') }}</h2>
        </div>
        <label class="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
          <input v-model="power.secondBattery" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
          {{ t('power.installed') }}
        </label>
      </div>
      <div v-if="power.secondBattery" class="card-body grid gap-4 sm:grid-cols-3">
        <div>
          <label class="field" for="secFuse">{{ t('power.secondFuse') }}</label>
          <input
            id="secFuse"
            v-model.number="power.secondBatteryFuseAmps"
            class="input"
            type="number"
            min="0"
          />
        </div>
        <div>
          <label class="field" for="secDist">{{ t('power.secondDistance') }}</label>
          <input
            id="secDist"
            v-model.number="power.secondBatteryDistanceCm"
            class="input"
            type="number"
            min="0"
          />
        </div>
        <div>
          <label class="field" for="chargeSection">{{ t('power.chargingSection') }}</label>
          <select id="chargeSection" v-model.number="power.chargingCableSection" class="select">
            <option :value="null">{{ t('common.choose') }}</option>
            <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('power.distribution') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('power.distributionHint') }}</p>
        </div>
      </div>
      <div class="card-body space-y-4">
        <div v-if="!branchSources.length" class="space-y-2">
          <p class="text-sm text-slate-500">{{ t('power.noDistributor') }}</p>
          <button type="button" class="btn-soft btn-xs" @click="createDistributor">
            {{ t('power.createDistributor') }}
          </button>
        </div>

        <div v-for="source in branchSources" :key="source.id" class="rounded-lg border border-slate-200 p-3">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ typeIcon(source.type) }}</span>
              <span class="text-sm font-bold text-slate-800">{{ componentName(source) }}</span>
              <span
                v-if="panelPolarity(source.id) === 'plus'"
                class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
              >
                {{ t('power.plusDistributor') }}
              </span>
              <span
                v-else-if="panelPolarity(source.id) === 'minus'"
                class="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700"
              >
                {{ t('power.minusDistributor') }}
              </span>
            </div>
          </div>

          <p v-if="!outgoing(source.id).length" class="text-sm text-slate-500">
            {{ t('power.noBranches') }}
          </p>

          <div class="space-y-3">
            <div
              v-for="l in outgoing(source.id)"
              :key="l.id"
              class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end"
            >
              <div>
                <label class="field" :for="`${l.id}-target`">{{ t('power.branchTarget') }}</label>
                <select :id="`${l.id}-target`" v-model="l.to" class="select">
                  <option value="">{{ l.label ? `– (${l.label})` : '–' }}</option>
                  <option v-for="c in targetsFor(source.id)" :key="c.id" :value="c.id">
                    {{ componentName(c) }}
                  </option>
                </select>
              </div>
              <div>
                <label class="field" :for="`${l.id}-br-section`">{{ t('diagram.section') }}</label>
                <select
                  :id="`${l.id}-br-section`"
                  v-model.number="l.section"
                  class="select"
                  :disabled="l.oem"
                >
                  <option :value="null">–</option>
                  <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
                </select>
              </div>
              <div>
                <label class="field" :for="`${l.id}-br-amps`">{{ t('power.branchFuse') }}</label>
                <input
                  :id="`${l.id}-br-amps`"
                  v-model.number="l.fuseAmps"
                  class="input"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  :disabled="l.oem"
                />
              </div>
              <div class="flex items-end">
                <button type="button" class="btn-ghost btn-xs" @click="removeBranch(l.id)">
                  {{ t('common.remove') }}
                </button>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:col-span-3">
                <span class="flex items-center gap-1.5 text-xs text-slate-600">
                  {{ t('power.polarity') }}:
                  <button
                    v-for="opt in POLARITY_OPTIONS"
                    :key="String(opt.value)"
                    type="button"
                    class="rounded-md border px-2 py-0.5 text-xs transition"
                    :class="
                      l.polarity === opt.value
                        ? opt.active
                        : 'border-slate-300 bg-white text-slate-600 hover:border-sky-400'
                    "
                    @click="l.polarity = opt.value"
                  >
                    {{ t(opt.labelKey) }}
                  </button>
                </span>
                <label class="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    class="accent-sky-600"
                    :checked="l.oem"
                    @change="setLinkOem(l, $event.target.checked)"
                  />
                  <span>{{ t('diagram.oemWiring') }}</span>
                </label>
              </div>
            </div>

            <button type="button" class="btn-soft btn-xs w-full" @click="addBranch(source.id)">
              {{ t('power.addBranch') }}
            </button>
          </div>
        </div>

        <div v-if="unassigned.length" class="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p class="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            {{ t('power.unassignedBranches') }}
          </p>
          <div class="space-y-3">
            <div
              v-for="l in unassigned"
              :key="l.id"
              class="grid gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end"
            >
              <div>
                <label class="field" :for="`${l.id}-source`">
                  {{ t('power.assignSource') }}{{ l.label ? ` – ${l.label}` : '' }}
                </label>
                <select :id="`${l.id}-source`" v-model="l.from" class="select">
                  <option value="">–</option>
                  <option v-for="c in system.components" :key="c.id" :value="c.id">
                    {{ componentName(c) }}
                  </option>
                </select>
              </div>
              <div>
                <label class="field" :for="`${l.id}-un-section`">{{ t('diagram.section') }}</label>
                <select :id="`${l.id}-un-section`" v-model.number="l.section" class="select">
                  <option :value="null">–</option>
                  <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
                </select>
              </div>
              <div>
                <label class="field" :for="`${l.id}-un-amps`">{{ t('power.branchFuse') }}</label>
                <input
                  :id="`${l.id}-un-amps`"
                  v-model.number="l.fuseAmps"
                  class="input"
                  type="number"
                  inputmode="numeric"
                  min="0"
                />
              </div>
              <div class="flex items-end">
                <button type="button" class="btn-ghost btn-xs" @click="removeBranch(l.id)">
                  {{ t('common.remove') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">{{ t('power.protection') }}</h2>
      </div>
      <div class="card-body flex flex-wrap gap-2">
        <button
          v-for="opt in PROTECTION_OPTIONS"
          :key="opt.de"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm transition"
          :class="
            power.cableProtection.includes(opt.de)
              ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-800'
              : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400'
          "
          @click="toggleProtection(opt)"
        >
          {{ power.cableProtection.includes(opt.de) ? '✓ ' : '' }}{{ tx(opt) }}
        </button>
      </div>
    </div>

    <SlotGrid step="power" />
  </WizardShell>
</template>
