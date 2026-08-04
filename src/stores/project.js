import { defineStore } from 'pinia'
import { ref, computed, watch, toRaw } from 'vue'
import localforage from 'localforage'
import { createEmptyProject, migrateProject, uid, MODES } from '../data/schema.js'
import { columnForClass } from '../data/matrix.js'
import { isQuotaError } from '../utils/storage.js'
import { translate } from '../i18n/index.js'
import { useMediaStore } from './media.js'

const stateDb = localforage.createInstance({
  name: 'emma-buildlog',
  storeName: 'state',
  description: 'Autosave des Projekt-States',
})

const STATE_KEY = 'project'
const INDEX_KEY = 'index'

export const useProjectStore = defineStore('project', () => {
  const project = ref(createEmptyProject())
  const ready = ref(false)
  const saving = ref(false)
  const lastSavedAt = ref(null)
  /** Gesetzt, wenn der Autosave am vollen Browser-Speicher gescheitert ist. */
  const storageError = ref('')

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
    Object.values(project.value.media || {}).flatMap((list) => (list || []).map((item) => item.id)),
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

  // ------------------------------------------------------- Mehrere Mappen
  /** Kurzinfos aller gespeicherten Mappen für die Auswahl auf der Startseite. */
  const projects = ref([])
  const activeId = ref(null)

  const plain = (value) => JSON.parse(JSON.stringify(toRaw(value)))
  const projectKey = (id) => `project:${id}`

  function summarize(id, data) {
    const m = data.meta || {}
    return {
      id,
      title: [m.vehicleMake, m.vehicleModel].filter(Boolean).join(' ') || m.participantName || 'Neue Mappe',
      participant: m.participantName || '',
      emmaClass: m.emmaClass || '',
      mode: data.mode || '',
      updatedAt: data.updatedAt || new Date().toISOString(),
      photos: Object.values(data.media || {}).reduce((n, list) => n + (list?.length || 0), 0),
    }
  }

  async function persistIndex() {
    await stateDb.setItem(INDEX_KEY, { activeId: activeId.value, projects: plain(projects.value) })
  }

  function touchIndexEntry() {
    const entry = summarize(activeId.value, project.value)
    const idx = projects.value.findIndex((p) => p.id === activeId.value)
    if (idx >= 0) projects.value[idx] = entry
    else projects.value.push(entry)
  }

  /** Bild-IDs, die von einer anderen als der aktiven Mappe belegt werden. */
  async function mediaIdsExcept(excludeId) {
    const ids = new Set()
    for (const entry of projects.value) {
      if (entry.id === excludeId) continue
      const data = entry.id === activeId.value ? project.value : await stateDb.getItem(projectKey(entry.id))
      Object.values(data?.media || {}).forEach((list) => (list || []).forEach((item) => ids.add(item.id)))
    }
    return ids
  }

  // ------------------------------------------------------------- Lifecycle
  async function startProject(newMode) {
    const fresh = createEmptyProject()
    fresh.mode = newMode
    activeId.value = uid('prj')
    project.value = fresh
    touchIndexEntry()
    await save()
  }

  function setMode(newMode) {
    project.value.mode = newMode
  }

  async function switchTo(id) {
    if (id === activeId.value) return
    const data = await stateDb.getItem(projectKey(id))
    if (!data) return
    activeId.value = id
    project.value = migrateProject(data)
    await useMediaStore().hydrate(allMediaIds.value)
    await persistIndex()
  }

  /** Kopiert die aktive Mappe inklusive eigener Bildkopien. */
  async function duplicateActive(suffix = '(Kopie)') {
    const media = useMediaStore()
    const copy = migrateProject(plain(project.value))
    copy.createdAt = new Date().toISOString()
    copy.meta.notes = copy.meta.notes || ''
    copy.meta.vehicleModel = `${copy.meta.vehicleModel} ${suffix}`.trim()

    // Bilder physisch kopieren, damit das Löschen der einen Mappe die andere nicht trifft.
    for (const [slot, list] of Object.entries(copy.media)) {
      copy.media[slot] = []
      for (const item of list || []) {
        const blob = await media.get(item.id)
        if (!blob) continue
        const newId = uid('img')
        await media.put(newId, blob)
        copy.media[slot].push({ ...item, id: newId })
      }
    }

    const newId = uid('prj')
    await stateDb.setItem(projectKey(newId), plain(copy))
    projects.value.push(summarize(newId, copy))
    await persistIndex()
    return newId
  }

  async function deleteProject(id) {
    const media = useMediaStore()
    const data = id === activeId.value ? plain(project.value) : await stateDb.getItem(projectKey(id))
    const stillUsed = await mediaIdsExcept(id)

    for (const list of Object.values(data?.media || {})) {
      for (const item of list || []) {
        if (!stillUsed.has(item.id)) await media.remove(item.id)
      }
    }

    await stateDb.removeItem(projectKey(id))
    projects.value = projects.value.filter((p) => p.id !== id)

    if (id === activeId.value) {
      const next = projects.value[0]
      if (next) {
        activeId.value = null
        await switchTo(next.id)
      } else {
        activeId.value = null
        project.value = createEmptyProject()
      }
    }
    await persistIndex()
  }

  async function resetProject() {
    for (const entry of [...projects.value]) await deleteProject(entry.id)
    project.value = createEmptyProject()
    activeId.value = null
    projects.value = []
    await useMediaStore().clearAll()
    await stateDb.removeItem(INDEX_KEY)
  }

  /** Legt eine importierte Mappe als eigenes Projekt an, statt die aktuelle zu überschreiben. */
  async function replaceProject(raw) {
    activeId.value = uid('prj')
    project.value = migrateProject(raw)
    touchIndexEntry()
    await save()
  }

  async function load() {
    try {
      const index = await stateDb.getItem(INDEX_KEY)

      if (index?.projects?.length) {
        projects.value = index.projects
        const wanted =
          index.activeId && index.projects.some((p) => p.id === index.activeId)
            ? index.activeId
            : index.projects[0].id
        const data = await stateDb.getItem(projectKey(wanted))
        if (data) {
          activeId.value = wanted
          project.value = migrateProject(data)
          await useMediaStore().hydrate(allMediaIds.value)
        }
      } else {
        // Migration: Einzelprojekt aus Schema <= 5 in die Mappenliste überführen.
        const legacy = await stateDb.getItem(STATE_KEY)
        if (legacy) {
          activeId.value = uid('prj')
          project.value = migrateProject(legacy)
          projects.value = [summarize(activeId.value, project.value)]
          await stateDb.setItem(projectKey(activeId.value), plain(project.value))
          await stateDb.removeItem(STATE_KEY)
          await persistIndex()
          await useMediaStore().hydrate(allMediaIds.value)
        }
      }
    } catch (err) {
      console.error('[emma] Autosave konnte nicht geladen werden', err)
    } finally {
      ready.value = true
    }
  }

  async function save() {
    if (!activeId.value) return
    saving.value = true
    try {
      project.value.updatedAt = new Date().toISOString()
      await stateDb.setItem(projectKey(activeId.value), plain(project.value))
      touchIndexEntry()
      await persistIndex()
      lastSavedAt.value = new Date()
      storageError.value = ''
    } catch (err) {
      console.error('[emma] Autosave fehlgeschlagen', err)
      storageError.value = isQuotaError(err)
        ? translate('storage.autosaveQuota')
        : translate('storage.autosaveFailed')
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
    projects,
    activeId,
    ready,
    saving,
    lastSavedAt,
    storageError,
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
    switchTo,
    duplicateActive,
    deleteProject,
    resetProject,
    replaceProject,
    load,
    save,
  }
})
