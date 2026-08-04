<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { exportArchive, importArchive } from '../utils/archive.js'
import { formatBytes } from '../utils/image.js'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

const props = defineProps({
  /** 'full' = Export + Import, 'import' = nur Import (Startseite) */
  variant: { type: String, default: 'full' },
})

const router = useRouter()

const busy = ref('')
const message = ref('')
const error = ref('')
const dragOver = ref(false)
const fileInput = ref(null)

async function doExport() {
  busy.value = 'export'
  error.value = ''
  message.value = ''
  try {
    const res = await exportArchive()
    message.value = t('archive.exportDone', { images: res.images, size: formatBytes(res.size) })
  } catch (err) {
    console.error(err)
    error.value = t('archive.exportFailed')
  } finally {
    busy.value = ''
  }
}

async function doImport(file) {
  if (!file) return
  if (!/\.zip$/i.test(file.name)) {
    error.value = t('archive.notZip')
    return
  }
  busy.value = 'import'
  error.value = ''
  message.value = ''
  try {
    const res = await importArchive(file)
    message.value = t('archive.importDone', { restored: res.restored })
    if (props.variant === 'import') router.push('/wizard/fahrzeug')
  } catch (err) {
    console.error(err)
    error.value = err.message || t('archive.importFailed')
  } finally {
    busy.value = ''
  }
}

function onDrop(event) {
  dragOver.value = false
  doImport(event.dataTransfer?.files?.[0])
}

function onPick(event) {
  doImport(event.target.files?.[0])
  event.target.value = ''
}
</script>

<template>
  <div class="space-y-3">
    <div class="grid gap-3" :class="variant === 'full' ? 'sm:grid-cols-2' : ''">
      <div v-if="variant === 'full'" class="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p class="text-sm font-bold text-slate-800">{{ t('archive.exportTitle') }}</p>
        <p class="mt-0.5 text-xs text-slate-600">{{ t('archive.exportHint') }}</p>
        <button type="button" class="btn-primary btn-xs mt-3" :disabled="busy === 'export'" @click="doExport">
          {{ busy === 'export' ? t('archive.exporting') : t('archive.exportButton') }}
        </button>
      </div>

      <div
        class="rounded-lg border-2 border-dashed p-4 transition"
        :class="dragOver ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-white'"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <p class="text-sm font-bold text-slate-800">{{ t('archive.importTitle') }}</p>
        <p class="mt-0.5 text-xs text-slate-600">{{ t('archive.importHint') }}</p>
        <button
          type="button"
          class="btn-soft btn-xs mt-3"
          :disabled="busy === 'import'"
          @click="fileInput?.click()"
        >
          {{ busy === 'import' ? t('archive.importing') : t('archive.importButton') }}
        </button>
        <input ref="fileInput" type="file" accept=".zip,application/zip" class="hidden" @change="onPick" />
      </div>
    </div>

    <p v-if="message" class="text-xs font-semibold text-emerald-700">{{ message }}</p>
    <p v-if="error" class="text-xs font-semibold text-rose-600">{{ error }}</p>
  </div>
</template>
