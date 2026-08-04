<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'

const props = defineProps({
  slotDef: { type: Object, required: true },
})

const store = useProjectStore()
const items = computed(() => store.mediaFor(props.slotDef.key))
const isRequired = computed(() => props.slotDef.required.includes(store.mode))
const isMissing = computed(() => isRequired.value && items.value.length === 0)
</script>

<template>
  <div
    class="rounded-lg border p-3"
    :class="isMissing ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50/60'"
  >
    <div class="mb-2 flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate text-sm font-bold text-slate-800">{{ slotDef.label }}</p>
        <p v-if="slotDef.hint" class="text-xs text-slate-500">{{ slotDef.hint }}</p>
      </div>
      <span
        class="badge shrink-0"
        :class="isRequired ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'"
      >
        {{ isRequired ? 'Pflicht' : 'optional' }}
      </span>
    </div>

    <!-- Der Upload-Bereich wird in Schritt 3 (Medien-Engine) eingesetzt. -->
    <div class="rounded-md border border-dashed border-slate-300 bg-white px-3 py-6 text-center">
      <p class="text-xs text-slate-500">
        {{ items.length ? `${items.length} Foto(s) hinterlegt` : 'Noch kein Foto' }}
      </p>
    </div>

    <p v-if="slotDef.tip" class="mt-2 text-[11px] leading-snug text-slate-500">💡 {{ slotDef.tip }}</p>
  </div>
</template>
