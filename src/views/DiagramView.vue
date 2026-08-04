<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { COMPONENT_TYPES, uid, CABLE_SECTIONS } from '../data/schema.js'
import WizardShell from '../components/WizardShell.vue'

const store = useProjectStore()
const system = computed(() => store.project.system)

const componentLabel = (id) => {
  const c = system.value.components.find((x) => x.id === id)
  return c ? c.name || typeLabel(c.type) : '?'
}
const typeLabel = (type) => COMPONENT_TYPES.find((t) => t.id === type)?.label || type
const typeIcon = (type) => COMPONENT_TYPES.find((t) => t.id === type)?.icon || '•'

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

const signalPreview = computed(() =>
  system.value.signalLinks
    .filter((l) => l.from && l.to)
    .map((l) => `${componentLabel(l.from)} → ${componentLabel(l.to)}${l.label ? ` (${l.label})` : ''}`),
)
const powerPreview = computed(() =>
  system.value.powerLinks
    .filter((l) => l.from && l.to)
    .map(
      (l) =>
        `${componentLabel(l.from)} → ${componentLabel(l.to)}${l.section ? ` (${l.section} mm²)` : ''}`,
    ),
)
</script>

<template>
  <WizardShell
    step-key="diagram"
    title="Blockdiagramme"
    subtitle="Du malst nichts – du klickst dein System zusammen. Signalweg und Stromlaufplan entstehen daraus automatisch."
  >
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Komponenten</h2>
          <p class="mt-0.5 text-sm text-slate-600">Erst alle Geräte anlegen, dann verbinden.</p>
        </div>
      </div>
      <div class="card-body space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in COMPONENT_TYPES"
            :key="t.id"
            type="button"
            class="btn-soft btn-xs"
            @click="addComponent(t.id)"
          >
            {{ t.icon }} + {{ t.label }}
          </button>
        </div>

        <p v-if="!system.components.length" class="text-sm text-slate-500">
          Noch keine Komponente angelegt. Starte typischerweise mit „Signalquelle“.
        </p>

        <div
          v-for="c in system.components"
          :key="c.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1.5fr_1.5fr_1fr_auto] sm:items-end"
        >
          <span class="text-2xl">{{ typeIcon(c.type) }}</span>
          <div>
            <label class="field">Bezeichnung</label>
            <input v-model="c.name" class="input" :placeholder="typeLabel(c.type)" />
          </div>
          <div>
            <label class="field">Detail</label>
            <input v-model="c.detail" class="input" placeholder="Modell / Einbauort" />
          </div>
          <div>
            <label class="field">Kanäle</label>
            <input v-model="c.channels" class="input" placeholder="2 / 4 / 8" />
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeComponent(c.id)">Entfernen</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Signalweg</h2>
          <p class="mt-0.5 text-sm text-slate-600">Quelle → DSP → Endstufe → Lautsprecher.</p>
        </div>
        <button type="button" class="btn-soft btn-xs" :disabled="system.components.length < 2" @click="addLink('signal')">
          + Verbindung
        </button>
      </div>
      <div class="card-body space-y-3">
        <p v-if="!system.signalLinks.length" class="text-sm text-slate-500">Noch keine Signalverbindung.</p>
        <div
          v-for="l in system.signalLinks"
          :key="l.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label class="field">von</label>
            <select v-model="l.from" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field">nach</label>
            <select v-model="l.to" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field">Kabel / Kanal</label>
            <input v-model="l.label" class="input" placeholder="Cinch Ch 1-2" />
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeLink('signal', l.id)">Entfernen</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Stromlaufplan</h2>
          <p class="mt-0.5 text-sm text-slate-600">Batterie → Sicherung → Verteiler → Verbraucher.</p>
        </div>
        <button type="button" class="btn-soft btn-xs" :disabled="system.components.length < 2" @click="addLink('power')">
          + Verbindung
        </button>
      </div>
      <div class="card-body space-y-3">
        <p v-if="!system.powerLinks.length" class="text-sm text-slate-500">Noch keine Stromverbindung.</p>
        <div
          v-for="l in system.powerLinks"
          :key="l.id"
          class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label class="field">von</label>
            <select v-model="l.from" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field">nach</label>
            <select v-model="l.to" class="select">
              <option value="">–</option>
              <option v-for="c in system.components" :key="c.id" :value="c.id">
                {{ c.name || typeLabel(c.type) }}
              </option>
            </select>
          </div>
          <div>
            <label class="field">Querschnitt</label>
            <select v-model.number="l.section" class="select">
              <option :value="null">–</option>
              <option v-for="s in CABLE_SECTIONS" :key="s" :value="s">{{ s }} mm²</option>
            </select>
          </div>
          <button type="button" class="btn-ghost btn-xs" @click="removeLink('power', l.id)">Entfernen</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Vorschau</h2>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div>
          <p class="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Signalweg</p>
          <ul class="space-y-1 text-sm text-slate-700">
            <li v-for="(line, i) in signalPreview" :key="i">{{ line }}</li>
            <li v-if="!signalPreview.length" class="text-slate-400">–</li>
          </ul>
        </div>
        <div>
          <p class="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Strom</p>
          <ul class="space-y-1 text-sm text-slate-700">
            <li v-for="(line, i) in powerPreview" :key="i">{{ line }}</li>
            <li v-if="!powerPreview.length" class="text-slate-400">–</li>
          </ul>
        </div>
      </div>
    </div>
  </WizardShell>
</template>
