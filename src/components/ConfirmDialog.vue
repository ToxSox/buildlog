<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../i18n/index.js'
import { useModal } from '../composables/useModal.js'
import { useConfirmHost } from '../composables/useConfirm.js'

const { t } = useI18n()
const { request, accept, cancel } = useConfirmHost()

const panel = ref(null)
const open = computed(() => Boolean(request.value))

useModal(open, panel, cancel)
</script>

<template>
  <teleport to="body">
    <div
      v-if="request"
      class="wizard-ui fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"
      @click.self="cancel"
    >
      <div
        ref="panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-text"
        class="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div class="flex items-start gap-3 border-b border-rose-200 bg-rose-50 px-5 py-4">
          <span class="text-2xl" aria-hidden="true">🗑️</span>
          <h2 id="confirm-dialog-title" class="text-base font-bold text-rose-900">
            {{ request.title || t('confirm.title') }}
          </h2>
        </div>

        <p id="confirm-dialog-text" class="px-5 py-4 text-sm leading-relaxed text-slate-700">
          {{ request.message }}
        </p>

        <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button type="button" class="btn-soft" @click="cancel">{{ t('confirm.cancel') }}</button>
          <button type="button" class="btn-danger" data-testid="confirm-accept" @click="accept">
            {{ request.confirmLabel || t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
