<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { requestPersistence, storageEstimate, formatBytes } from '../utils/storage.js'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

const store = useProjectStore()
const estimate = ref(null)
const persistence = ref({ supported: false, persisted: false })
const offlineReady = ref(false)

async function refresh() {
  estimate.value = await storageEstimate()
}

onMounted(async () => {
  persistence.value = await requestPersistence()
  await refresh()
  offlineReady.value = Boolean(navigator.serviceWorker?.controller)
  navigator.serviceWorker?.ready.then(() => {
    offlineReady.value = true
  })
})

const tone = computed(() => {
  if (!estimate.value) return 'slate'
  if (estimate.value.percent >= 90) return 'rose'
  if (estimate.value.percent >= 70) return 'amber'
  return 'emerald'
})

const barClass = computed(
  () =>
    ({ rose: 'bg-rose-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500', slate: 'bg-slate-400' })[
      tone.value
    ],
)
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-sm font-bold text-slate-800">{{ t('storage.title') }}</p>
        <p class="mt-0.5 text-xs text-slate-600">{{ t('storage.hint') }}</p>
      </div>
      <button type="button" class="btn-soft btn-xs" @click="refresh">{{ t('common.refresh') }}</button>
    </div>

    <div v-if="estimate" class="mt-3">
      <div class="flex items-baseline justify-between text-xs text-slate-600">
        <span>{{ t('storage.used') }}</span>
        <span class="tabular-nums">
          {{
            t('storage.ofQuota', { used: formatBytes(estimate.usage), quota: formatBytes(estimate.quota) })
          }}
        </span>
      </div>
      <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          class="h-full rounded-full transition-all"
          :class="barClass"
          :style="{ width: `${estimate.percent}%` }"
        />
      </div>
      <p v-if="estimate.percent >= 70" class="mt-1 text-xs font-semibold text-amber-700">
        {{ t('storage.tight') }}
      </p>
    </div>
    <p v-else class="mt-3 text-xs text-slate-500">
      {{ t('storage.noEstimate') }}
    </p>

    <ul class="mt-3 space-y-1 text-xs">
      <li class="flex gap-2">
        <span>{{ persistence.persisted ? '🔒' : persistence.supported ? '⚠️' : 'ℹ️' }}</span>
        <span :class="persistence.persisted ? 'text-emerald-800' : 'text-slate-600'">
          <template v-if="persistence.persisted">{{ t('storage.persisted') }}</template>
          <template v-else-if="persistence.supported">{{ t('storage.notPersisted') }}</template>
          <template v-else>{{ t('storage.unsupported') }}</template>
        </span>
      </li>
      <li class="flex gap-2">
        <span>{{ offlineReady ? '📴' : '🌐' }}</span>
        <span :class="offlineReady ? 'text-emerald-800' : 'text-slate-600'">
          <template v-if="offlineReady">{{ t('storage.offlineReady') }}</template>
          <template v-else>{{ t('storage.offlinePending') }}</template>
        </span>
      </li>
    </ul>

    <p
      v-if="store.storageError"
      class="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
    >
      {{ store.storageError }}
    </p>
  </div>
</template>
