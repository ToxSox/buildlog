<script setup>
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { useMediaStore } from '../stores/media.js'
import { rotate90 } from '../utils/image.js'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

const props = defineProps({
  slotKey: { type: String, required: true },
  item: { type: Object, required: true },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
})

const store = useProjectStore()
const media = useMediaStore()
const rotating = ref(false)
const zoom = ref(false)

const src = computed(() => media.url(props.item.id))

async function rotate() {
  rotating.value = true
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
    console.error('[emma] Drehen fehlgeschlagen', err)
  } finally {
    rotating.value = false
  }
}

function remove() {
  if (!window.confirm(t('uploader.deleteConfirm'))) return
  store.removeMedia(props.slotKey, props.item.id)
}
</script>

<template>
  <figure class="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div class="relative bg-slate-900/5">
      <img
        v-if="src"
        :src="src"
        :alt="item.caption || 'Foto'"
        class="block h-32 w-full cursor-zoom-in object-cover"
        loading="lazy"
        @click="zoom = true"
      />
      <div v-else class="grid h-32 place-items-center text-xs text-slate-400">{{ t('uploader.loading') }}</div>

      <div v-if="rotating" class="absolute inset-0 grid place-items-center bg-white/70 text-xs font-semibold">
        {{ t('uploader.rotating') }}
      </div>
    </div>

    <figcaption class="space-y-2 p-2">
      <input
        :value="item.caption"
        class="input !py-1 !text-xs"
        :placeholder="t('uploader.caption')"
        @input="store.updateMedia(slotKey, item.id, { caption: $event.target.value })"
      />
      <div class="flex flex-wrap items-center gap-1">
        <button type="button" class="btn-soft btn-xs" :disabled="rotating" @click="rotate">{{ t('uploader.rotate') }}</button>
        <button
          type="button"
          class="btn-soft btn-xs"
          :disabled="index === 0"
          :title="t('common.back')"
          @click="store.moveMedia(slotKey, item.id, -1)"
        >
          ←
        </button>
        <button
          type="button"
          class="btn-soft btn-xs"
          :disabled="index >= total - 1"
          :title="t('common.next')"
          @click="store.moveMedia(slotKey, item.id, 1)"
        >
          →
        </button>
        <button type="button" class="btn-ghost btn-xs ml-auto !text-rose-600" @click="remove">{{ t('common.delete') }}</button>
      </div>
    </figcaption>

    <teleport to="body">
      <div
        v-if="zoom"
        class="fixed inset-0 z-50 grid place-items-center bg-slate-900/80 p-4"
        @click="zoom = false"
      >
        <img :src="src" :alt="item.caption || 'Foto'" class="max-h-full max-w-full rounded-lg object-contain" />
      </div>
    </teleport>
  </figure>
</template>
