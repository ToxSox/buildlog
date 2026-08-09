<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { COMPONENT_TYPES, INSTALL_DEFAULTS } from '../data/schema.js'
import { useI18n } from '../i18n/index.js'
import { useConfirm } from '../composables/useConfirm.js'

const { t, tx } = useI18n()
const { confirm } = useConfirm()

const props = defineProps({
  /** Komponententyp aus COMPONENT_TYPES, z. B. 'amp' */
  type: { type: String, required: true },
  title: { type: String, required: true },
  intro: { type: String, default: '' },
  addLabel: { type: String, default: '' },
  emptyLabel: { type: String, default: '' },
  /**
   * [{ key, source: 'component'|'install', label, placeholder, span }]
   * source 'component' bindet an geteilte Felder (name, channels), die auch das
   * Blockdiagramm zeigt; 'install' an die Montage-Details dieser Seite.
   */
  fields: { type: Array, required: true },
  /** Absicherung aus den eingehenden Stromverbindungen anzeigen/bearbeiten. */
  showFuse: { type: Boolean, default: false },
})

const store = useProjectStore()

const items = computed(() => store.project.system.components.filter((c) => c.type === props.type))

function modelFor(item, field) {
  if (field.source !== 'install') return item
  if (!item.install) item.install = { ...INSTALL_DEFAULTS }
  return item.install
}

const componentName = (id) => {
  const c = store.project.system.components.find((x) => x.id === id)
  if (!c) return ''
  return c.name || tx(COMPONENT_TYPES.find((x) => x.id === c.type)?.label) || c.type
}

/** Absicherung lebt an der Stromverbindung – hier wird dasselbe Link-Objekt editiert. */
const incomingPower = (item) => store.project.system.powerLinks.filter((l) => l.to === item.id && !l.oem)

function add() {
  store.addComponent(props.type)
}

async function remove(item) {
  if (await confirm({ message: t('hardware.removeConfirm') })) store.removeComponent(item.id)
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <div>
        <h2 class="section-title">{{ tx(title) }}</h2>
        <p v-if="tx(intro)" class="mt-0.5 text-sm text-slate-600">{{ tx(intro) }}</p>
      </div>
    </div>
    <div class="card-body space-y-3">
      <p v-if="!items.length" class="text-sm text-slate-500">{{ tx(emptyLabel) }}</p>

      <div
        v-for="(item, i) in items"
        :key="item.id"
        class="rounded-lg border border-slate-200 bg-slate-50 p-3"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">#{{ i + 1 }}</span>
          <button type="button" class="btn-ghost btn-xs" @click="remove(item)">
            {{ t('common.remove') }}
          </button>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="f in fields" :key="f.key" :class="f.span === 2 ? 'sm:col-span-2' : ''">
            <label class="field" :for="`${item.id}-hw-${f.key}`">{{ tx(f.label) }}</label>
            <input
              :id="`${item.id}-hw-${f.key}`"
              v-model="modelFor(item, f)[f.key]"
              class="input"
              type="text"
              :placeholder="tx(f.placeholder)"
            />
          </div>

          <template v-if="showFuse">
            <div v-for="l in incomingPower(item)" :key="l.id">
              <label class="field" :for="`${item.id}-hw-fuse-${l.id}`">
                {{ t('hardware.fuseFrom', { source: componentName(l.from) || '–' }) }}
              </label>
              <input
                :id="`${item.id}-hw-fuse-${l.id}`"
                v-model.number="l.fuseAmps"
                class="input"
                type="number"
                inputmode="numeric"
                min="0"
                placeholder="60"
              />
            </div>
            <p
              v-if="!incomingPower(item).length"
              class="self-end rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              {{ t('hardware.noPowerLink') }}
            </p>
          </template>
        </div>
      </div>

      <!-- Unter der Liste, nicht darüber: Man trägt einen Eintrag ein und legt
           den nächsten direkt darunter an, statt jedes Mal hochzuscrollen. -->
      <button type="button" class="btn-soft btn-xs w-full" @click="add">
        {{ addLabel || `+ ${t('common.add')}` }}
      </button>
    </div>
  </div>
</template>
