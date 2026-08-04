<script setup>
import { computed } from 'vue'

const props = defineProps({
  percent: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  level: { type: String, default: '' },
  caption: { type: String, default: 'Install-Punkte (geschätzt)' },
})

const barClass = computed(() => {
  if (props.percent >= 90) return 'bg-emerald-500'
  if (props.percent >= 60) return 'bg-sky-500'
  if (props.percent >= 30) return 'bg-amber-500'
  return 'bg-rose-500'
})
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between text-[11px] font-semibold text-slate-600">
      <span>{{ caption }}</span>
      <span class="tabular-nums">{{ score }}/{{ max }}</span>
    </div>
    <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div class="h-full rounded-full transition-all duration-500" :class="barClass" :style="{ width: percent + '%' }" />
    </div>
    <p v-if="level" class="mt-0.5 text-[10px] text-slate-500">{{ level }}</p>
  </div>
</template>
