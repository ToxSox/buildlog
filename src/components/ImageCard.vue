<script setup>
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useMediaStore } from '../stores/media.js'
import { rotate90 } from '../utils/image.js'
import { useI18n } from '../i18n/index.js'
import { useModal } from '../composables/useModal.js'
import { useConfirm } from '../composables/useConfirm.js'

const { t } = useI18n()
const { confirm } = useConfirm()

const props = defineProps({
  slotKey: { type: String, required: true },
  item: { type: Object, required: true },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
})

const store = useProjectStore()
const media = useMediaStore()
const rotating = ref(false)
const rotateError = ref('')
const zoom = ref(false)
const zoomPanel = ref(null)
const zoomTitleId = `zoom-${props.item.id}`

useModal(zoom, zoomPanel, () => {
  zoom.value = false
})

const src = computed(() => media.url(props.item.id))

async function rotate() {
  rotating.value = true
  rotateError.value = ''
  try {
    const blob = await media.get(props.item.id)
    if (!blob) return
    const result = await rotate90(blob, props.item.mime)
    await media.put(props.item.id, result.blob)
    store.updateMedia(props.slotKey, props.item.id, {
      width: result.width,
      height: result.height,
      mime: result.blob.type || props.item.mime,
    })
  } catch (err) {
    // Ohne sichtbare Meldung verschwand nur der Overlay und das Foto blieb, wie
    // es war – man tippt dann wieder und wieder ins Leere. Das Drehen laeuft
    // ueber ein Canvas und scheitert genau auf speicherknappen Telefonen mit
    // grossen Bildern, also am Auto.
    console.error('[emma] Drehen fehlgeschlagen', err)
    rotateError.value = t('uploader.rotateFailed', { reason: err?.message || err })
  } finally {
    rotating.value = false
  }
}

async function remove() {
  if (!(await confirm({ message: t('uploader.deleteConfirm') }))) return
  store.removeMedia(props.slotKey, props.item.id)
}
</script>

<template>
  <figure class="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div class="relative bg-slate-900/5">
      <img
        v-if="src"
        :src="src"
        :alt="item.caption || t('uploader.photo')"
        class="block h-32 w-full cursor-zoom-in object-cover"
        loading="lazy"
        @click="zoom = true"
      />
      <div v-else class="grid h-32 place-items-center text-xs text-slate-400">
        {{ t('uploader.loading') }}
      </div>

      <div v-if="rotating" class="absolute inset-0 grid place-items-center bg-white/70 text-xs font-semibold">
        {{ t('uploader.rotating') }}
      </div>
    </div>

    <figcaption class="space-y-2 p-2">
      <input
        :value="item.caption"
        class="input !py-1 !text-xs"
        :aria-label="t('uploader.caption')"
        :placeholder="t('uploader.caption')"
        @input="store.updateMedia(slotKey, item.id, { caption: $event.target.value })"
      />
      <div class="flex flex-wrap items-center gap-1">
        <button type="button" class="btn-soft btn-xs" :disabled="rotating" @click="rotate">
          {{ t('uploader.rotate') }}
        </button>
        <button
          type="button"
          class="btn-soft btn-xs"
          :disabled="index === 0"
          :title="t('uploader.moveEarlier')"
          :aria-label="t('uploader.moveEarlier')"
          @click="store.moveMedia(slotKey, item.id, -1)"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          class="btn-soft btn-xs"
          :disabled="index >= total - 1"
          :title="t('uploader.moveLater')"
          :aria-label="t('uploader.moveLater')"
          @click="store.moveMedia(slotKey, item.id, 1)"
        >
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" class="btn-ghost btn-xs ml-auto !text-rose-600" @click="remove">
          {{ t('common.delete') }}
        </button>
      </div>
      <p v-if="rotateError" role="alert" class="text-xs font-semibold text-rose-600">{{ rotateError }}</p>
    </figcaption>

    <teleport to="body">
      <!-- `@click.self`, nicht `@click`: Das Bild ist direktes Kind, ein Klick
           darauf schloss also genau das Fenster, das man zum Betrachten des
           Details geoeffnet hatte. SkipDialog und ExampleHint machen es richtig. -->
      <div
        v-if="zoom"
        ref="zoomPanel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="zoomTitleId"
        class="fixed inset-0 z-50 grid place-items-center bg-slate-900/80 p-4"
        @click.self="zoom = false"
      >
        <h2 :id="zoomTitleId" class="sr-only">{{ item.caption || t('uploader.photo') }}</h2>
        <img
          :src="src"
          :alt="item.caption || t('uploader.photo')"
          class="max-h-full max-w-full rounded-lg object-contain"
        />
        <button
          type="button"
          class="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-slate-800"
          :aria-label="t('common.close')"
          @click="zoom = false"
        >
          ✕
        </button>
      </div>
    </teleport>
  </figure>
</template>
