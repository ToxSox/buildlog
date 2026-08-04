<script setup>
import { computed, ref } from 'vue'
import { useProjectStore } from '../stores/project.js'
import ImageUploader from './ImageUploader.vue'
import ImageCard from './ImageCard.vue'

const props = defineProps({
  slotDef: { type: Object, required: true },
})

const store = useProjectStore()
const items = computed(() => store.mediaFor(props.slotDef.key))
const isRequired = computed(() => props.slotDef.required.includes(store.mode))
const isMissing = computed(() => isRequired.value && items.value.length === 0)

/** Weitere Detailfotos werden erst nach Klick eingeblendet, damit die Liste ruhig bleibt. */
const addMore = ref(false)
const showUploader = computed(() => items.value.length === 0 || addMore.value)
</script>

<template>
  <div
    class="rounded-lg border p-3"
    :class="isMissing ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50/60'"
  >
    <div class="mb-2 flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-sm font-bold text-slate-800">{{ slotDef.label }}</p>
        <p v-if="slotDef.hint" class="text-xs text-slate-500">{{ slotDef.hint }}</p>
      </div>
      <span
        class="badge shrink-0"
        :class="isRequired ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'"
      >
        {{ isRequired ? 'Pflicht' : 'optional' }}
      </span>
    </div>

    <div v-if="items.length" class="mb-2 grid grid-cols-2 gap-2">
      <ImageCard
        v-for="(item, i) in items"
        :key="item.id"
        :slot-key="slotDef.key"
        :item="item"
        :index="i"
        :total="items.length"
      />
    </div>

    <ImageUploader v-if="showUploader" :slot-key="slotDef.key" :compact="items.length > 0" />

    <button
      v-else-if="slotDef.multiple"
      type="button"
      class="btn-soft btn-xs w-full"
      @click="addMore = true"
    >
      + Weiteres Detailfoto hinzufügen
    </button>

    <p v-if="slotDef.tip" class="mt-2 text-[11px] leading-snug text-slate-500">💡 {{ slotDef.tip }}</p>
  </div>
</template>
