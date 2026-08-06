<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import PhotoSlot from './PhotoSlot.vue'
import { useI18n } from '../i18n/index.js'

const { t, tx } = useI18n()

const props = defineProps({
  /** Pfad im Store, z. B. 'hardware.amps' */
  path: { type: String, required: true },
  title: { type: String, required: true },
  intro: { type: String, default: '' },
  addLabel: { type: String, default: '' },
  emptyLabel: { type: String, default: '' },
  /** [{ key, label, placeholder, type, options, span }] */
  fields: { type: Array, required: true },
  /**
   * Wenn gesetzt, bekommt jeder Eintrag einen eigenen Foto-Slot
   * (z. B. 'craft.customParts' -> 'craft.customParts.<id>').
   */
  photoSlotPrefix: { type: String, default: '' },
  photoLabel: { type: String, default: '' },
  photoExample: { type: String, default: '' },
})

const store = useProjectStore()

const items = computed(() => {
  const list = props.path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), store.project)
  return Array.isArray(list) ? list : []
})

function slotDefFor(item, index) {
  return {
    key: `${props.photoSlotPrefix}.${item.id}`,
    label: {
      de: `${props.photoLabel} #${index + 1}${item[props.fields[0].key] ? ` – ${item[props.fields[0].key]}` : ''}`,
      en: `${props.photoLabel} #${index + 1}${item[props.fields[0].key] ? ` – ${item[props.fields[0].key]}` : ''}`,
    },
    shown: ['E', 'S', 'M', 'X', 'XUNL'],
    required: [],
    criterion: '',
    multiple: true,
    example: props.photoExample,
    hint: { de: '', en: '' },
    tip: { de: '', en: '' },
  }
}

/** Mit dem Eintrag verschwinden auch seine Fotos – sonst bleiben sie unerreichbar im Speicher. */
async function remove(item) {
  if (props.photoSlotPrefix) await store.removeMediaSlot(`${props.photoSlotPrefix}.${item.id}`)
  store.removeItem(props.path, item.id)
}

const optionValue = (option) => (typeof option === 'string' ? option : option.de)

function add() {
  const blank = {}
  props.fields.forEach((f) => (blank[f.key] = f.type === 'number' ? null : ''))
  store.pushItem(props.path, blank)
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
            <label class="field" :for="`${item.id}-${f.key}`">{{ tx(f.label) }}</label>
            <select
              v-if="f.type === 'select'"
              :id="`${item.id}-${f.key}`"
              v-model="item[f.key]"
              class="select"
            >
              <option value="">–</option>
              <!-- Optionen dürfen { de, en } sein: gespeichert wird der deutsche Wert. -->
              <option v-for="o in f.options" :key="optionValue(o)" :value="optionValue(o)">
                {{ typeof o === 'string' ? o : tx(o) }}
              </option>
            </select>
            <textarea
              v-else-if="f.type === 'textarea'"
              :id="`${item.id}-${f.key}`"
              v-model="item[f.key]"
              class="textarea"
              :placeholder="tx(f.placeholder)"
            />
            <input
              v-else
              :id="`${item.id}-${f.key}`"
              v-model="item[f.key]"
              class="input"
              :type="f.type === 'number' ? 'number' : 'text'"
              :placeholder="tx(f.placeholder)"
            />
          </div>
        </div>

        <div v-if="photoSlotPrefix" class="mt-3">
          <PhotoSlot :slot-def="slotDefFor(item, i)" />
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
