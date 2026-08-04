<script setup>
import { ref, computed } from 'vue'
import { exampleFor } from '../data/examples.js'
import { useI18n } from '../i18n/index.js'

const { t, tx } = useI18n()

const props = defineProps({
  exampleKey: { type: String, default: '' },
  slotLabel: { type: String, default: '' },
  extraTip: { type: String, default: '' },
})

const open = ref(false)
const example = computed(() => exampleFor(props.exampleKey))
</script>

<template>
  <template v-if="example">
    <button
      type="button"
      class="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-sky-300 bg-sky-50 text-[11px] font-bold text-sky-700 transition hover:bg-sky-100"
      :title="t('example.ariaLabel', { title: tx(example.title) })"
      :aria-label="t('example.ariaLabel', { title: tx(example.title) })"
      @click.stop="open = true"
    >
      i
    </button>

    <teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4"
        @click.self="open = false"
      >
        <div class="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-sky-600">{{ t('example.kicker') }}</p>
              <h3 class="text-base font-bold text-slate-900">{{ slotLabel || tx(example.title) }}</h3>
            </div>
            <button type="button" class="text-slate-400 hover:text-slate-700" @click="open = false">✕</button>
          </div>

          <div class="px-5 py-4">
            <div class="overflow-hidden rounded-lg border border-slate-200" v-html="example.svg()" />
            <p class="mt-3 text-sm text-slate-700">{{ tx(example.caption) }}</p>
            <ul class="mt-2 space-y-1">
              <li v-for="(tip, i) in example.tips" :key="i" class="flex gap-2 text-xs text-slate-600">
                <span class="text-amber-500">💡</span><span>{{ tx(tip) }}</span>
              </li>
              <li v-if="extraTip" class="flex gap-2 text-xs font-semibold text-slate-700">
                <span class="text-amber-500">💡</span><span>{{ extraTip }}</span>
              </li>
            </ul>
          </div>

          <div class="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
            <button type="button" class="btn-primary btn-xs" @click="open = false">{{ t('common.understood') }}</button>
          </div>
        </div>
      </div>
    </teleport>
  </template>
</template>
