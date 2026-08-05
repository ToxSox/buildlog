<script setup>
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useMediaStore } from '../stores/media.js'
import { uid } from '../data/schema.js'
import { compressImage, readDimensions, isImage, isHeic } from '../utils/image.js'
import { isQuotaError, quotaMessage, storageEstimate } from '../utils/storage.js'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

const props = defineProps({
  slotKey: { type: String, required: true },
  multiple: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
})

const store = useProjectStore()
const media = useMediaStore()

const fileInput = ref(null)
const cameraInput = ref(null)
const dragOver = ref(false)
const busy = ref(false)
const progress = ref({ done: 0, total: 0 })
const error = ref('')

const hasCamera = computed(
  () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches,
)

async function handleFiles(fileList) {
  // Ein zweiter Schwung während der Verarbeitung würde die Fortschrittsanzeige
  // zurücksetzen – der Uploader nimmt erst wieder an, wenn er fertig ist.
  if (busy.value) return
  const files = [...(fileList || [])].filter(isImage)
  if (!files.length) {
    error.value = t('uploader.notAnImage')
    return
  }
  error.value = ''
  busy.value = true
  progress.value = { done: 0, total: files.length }

  for (const file of files) {
    try {
      const compressed = await compressImage(file)
      const { width, height } = await readDimensions(compressed)
      const id = uid('img')
      await media.put(id, compressed)
      store.addMedia(props.slotKey, {
        id,
        width,
        height,
        mime: compressed.type || 'image/jpeg',
        name: file.name || '',
      })
    } catch (err) {
      console.error('[emma] Bild konnte nicht verarbeitet werden', err)
      if (isQuotaError(err)) {
        error.value = quotaMessage(await storageEstimate())
        break
      }
      // Die Ursache gehört in die Meldung – ohne sie ist ein Fehler auf dem
      // Showplatz nicht diagnostizierbar. HEIC bekommt einen echten Ausweg.
      error.value = isHeic(file)
        ? t('uploader.heicFailed', { name: file.name || 'Bild' })
        : t('uploader.failed', { name: file.name || 'Bild', reason: err?.message || err })
    } finally {
      progress.value.done += 1
    }
  }

  busy.value = false
  progress.value = { done: 0, total: 0 }
}

function onDrop(event) {
  dragOver.value = false
  handleFiles(event.dataTransfer?.files)
}

function onPick(event) {
  handleFiles(event.target.files)
  event.target.value = ''
}
</script>

<template>
  <div>
    <div
      class="rounded-md border-2 border-dashed transition"
      :class="[
        dragOver ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-white',
        compact ? 'px-3 py-3' : 'px-3 py-5',
      ]"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <div v-if="busy" class="text-center">
        <p class="text-sm font-semibold text-sky-700">
          {{ t('uploader.processing', { current: progress.done + 1, total: progress.total }) }}
        </p>
        <div class="mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full bg-sky-500 transition-all"
            :style="{ width: `${Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%` }"
          />
        </div>
      </div>

      <div v-else class="flex flex-col items-center gap-2 text-center">
        <p class="hidden text-xs text-slate-500 sm:block">{{ t('uploader.dropHint') }}</p>
        <div class="flex flex-wrap justify-center gap-2">
          <button type="button" class="btn-soft btn-xs" @click="fileInput?.click()">
            {{ t('uploader.pickFile') }}
          </button>
          <button
            type="button"
            class="btn-primary btn-xs"
            :class="hasCamera ? '' : 'hidden sm:inline-flex'"
            @click="cameraInput?.click()"
          >
            {{ t('uploader.takePhoto') }}
          </button>
        </div>
        <p class="text-[11px] text-slate-400">{{ t('uploader.resizeHint') }}</p>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        :multiple="multiple"
        @change="onPick"
      />
      <input
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="onPick"
      />
    </div>

    <p v-if="error" class="mt-1 text-xs font-semibold text-rose-600">{{ error }}</p>
  </div>
</template>
