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

function addComponent(type) {
  system.value.components.push({
    id: uid('cmp'),
    type,
    name: '',
    detail: '',
    channels: '',
  })
}

function removeComponent(id) {
  const idx = system.value.components.findIndex((c) => c.id === id)
  if (idx >= 0) system.value.components.splice(idx, 1)
  system.value.signalLinks = system.value.signalLinks.filter((l) => l.from !== id && l.to !== id)
  system.value.powerLinks = system.value.powerLinks.filter((l) => l.from !== id && l.to !== id)
}

function addLink(kind) {
  const list = kind === 'signal' ? system.value.signalLinks : system.value.powerLinks
  list.push({ id: uid('lnk'), from: '', to: '', label: '', section: null })
}

function removeLink(kind, id) {
  const list = kind === 'signal' ? system.value.signalLinks : system.value.powerLinks
  const idx = list.findIndex((l) => l.id === id)
  if (idx >= 0) list.splice(idx, 1)
}

const signalDef = computed(() => signalDefinition(system.value) || '')
const powerDef = computed(() => powerDefinition(system.value) || '')
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
            <label class="field">{{ t('diagram.name') }}</label>
            <input v-model="c.name" class="input" :placeholder="typeLabel(c.type)" />
          </div>
          <div>
            <label class="field">{{ t('diagram.detail') }}</label>
            <input v-model="c.detail" class="input" :placeholder="t('diagram.detailPlaceholder')" />
          </div>
          <div>
            <label class="field">{{ t('diagram.channels') }}</label>
            <input v-model="c.channels" class="input" placeholder="2 / 4 / 8" />
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeComponent(c.id)">
            {{ t('common.remove') }}
          </button>
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
            <label class="field">{{ t('diagram.from') }}</label>
            <select v-model="l.from" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field">{{ t('diagram.to') }}</label>
            <select v-model="l.to" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field">{{ t('diagram.cableChannel') }}</label>
            <input v-model="l.label" class="input" placeholder="Cinch Ch 1-2" />
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeLink('signal', l.id)">
            {{ t('common.remove') }}
          </button>
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
        <div
          v-for="l in system.powerLinks"
          :key="l.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label class="field">{{ t('diagram.from') }}</label>
            <select v-model="l.from" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field">{{ t('diagram.to') }}</label>
            <select v-model="l.to" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field">{{ t('diagram.section') }}</label>
            <select v-model.number="l.section" class="select">
              <option :value="null">–</option>
              <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
            </select>
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeLink('power', l.id)">
            {{ t('common.remove') }}
          </button>
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
