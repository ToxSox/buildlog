<script setup>
import { ref, toRef } from 'vue'
import { useI18n } from '../i18n/index.js'
import { useModal } from '../composables/useModal.js'

const { t, tx } = useI18n()

const props = defineProps({
  open: { type: Boolean, default: false },
  missing: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'skip'])

const panel = ref(null)
useModal(toRef(props, 'open'), panel, () => emit('close'))
</script>

<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"
      @click.self="$emit('close')"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skip-dialog-title"
        class="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div class="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4">
          <span class="text-2xl">⚠️</span>
          <div>
            <h2 id="skip-dialog-title" class="text-base font-bold text-amber-900">{{ t('skip.title') }}</h2>
            <p class="mt-0.5 text-sm text-amber-800">{{ t('skip.lead') }}</p>
          </div>
        </div>

        <div class="max-h-72 overflow-y-auto px-5 py-4">
          <ul class="space-y-3">
            <li v-for="slot in missing" :key="slot.key" class="flex gap-3">
              <span class="mt-0.5 text-amber-500">●</span>
              <div>
                <p class="text-sm font-semibold text-slate-800">{{ tx(slot.label) }}</p>
                <p v-if="tx(slot.tip)" class="text-xs text-slate-600">{{ tx(slot.tip) }}</p>
                <p v-else-if="tx(slot.hint)" class="text-xs text-slate-500">{{ tx(slot.hint) }}</p>
              </div>
            </li>
          </ul>
        </div>

        <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button type="button" class="btn-soft" @click="$emit('skip')">{{ t('skip.skipAnyway') }}</button>
          <button type="button" class="btn-primary" @click="$emit('close')">{{ t('skip.addNow') }}</button>
        </div>
      </div>
    </div>
  </teleport>
</template>
