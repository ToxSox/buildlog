/**
 * Speicherpfade des Projekt-Stores gegen eine IndexedDB im Speicher.
 *
 * Läuft mit `node --import ./tests/support/register.mjs`: Das lenkt
 * `localforage` auf tests/support/localforage.mjs um, das volle Speicher und
 * Lesefehler auf Zuruf vortäuscht.
 */
import { createPinia, setActivePinia } from 'pinia'
import JSZip from 'jszip'
import { stores, control } from './support/localforage.mjs'
import { openUrls } from './support/register.mjs'

const { useProjectStore } = await import('../src/stores/project.js')
const { useMediaStore } = await import('../src/stores/media.js')
const { importArchive } = await import('../src/utils/archive.js')
const { isQuotaError } = await import('../src/utils/storage.js')
const { setLang, translate } = await import('../src/i18n/index.js')

let fail = 0
const check = (name, cond) => {
  if (!cond) {
    console.log('FAIL:', name)
    fail++
  } else {
    console.log('  ok ', name)
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
/** Länger als der 400-ms-Debounce des Autosaves. */
const settle = () => sleep(500)
const photo = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' })

/** Frische App-Instanz auf demselben „Browser-Speicher“ – wie ein Neuladen der Seite. */
async function boot() {
  setActivePinia(createPinia())
  const store = useProjectStore()
  await store.load()
  return { store, media: useMediaStore() }
}

setLang('de')
let { store, media } = await boot()

// ---------------------------------------------------------------------------
// Ein ZIP-Import, dessen Mappe nicht mehr in den Speicher passt, blieb trotzdem
// als aktive Mappe stehen. Ihr geplanter Autosave gelang danach, weil der
// Import seine Fotos zum Aufräumen gelöscht hatte – übrig blieb eine Mappe mit
// Verweisen auf Fotos, die es nicht mehr gab.
// ---------------------------------------------------------------------------
await store.startProject('SQMasterclass')
store.project.meta.vehicleMake = 'Bestand'
await settle()
const before = store.activeId

const zip = new JSZip()
zip.file(
  'project.json',
  JSON.stringify({
    mode: 'SQMasterclass',
    meta: { vehicleMake: 'Import' },
    media: { 'power.battery': [{ id: 'img_a', mime: 'image/jpeg' }] },
  }),
)
zip.file('bilder/img_a.jpg', new Uint8Array([1, 2, 3]))
const archive = await zip.generateAsync({ type: 'uint8array' })

const blobsBefore = stores.media?.size ?? 0
control.failSet = (name, key) => name === 'state' && key.startsWith('project:') && key !== `project:${before}`
let importError = null
try {
  await importArchive(archive)
} catch (err) {
  importError = err
}
control.failSet = null
await settle()

check('gescheiterter Import meldet sich', importError !== null)
check(
  'gescheiterter Import erkennt den vollen Speicher',
  importError?.message.startsWith(translate('storage.quotaFull')),
)
check('nach gescheitertem Import bleibt die bisherige Mappe aktiv', store.activeId === before)
check(
  'nach gescheitertem Import zeigt der Editor die bisherige Mappe',
  store.project.meta.vehicleMake === 'Bestand',
)
check('gescheiterter Import landet nicht in der Mappenliste', store.projects.length === 1)
check(
  'gescheiterter Import hinterlässt keinen Datensatz',
  [...stores.state.keys()].filter((k) => k.startsWith('project:')).length === 1,
)
check('gescheiterter Import hinterlässt keine Fotos', (stores.media?.size ?? 0) === blobsBefore)

// ---------------------------------------------------------------------------
// Schon das bloße Öffnen einer Mappe setzte ihren Änderungszeitpunkt neu – die
// Startseite sortierte sie nach oben, als wäre sie bearbeitet worden.
// ---------------------------------------------------------------------------
const first = store.activeId
await media.put('img_first', photo())
store.addMedia('power.battery', { id: 'img_first' })
await settle()
await store.startProject('SQMasterclass')
await settle()
const stamp = stores.state.get(`project:${first}`).updatedAt
await sleep(5)
await store.switchTo(first)
await settle()
check('Öffnen ändert den Zeitstempel nicht', stores.state.get(`project:${first}`).updatedAt === stamp)
check(
  'Öffnen ändert den Zeitstempel in der Liste nicht',
  store.projects.find((p) => p.id === first).updatedAt === stamp,
)

// ---------------------------------------------------------------------------
// Beim Wechseln blieben alle Fotos der bisherigen Mappe im Speicher – bis zum
// Neuladen summierte sich das über jede je geöffnete Mappe.
// ---------------------------------------------------------------------------
const empty = store.projects.find((p) => p.id !== first).id
await store.switchTo(empty)
check('Wechsel gibt die Fotos der bisherigen Mappe frei', media.blobs.size === 0 && openUrls.size === 0)
await store.switchTo(first)
check('Zurückwechseln lädt die Fotos wieder', media.url('img_first') !== '')

// ---------------------------------------------------------------------------
// Scheiterte das Duplizieren am vollen Speicher, blieben die schon kopierten
// Fotos als Waisen liegen, die keine Mappe kennt.
// ---------------------------------------------------------------------------
await media.put('img_second', photo())
store.addMedia('power.battery', { id: 'img_second' })
await settle()
const mediaBefore = stores.media.size
let copies = 0
control.failSet = (name) => name === 'media' && ++copies > 1
let duplicateError = null
try {
  await store.duplicateActive('Kopie')
} catch (err) {
  duplicateError = err
}
control.failSet = null
check('gescheitertes Duplizieren meldet vollen Speicher', isQuotaError(duplicateError))
check('gescheitertes Duplizieren hinterlässt keine Fotos', stores.media.size === mediaBefore)
check('gescheitertes Duplizieren landet nicht in der Liste', store.projects.length === 2)

// ---------------------------------------------------------------------------
// Scheiterte das Laden beim Start, war die Mappenliste leer, und die nächste
// neue Mappe schrieb einen Index nur mit sich selbst. Die übrigen Mappen lagen
// weiter in der IndexedDB, waren aber nicht mehr erreichbar.
// ---------------------------------------------------------------------------
await settle()
control.failGet = (name, key) => name === 'state' && key === 'index'
;({ store } = await boot())
control.failGet = null
check('gescheitertes Laden wird gemeldet', store.storageErrorKey === 'storage.loadFailed')
await store.startProject('QuickRescue')
check('Index enthält danach nur die neue Mappe', stores.state.get('index').projects.length === 1)

;({ store } = await boot())
check('Neuladen findet alle Mappen wieder', store.projects.length === 3)
check('Neuladen schreibt den reparierten Index', stores.state.get('index').projects.length === 3)
check(
  'wiedergefundene Mappe behält ihren Titel',
  store.projects.some((p) => p.title === 'Bestand'),
)

// ---------------------------------------------------------------------------
// Die Fehlermeldung des Autosaves wurde beim Auftreten übersetzt und blieb nach
// einem Sprachwechsel in der alten Sprache stehen.
// ---------------------------------------------------------------------------
control.failSet = (name) => name === 'state'
store.project.meta.vehicleMake = 'Voll'
await settle()
check('voller Speicher wird gemeldet', store.storageError === translate('storage.autosaveQuota'))
setLang('en')
check(
  'Meldung folgt dem Sprachwechsel',
  store.storageError === translate('storage.autosaveQuota', null, 'en'),
)
setLang('de')
control.failSet = null
await store.flush()
check('Meldung verschwindet nach erfolgreichem Speichern', store.storageError === '')

// ---------------------------------------------------------------------------
// „exceeded“ allein galt als voller Speicher – auch ein Programmfehler wie
// „Maximum call stack size exceeded“ bekam dann den Speicher-Ratschlag.
// ---------------------------------------------------------------------------
check(
  'Stack-Überlauf ist kein voller Speicher',
  !isQuotaError(new RangeError('Maximum call stack size exceeded')),
)
const wrapped = new Error('Autosave fehlgeschlagen.')
wrapped.cause = Object.assign(new Error('x'), { name: 'QuotaExceededError' })
check('verpackter Speicherfehler wird erkannt', isQuotaError(wrapped))

if (fail) {
  console.log(`\n${fail} Store-Check(s) fehlgeschlagen.`)
  process.exit(1)
}
console.log('Store: alle Checks bestanden.')
