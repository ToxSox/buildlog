<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { requestPersistence, storageEstimate, formatBytes } from '../utils/storage.js'

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
  () => ({ rose: 'bg-rose-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500', slate: 'bg-slate-400' })[tone.value],
)
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-sm font-bold text-slate-800">Speicher & Offline-Betrieb</p>
        <p class="mt-0.5 text-xs text-slate-600">
          Deine Mappen liegen ausschließlich in diesem Browser.
        </p>
      </div>
      <button type="button" class="btn-soft btn-xs" @click="refresh">aktualisieren</button>
    </div>

    <div v-if="estimate" class="mt-3">
      <div class="flex items-baseline justify-between text-xs text-slate-600">
        <span>Belegt</span>
        <span class="tabular-nums">
          {{ formatBytes(estimate.usage) }} von {{ formatBytes(estimate.quota) }}
        </span>
      </div>
      <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
        <div class="h-full rounded-full transition-all" :class="barClass" :style="{ width: `${estimate.percent}%` }" />
      </div>
      <p v-if="estimate.percent >= 70" class="mt-1 text-xs font-semibold text-amber-700">
        Es wird eng. Sichere die Mappe als ZIP und lösche, was du nicht mehr brauchst.
      </p>
    </div>
    <p v-else class="mt-3 text-xs text-slate-500">
      Dieser Browser gibt keine Speicherbelegung preis.
    </p>

    <ul class="mt-3 space-y-1 text-xs">
      <li class="flex gap-2">
        <span>{{ persistence.persisted ? '🔒' : persistence.supported ? '⚠️' : 'ℹ️' }}</span>
        <span :class="persistence.persisted ? 'text-emerald-800' : 'text-slate-600'">
          <template v-if="persistence.persisted">
            Dauerhafte Speicherung aktiv – der Browser räumt deine Mappen nicht von selbst weg.
          </template>
          <template v-else-if="persistence.supported">
            Der Browser hat dauerhafte Speicherung nicht gewährt. Bei Platzmangel kann er die Daten
            löschen – exportiere deine Mappe regelmäßig als ZIP.
          </template>
          <template v-else>
            Dieser Browser kennt keine dauerhafte Speicherung. Exportiere deine Mappe regelmäßig als ZIP.
          </template>
        </span>
      </li>
      <li class="flex gap-2">
        <span>{{ offlineReady ? '📴' : '🌐' }}</span>
        <span :class="offlineReady ? 'text-emerald-800' : 'text-slate-600'">
          <template v-if="offlineReady">
            Offline einsatzbereit – die App startet auch ohne Netz, z. B. auf dem Showplatz.
          </template>
          <template v-else>
            Offline-Vorbereitung läuft. Lade die Seite einmal neu, wenn du sie ohne Netz nutzen willst.
          </template>
        </span>
      </li>
    </ul>

    <p v-if="store.storageError" class="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
      {{ store.storageError }}
    </p>
  </div>
</template>
