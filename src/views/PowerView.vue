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

const store = useProjectStore()
const power = computed(() => store.project.power)

const PROTECTION_OPTIONS = [
  'Gummitülle in der Blechdurchführung',
  'Wellrohr / Schutzschlauch',
  'Gewebeband',
  'Kantenschutzprofil',
  'Kabelkanal',
  'Zugentlastung / Kabelbinder',
]

const sectionInfo = computed(() => {
  const mm2 = Number(power.value.mainCableSection)
  if (!mm2) return null
  const entry = FUSE_LIMITS.find((e) => e.mm2 === mm2)
  return { mm2, max: maxAmpsFor(mm2), awg: entry?.awg || '' }
})

function toggleProtection(option) {
  const list = power.value.cableProtection
  const idx = list.indexOf(option)
  if (idx >= 0) list.splice(idx, 1)
  else list.push(option)
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
  <WizardShell
    step-key="power"
    title="Strom & Sicherheit"
    subtitle="Der Block, an dem die meisten Punkte verloren gehen. Die Eingaben werden live gegen das Regelwerk geprüft."
  >
    <p class="text-xs text-slate-500">
      Geprüft gegen das {{ RULEBOOK_EDITION }}. Grundlage der Absicherungswerte ist die dort
      abgedruckte Fuse Size Matrix (nach VW75212, Rechenspannung U = 12 V).
    </p>

    <RuleReport step="power" />

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Batterie</h2>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field" for="batLoc">Einbauort</label>
          <input id="batLoc" v-model="power.batteryLocation" class="input" placeholder="Motorraum / Kofferraum" />
        </div>
        <div>
          <label class="field" for="batType">Typ / Modell</label>
          <input id="batType" v-model="power.batteryType" class="input" placeholder="AGM 80 Ah" />
        </div>
        <div class="sm:col-span-2">
          <label class="field" for="batSec">Befestigung / Sicherung gegen Verrutschen</label>
          <input
            id="batSec"
            v-model="power.batterySecured"
            class="input"
            placeholder="Original Niederhalter verschraubt / Edelstahlwinkel M8"
          />
          <p class="hint">Eine lose Batterie ist ein sofortiger Sicherheitsmangel.</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Hauptleitung & Hauptsicherung</h2>
          <p class="mt-0.5 text-sm text-slate-600">Querschnitt und Sicherungswert müssen zusammenpassen.</p>
        </div>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field" for="mainSection">Querschnitt Pluskabel (mm²)</label>
          <select id="mainSection" v-model.number="power.mainCableSection" class="select">
            <option :value="null">bitte wählen …</option>
            <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
          </select>
          <p v-if="sectionInfo" class="hint">
            {{ sectionInfo.awg }} · maximal zulässige Absicherung:
            <strong>{{ sectionInfo.max }} A</strong> (Fuse Size Matrix)
          </p>
        </div>
        <div>
          <label class="field" for="mainFuse">Hauptsicherung (A)</label>
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
          <label class="field" for="fuseType">Sicherungstyp</label>
          <input id="fuseType" v-model="power.mainFuseType" class="input" placeholder="ANL / MIDI / Mega" />
        </div>
        <div>
          <label class="field" for="fuseDist">Abstand zum Batterie-Pluspol (cm)</label>
          <input
            id="fuseDist"
            v-model.number="power.mainFuseDistanceCm"
            class="input"
            type="number"
            inputmode="numeric"
            min="0"
            :placeholder="`max. ${MAX_FUSE_DISTANCE_CM}`"
          />
          <p class="hint">Gemessen entlang des Kabels vom Pol bis zur Sicherung.</p>
        </div>

        <div class="sm:col-span-2">
          <span class="field">Sitzt die Sicherung vor jeder Blechdurchführung?</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in [
                { value: true, label: 'Ja, vor dem ersten Blech' },
                { value: false, label: 'Nein' },
                { value: null, label: 'weiß ich nicht' },
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
            Das Regelwerk verlangt die Hauptsicherung innerhalb von 40 cm zum Pluspol
            <strong>und/oder</strong> bevor das Kabel ein Blech durchdringt.
          </p>
        </div>

        <div class="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p class="text-sm font-bold text-slate-800">
            Die {{ OEM_GROUND_MAX_MAIN_FUSE_A }}-A-Grenze bei originaler Masseleitung
          </p>
          <p class="mt-0.5 text-xs text-slate-600">
            Ist die OEM-Masseleitung des Fahrzeugs nicht verstärkt, begrenzt das Regelwerk die
            Hauptsicherung (bzw. die Summe mehrerer Hauptsicherungen) auf
            {{ OEM_GROUND_MAX_MAIN_FUSE_A }} A – außer du legst eine eigene Berechnung bei.
          </p>
          <div class="mt-2 space-y-1.5">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input v-model="power.oemGroundUpgraded" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              Masseleitung Motor/Karosserie ↔ Batterie wurde verstärkt
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                v-model="power.groundCalculationProvided"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300"
              />
              Berechnung nach Judge-Book-Formel liegt der Mappe bei
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Masse</h2>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-3">
        <div>
          <label class="field" for="gndSection">Querschnitt (mm²)</label>
          <select id="gndSection" v-model.number="power.groundCableSection" class="select">
            <option :value="null">bitte wählen …</option>
            <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
          </select>
        </div>
        <div>
          <label class="field" for="gndLen">Länge (cm)</label>
          <input id="gndLen" v-model.number="power.groundLengthCm" class="input" type="number" min="0" placeholder="35" />
        </div>
        <div>
          <label class="field" for="gndPoint">Massepunkt</label>
          <input id="gndPoint" v-model="power.groundPoint" class="input" placeholder="Karosserieschraube Radmulde, blank" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Zweitbatterie / Powercap</h2>
        </div>
        <label class="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
          <input v-model="power.secondBattery" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
          verbaut
        </label>
      </div>
      <div v-if="power.secondBattery" class="card-body grid gap-4 sm:grid-cols-3">
        <div>
          <label class="field" for="secFuse">Absicherung (A)</label>
          <input id="secFuse" v-model.number="power.secondBatteryFuseAmps" class="input" type="number" min="0" />
        </div>
        <div>
          <label class="field" for="secDist">Abstand Sicherung ↔ Pol (cm)</label>
          <input id="secDist" v-model.number="power.secondBatteryDistanceCm" class="input" type="number" min="0" />
        </div>
        <div>
          <label class="field" for="chargeSection">Ladekabel-Querschnitt (mm²)</label>
          <select id="chargeSection" v-model.number="power.chargingCableSection" class="select">
            <option :value="null">bitte wählen …</option>
            <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Verteiler & Abgänge</h2>
          <p class="mt-0.5 text-sm text-slate-600">
            Jeder Abgang mit kleinerem Querschnitt braucht eine eigene Sicherung.
          </p>
        </div>
        <button type="button" class="btn-soft btn-xs" @click="addBranch">+ Abgang</button>
      </div>
      <div class="card-body space-y-3">
        <p v-if="!power.distributionFuses.length" class="text-sm text-slate-500">
          Noch keine Abgänge erfasst.
        </p>
        <div
          v-for="branch in power.distributionFuses"
          :key="branch.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
        >
          <div>
            <label class="field">Bezeichnung</label>
            <input v-model="branch.label" class="input" placeholder="Endstufe Front" />
          </div>
          <div>
            <label class="field">Querschnitt</label>
            <select v-model.number="branch.section" class="select">
              <option :value="null">–</option>
              <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
            </select>
          </div>
          <div>
            <label class="field">Sicherung (A)</label>
            <input v-model.number="branch.amps" class="input" type="number" min="0" />
          </div>
          <div class="flex items-end">
            <button type="button" class="btn-ghost btn-xs" @click="removeBranch(branch.id)">Entfernen</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Kabelschutz</h2>
      </div>
      <div class="card-body flex flex-wrap gap-2">
        <button
          v-for="opt in PROTECTION_OPTIONS"
          :key="opt"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm transition"
          :class="
            power.cableProtection.includes(opt)
              ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-800'
              : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400'
          "
          @click="toggleProtection(opt)"
        >
          {{ power.cableProtection.includes(opt) ? '✓ ' : '' }}{{ opt }}
        </button>
      </div>
    </div>

    <SlotGrid step="power" />
  </WizardShell>
</template>
