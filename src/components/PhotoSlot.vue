<script setup>
import { computed, ref } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { isSlotRequired } from '../data/sections.js'
import { findCriterion } from '../data/matrix.js'
import ImageUploader from './ImageUploader.vue'
import ImageCard from './ImageCard.vue'
import ExampleHint from './ExampleHint.vue'
import { useI18n } from '../i18n/index.js'

const { t, tx } = useI18n()

const props = defineProps({
  slotDef: { type: Object, required: true },
})

const store = useProjectStore()
const items = computed(() => store.mediaFor(props.slotDef.key))
const isRequired = computed(() => isSlotRequired(props.slotDef, store.column))
const criterion = computed(() => findCriterion(props.slotDef.criterion))
/** Sichtbar Verbautes prüft der Juror am Auto – dann ist das Foto optional. */
const isVisible = computed(() => store.isVisibleNoPhoto(props.slotDef.key))
const showVisibleBadge = computed(() => isVisible.value && items.value.length === 0)
const isMissing = computed(() => isRequired.value && items.value.length === 0 && !isVisible.value)

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
        <p class="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <span>{{ tx(slotDef.label) }}</span>
          <ExampleHint
            :example-key="slotDef.example"
            :slot-label="tx(slotDef.label)"
            :extra-tip="tx(slotDef.tip)"
          />
        </p>
        <p v-if="tx(slotDef.hint)" class="text-xs text-slate-500">{{ tx(slotDef.hint) }}</p>
        <p v-if="criterion && store.column" class="mt-0.5 text-[11px] text-sky-700">
          {{
            t('uploader.paysInto', { criterion: tx(criterion.label), points: criterion.points[store.column] })
          }}
        </p>
      </div>
      <span
        class="badge shrink-0"
        :class="
          showVisibleBadge
            ? 'bg-emerald-100 text-emerald-700'
            : isRequired
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-200 text-slate-600'
        "
      >
        {{
          showVisibleBadge
            ? t('uploader.visibleBadge')
            : isRequired
              ? t('common.required')
              : t('common.optional')
        }}
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

    <ImageUploader
      v-if="showUploader"
      :slot-key="slotDef.key"
      :multiple="slotDef.multiple !== false"
      :compact="items.length > 0"
    />

    <button v-else-if="slotDef.multiple" type="button" class="btn-soft btn-xs w-full" @click="addMore = true">
      {{ t('uploader.addMore') }}
    </button>

    <label v-if="isRequired && !items.length" class="mt-2 flex items-start gap-2 text-xs text-slate-600">
      <input
        type="checkbox"
        class="mt-0.5 accent-emerald-600"
        :checked="isVisible"
        @change="store.setVisibleNoPhoto(slotDef.key, $event.target.checked)"
      />
      <span>{{ t('uploader.visibleNoPhoto') }}</span>
    </label>

    <p v-if="tx(slotDef.tip)" class="mt-2 text-[11px] leading-snug text-slate-500">
      💡 {{ tx(slotDef.tip) }}
    </p>
  </div>
</template>
