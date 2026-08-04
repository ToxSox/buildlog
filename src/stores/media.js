import { defineStore } from 'pinia'
import { ref } from 'vue'
import localforage from 'localforage'

/**
 * Bilder werden als Blob in einer eigenen IndexedDB-Tabelle abgelegt.
 * Der Pinia-State hält nur Object-URLs, damit der JSON-Autosave klein bleibt
 * und der RAM nicht mit Base64-Strings vollläuft.
 */
const mediaDb = localforage.createInstance({
  name: 'emma-buildlog',
  storeName: 'media',
  description: 'Komprimierte Fotos der Build-Log-Mappe',
})

export const useMediaStore = defineStore('media', () => {
  /** id -> ObjectURL (reaktiv, damit <img> automatisch nachzieht) */
  const urls = ref({})
  /** id -> Blob (nicht reaktiv nötig, aber praktisch für Export) */
  const blobs = new Map()

  function attach(id, blob) {
    if (urls.value[id]) URL.revokeObjectURL(urls.value[id])
    blobs.set(id, blob)
    urls.value[id] = URL.createObjectURL(blob)
  }

  async function put(id, blob) {
    attach(id, blob)
    await mediaDb.setItem(id, blob)
  }

  async function get(id) {
    if (blobs.has(id)) return blobs.get(id)
    const blob = await mediaDb.getItem(id)
    if (blob) attach(id, blob)
    return blob
  }

  async function remove(id) {
    if (urls.value[id]) URL.revokeObjectURL(urls.value[id])
    delete urls.value[id]
    blobs.delete(id)
    await mediaDb.removeItem(id)
  }

  /** Lädt beim App-Start alle referenzierten Bilder aus der IndexedDB. */
  async function hydrate(ids) {
    await Promise.all(ids.map((id) => get(id).catch(() => null)))
  }

  async function clearAll() {
    Object.values(urls.value).forEach((u) => URL.revokeObjectURL(u))
    urls.value = {}
    blobs.clear()
    await mediaDb.clear()
  }

  /** Entfernt Blobs, die von keinem Slot mehr referenziert werden. */
  async function pruneOrphans(referencedIds) {
    const keep = new Set(referencedIds)
    const keys = await mediaDb.keys()
    await Promise.all(keys.filter((k) => !keep.has(k)).map((k) => remove(k)))
  }

  function url(id) {
    return urls.value[id] || ''
  }

  return { urls, blobs, put, get, remove, hydrate, clearAll, pruneOrphans, url }
})
