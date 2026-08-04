<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { CABLE_SECTIONS, uid } from '../data/schema.js'
import {
  FUSE_LIMITS,
  maxAmpsFor,
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
const PROTECTION_OPTIONS = [
  { de: 'Gummitülle in der Blechdurchführung', en: 'Grommet in the metal pass-through' },
  { de: 'Wellrohr / Schutzschlauch', en: 'Corrugated conduit / protective sleeving' },
  { de: 'Gewebeband', en: 'Fabric tape' },
  { de: 'Kantenschutzprofil', en: 'Edge protection profile' },
  { de: 'Kabelkanal', en: 'Cable duct' },
  { de: 'Zugentlastung / Kabelbinder', en: 'Strain relief / cable ties' },
]

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

function addBranch() {
  power.value.distributionFuses.push({ id: uid('br'), label: '', section: null, amps: null, target: '' })
}

function removeBranch(id) {
  const idx = power.value.distributionFuses.findIndex((b) => b.id === id)
  if (idx >= 0) power.value.distributionFuses.splice(idx, 1)
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
        <button type="button" class="btn-soft btn-xs" @click="addBranch">{{ t('power.addBranch') }}</button>
      </div>
      <div class="card-body space-y-3">
        <p v-if="!power.distributionFuses.length" class="text-sm text-slate-500">
          {{ t('power.noBranches') }}
        </p>
        <div
          v-for="branch in power.distributionFuses"
          :key="branch.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
        >
          <div>
            <label class="field" :for="`${branch.id}-label`">{{ t('power.branchLabel') }}</label>
            <input
              :id="`${branch.id}-label`"
              v-model="branch.label"
              class="input"
              placeholder="Endstufe Front"
            />
          </div>
          <div>
            <label class="field" :for="`${branch.id}-section`">{{ t('diagram.section') }}</label>
            <select :id="`${branch.id}-section`" v-model.number="branch.section" class="select">
              <option :value="null">–</option>
              <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
            </select>
          </div>
          <div>
            <label class="field" :for="`${branch.id}-amps`">{{ t('power.branchFuse') }}</label>
            <input
              :id="`${branch.id}-amps`"
              v-model.number="branch.amps"
              class="input"
              type="number"
              min="0"
            />
          </div>
          <div class="flex items-end">
            <button type="button" class="btn-ghost btn-xs" @click="removeBranch(branch.id)">
              {{ t('common.remove') }}
            </button>
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
