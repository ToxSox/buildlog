import { defineStore } from 'pinia'
import { ref, computed, watch, toRaw } from 'vue'
import localforage from 'localforage'
import { createEmptyProject, migrateProject, uid, MODES } from '../data/schema.js'
import { columnForClass } from '../data/matrix.js'
import { useMediaStore } from './media.js'

const stateDb = localforage.createInstance({
  name: 'emma-buildlog',
  storeName: 'state',
  description: 'Autosave des Projekt-States',
})

const STATE_KEY = 'project'

export const useProjectStore = defineStore('project', () => {
  const project = ref(createEmptyProject())
  const ready = ref(false)
  const saving = ref(false)
  const lastSavedAt = ref(null)

  // ---------------------------------------------------------------- Getter
  const mode = computed(() => project.value.mode)
  const isMasterclass = computed(() => project.value.mode === MODES.MASTER)
  const isQuick = computed(() => project.value.mode === MODES.QUICK)
  const hasProject = computed(() => Boolean(project.value.mode))

  /** Matrix-Spalte der gewählten EMMA-Kategorie – steuert Pflichtfelder und Score. */
  const column = computed(() => columnForClass(project.value.meta.emmaClass))

  const title = computed(() => {
    const m = project.value.meta
    const car = [m.vehicleMake, m.vehicleModel].filter(Boolean).join(' ')
    return car || m.participantName || 'Neues Projekt'
  })

  /** Alle Bild-IDs, die aktuell irgendwo referenziert werden. */
  const allMediaIds = computed(() =>
    Object.values(project.value.media || {}).flatMap((list) =>
      (list || []).map((item) => item.id),
    ),
  )

  // ---------------------------------------------------------------- Medien
  function mediaFor(slot) {
    return project.value.media[slot] || []
  }

  function addMedia(slot, entry) {
    if (!project.value.media[slot]) project.value.media[slot] = []
    project.value.media[slot].push({
      id: entry.id || uid('img'),
      caption: entry.caption || '',
      width: entry.width || 0,
      height: entry.height || 0,
      mime: entry.mime || 'image/jpeg',
      name: entry.name || '',
    })
    unskip(slot)
  }

  async function removeMedia(slot, id) {
    const list = project.value.media[slot]
    if (!list) return
    const idx = list.findIndex((i) => i.id === id)
    if (idx >= 0) list.splice(idx, 1)
    if (!list.length) delete project.value.media[slot]
    if (!allMediaIds.value.includes(id)) {
      await useMediaStore().remove(id)
    }
  }

  function updateMedia(slot, id, patch) {
    const item = (project.value.media[slot] || []).find((i) => i.id === id)
    if (item) Object.assign(item, patch)
  }

  function moveMedia(slot, id, delta) {
    const list = project.value.media[slot]
    if (!list) return
    const idx = list.findIndex((i) => i.id === id)
    const next = idx + delta
    if (idx < 0 || next < 0 || next >= list.length) return
    list.splice(next, 0, list.splice(idx, 1)[0])
  }

  // ------------------------------------------------------------ Skip-Liste
  function skip(slot) {
    if (!project.value.skipped.includes(slot)) project.value.skipped.push(slot)
  }
  function unskip(slot) {
    const idx = project.value.skipped.indexOf(slot)
    if (idx >= 0) project.value.skipped.splice(idx, 1)
  }
  function isSkipped(slot) {
    return project.value.skipped.includes(slot)
  }

  // -------------------------------------------------------- Selbstbewertung
  function setAssessment(criterionId, patch) {
    const current = project.value.assessment[criterionId] || { state: null, note: '' }
    project.value.assessment[criterionId] = { ...current, ...patch }
  }

  function assessmentFor(criterionId) {
    return project.value.assessment[criterionId] || { state: null, note: '' }
  }

  // ----------------------------------------------------------- Bonuspunkte
  function addBonusRequest() {
    project.value.bonusRequests.push({ id: uid('bonus'), title: '', description: '', area: '' })
  }

  function removeBonusRequest(id) {
    const idx = project.value.bonusRequests.findIndex((r) => r.id === id)
    if (idx >= 0) project.value.bonusRequests.splice(idx, 1)
  }

  // ------------------------------------------------------------ Listenhelfer
  function pushItem(path, item) {
    const list = resolve(path)
    if (Array.isArray(list)) list.push({ id: uid('item'), ...item })
  }
  function removeItem(path, id) {
    const list = resolve(path)
    if (!Array.isArray(list)) return
    const idx = list.findIndex((i) => i.id === id)
    if (idx >= 0) list.splice(idx, 1)
  }
  function resolve(path) {
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), project.value)
  }

  // ------------------------------------------------------------- Lifecycle
  function startProject(newMode) {
    const fresh = createEmptyProject()
    fresh.mode = newMode
    project.value = fresh
  }

  function setMode(newMode) {
    project.value.mode = newMode
  }

  async function resetProject() {
    project.value = createEmptyProject()
    await useMediaStore().clearAll()
    await stateDb.removeItem(STATE_KEY)
  }

  /** Ersetzt den kompletten State (Import aus ZIP). */
  function replaceProject(raw) {
    project.value = migrateProject(raw)
  }

  async function load() {
    try {
      const raw = await stateDb.getItem(STATE_KEY)
      if (raw) {
        project.value = migrateProject(raw)
        await useMediaStore().hydrate(allMediaIds.value)
      }
    } catch (err) {
      console.error('[emma] Autosave konnte nicht geladen werden', err)
    } finally {
      ready.value = true
    }
  }

  async function save() {
    saving.value = true
    try {
      project.value.updatedAt = new Date().toISOString()
      await stateDb.setItem(STATE_KEY, JSON.parse(JSON.stringify(toRaw(project.value))))
      lastSavedAt.value = new Date()
    } catch (err) {
      console.error('[emma] Autosave fehlgeschlagen', err)
    } finally {
      saving.value = false
    }
  }

  // Debounced Autosave: jede Änderung am State landet nach 400ms in IndexedDB.
  let timer = null
  watch(
    project,
    () => {
      if (!ready.value) return
      clearTimeout(timer)
      timer = setTimeout(save, 400)
    },
    { deep: true },
  )

  return {
    project,
    ready,
    saving,
    lastSavedAt,
    mode,
    isMasterclass,
    isQuick,
    hasProject,
    column,
    title,
    allMediaIds,
    mediaFor,
    addMedia,
    removeMedia,
    updateMedia,
    moveMedia,
    skip,
    unskip,
    isSkipped,
    setAssessment,
    assessmentFor,
    addBonusRequest,
    removeBonusRequest,
    pushItem,
    removeItem,
    startProject,
    setMode,
    resetProject,
    replaceProject,
    load,
    save,
  }
})
