<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { COMPONENT_TYPES, uid, CABLE_SECTIONS } from '../data/schema.js'
import WizardShell from '../components/WizardShell.vue'
import MermaidDiagram from '../components/MermaidDiagram.vue'
import { signalDefinition, powerDefinition } from '../utils/mermaid.js'
import { useI18n } from '../i18n/index.js'

const { t, tx } = useI18n()

const store = useProjectStore()
const system = computed(() => store.project.system)

const typeLabel = (type) => tx(COMPONENT_TYPES.find((x) => x.id === type)?.label) || type
const typeIcon = (type) => COMPONENT_TYPES.find((x) => x.id === type)?.icon || '•'

const addComponent = (type) => store.addComponent(type)
const removeComponent = (id) => store.removeComponent(id)

function addLink(kind) {
  if (kind === 'power') {
    store.addPowerLink()
    return
  }
  system.value.signalLinks.push({
    id: uid('lnk'),
    from: '',
    to: '',
    label: '',
    section: null,
    fuseAmps: null,
    polarity: null,
    oem: false,
    remote: false,
  })
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

function removeLink(kind, id) {
  const list = kind === 'signal' ? system.value.signalLinks : system.value.powerLinks
  const idx = list.findIndex((l) => l.id === id)
  if (idx >= 0) list.splice(idx, 1)
}

const signalDef = computed(() => signalDefinition(system.value) || '')
const powerDef = computed(() => powerDefinition(system.value, store.project.power) || '')

/** Beim Massepunkt zeigt der Platzhalter die geerbte Beschreibung aus „Strom & Sicherheit“. */
function detailPlaceholder(component) {
  if (component.type === 'ground' && store.project.power.groundPoint) {
    return store.project.power.groundPoint
  }
  return t('diagram.detailPlaceholder')
}

/** Ein Stromlaufplan ohne Rückweg ist unvollständig – daran erinnern, solange die Masse fehlt. */
const groundMissing = computed(
  () => system.value.powerLinks.length > 0 && !system.value.components.some((c) => c.type === 'ground'),
)
</script>

<template>
  <WizardShell step-key="diagram" :title="t('steps.diagram')" :subtitle="t('diagram.subtitle')">
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('diagram.components') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('diagram.componentsHint') }}</p>
        </div>
      </div>
      <div class="card-body space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="ct in COMPONENT_TYPES"
            :key="ct.id"
            type="button"
            class="btn-soft btn-xs"
            @click="addComponent(ct.id)"
          >
            {{ ct.icon }} + {{ tx(ct.label) }}
          </button>
        </div>

        <p v-if="!system.components.length" class="text-sm text-slate-500">
          {{ t('diagram.empty') }}
        </p>

        <div
          v-for="c in system.components"
          :key="c.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1.5fr_1.5fr_1fr_auto] sm:items-end"
        >
          <span class="text-2xl">{{ typeIcon(c.type) }}</span>
          <div>
            <label class="field" :for="`${c.id}-name`">{{ t('diagram.name') }}</label>
            <input :id="`${c.id}-name`" v-model="c.name" class="input" :placeholder="typeLabel(c.type)" />
          </div>
          <div>
            <label class="field" :for="`${c.id}-detail`">{{ t('diagram.detail') }}</label>
            <input
              :id="`${c.id}-detail`"
              v-model="c.detail"
              class="input"
              :placeholder="detailPlaceholder(c)"
            />
          </div>
          <div>
            <label class="field" :for="`${c.id}-channels`">{{ t('diagram.channels') }}</label>
            <input :id="`${c.id}-channels`" v-model="c.channels" class="input" placeholder="2 / 4 / 8" />
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeComponent(c.id)">
            {{ t('common.remove') }}
          </button>
          <label class="flex items-center gap-1.5 text-xs text-slate-600 sm:col-span-4 sm:col-start-2">
            <input v-model="c.oem" type="checkbox" class="accent-sky-600" />
            <span>{{ t('diagram.oemComponent') }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('diagram.signal') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('diagram.signalHint') }}</p>
        </div>
        <button
          type="button"
          class="btn-soft btn-xs"
          :disabled="system.components.length < 2"
          @click="addLink('signal')"
        >
          {{ t('diagram.addLink') }}
        </button>
      </div>
      <div class="card-body space-y-3">
        <p v-if="!system.signalLinks.length" class="text-sm text-slate-500">
          {{ t('diagram.noSignalLink') }}
        </p>
        <div
          v-for="l in system.signalLinks"
          :key="l.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label class="field" :for="`${l.id}-from`">{{ t('diagram.from') }}</label>
            <select :id="`${l.id}-from`" v-model="l.from" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field" :for="`${l.id}-to`">{{ t('diagram.to') }}</label>
            <select :id="`${l.id}-to`" v-model="l.to" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field" :for="`${l.id}-label`">{{ t('diagram.cableChannel') }}</label>
            <input
              :id="`${l.id}-label`"
              v-model="l.label"
              class="input"
              :placeholder="l.remote ? 'REM' : 'Cinch Ch 1-2'"
            />
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeLink('signal', l.id)">
            {{ t('common.remove') }}
          </button>
          <label class="flex items-center gap-1.5 text-xs text-slate-600 sm:col-span-3">
            <input v-model="l.remote" type="checkbox" class="accent-sky-600" />
            <span>{{ t('diagram.remoteLink') }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('diagram.power') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('diagram.powerHint') }}</p>
        </div>
        <button
          type="button"
          class="btn-soft btn-xs"
          :disabled="system.components.length < 2"
          @click="addLink('power')"
        >
          {{ t('diagram.addLink') }}
        </button>
      </div>
      <div class="card-body space-y-3">
        <p v-if="!system.powerLinks.length" class="text-sm text-slate-500">{{ t('diagram.noPowerLink') }}</p>
        <p
          v-if="groundMissing"
          class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
        >
          ⚠️ {{ t('diagram.groundMissing') }}
        </p>
        <div
          v-for="l in system.powerLinks"
          :key="l.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto] sm:items-end"
        >
          <div>
            <label class="field" :for="`${l.id}-from`">{{ t('diagram.from') }}</label>
            <select :id="`${l.id}-from`" v-model="l.from" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field" :for="`${l.id}-to`">{{ t('diagram.to') }}</label>
            <select :id="`${l.id}-to`" v-model="l.to" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field" :for="`${l.id}-section`">{{ t('diagram.section') }}</label>
            <select :id="`${l.id}-section`" v-model.number="l.section" class="select" :disabled="l.oem">
              <option :value="null">–</option>
              <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
            </select>
          </div>
          <div>
            <label class="field" :for="`${l.id}-fuse`">{{ t('power.branchFuse') }}</label>
            <input
              :id="`${l.id}-fuse`"
              v-model.number="l.fuseAmps"
              class="input"
              type="number"
              inputmode="numeric"
              min="0"
              :disabled="l.oem"
              placeholder="60"
            />
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeLink('power', l.id)">
            {{ t('common.remove') }}
          </button>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:col-span-4">
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
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('diagram.generated') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('diagram.generatedHint') }}</p>
        </div>
      </div>
      <div class="card-body space-y-6">
        <div>
          <p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            {{ t('diagram.signal') }}
          </p>
          <MermaidDiagram :definition="signalDef" id-prefix="signal-edit" />
        </div>
        <div>
          <p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            {{ t('diagram.power') }}
          </p>
          <MermaidDiagram :definition="powerDef" id-prefix="power-edit" />
        </div>
      </div>
    </div>
  </WizardShell>
</template>
