import JSZip from 'jszip'
import { useProjectStore } from '../stores/project.js'
import { useMediaStore } from '../stores/media.js'
import { extensionFor } from './image.js'
import { migrateProject, uid } from '../data/schema.js'
import { translate } from '../i18n/index.js'

const PROJECT_FILE = 'project.json'
const IMAGE_DIR = 'bilder'

function slug(text) {
  return (
    String(text || '')
      .toLowerCase()
      .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c])
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'projekt'
  )
}

export function archiveFileName(project) {
  const meta = project.meta || {}
  const name = slug([meta.vehicleMake, meta.vehicleModel].filter(Boolean).join('-') || meta.participantName)
  const date = new Date().toISOString().slice(0, 10)
  return `emma-buildlog_${name}_${date}.zip`
}

/** Packt State + alle Bilder in eine ZIP und startet den Download. */
export async function exportArchive() {
  const store = useProjectStore()
  const media = useMediaStore()
  const project = JSON.parse(JSON.stringify(store.project))

  const zip = new JSZip()
  zip.file(PROJECT_FILE, JSON.stringify(project, null, 2))

  const images = zip.folder(IMAGE_DIR)
  const manifest = []

  for (const [slotKey, items] of Object.entries(project.media || {})) {
    for (const item of items || []) {
      const blob = await media.get(item.id)
      if (!blob) continue
      const fileName = `${item.id}.${extensionFor(item.mime)}`
      images.file(fileName, blob)
      manifest.push({ slot: slotKey, id: item.id, file: `${IMAGE_DIR}/${fileName}`, caption: item.caption })
    }
  }

  zip.file('bilder-index.json', JSON.stringify(manifest, null, 2))
  zip.file(
    'LIESMICH.txt',
    [
      'EMMA Build Log Creator – Projektarchiv',
      '',
      'project.json      : komplette Mappe als JSON',
      'bilder/           : alle komprimierten Fotos',
      'bilder-index.json : Zuordnung Bild -> Abschnitt',
      '',
      'Diese ZIP kann in der App per Drag & Drop wieder importiert werden.',
      `Erstellt am ${new Date().toLocaleString('de-DE')} mit App-Version ${__APP_VERSION__}`,
    ].join('\n'),
  )

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  triggerDownload(blob, archiveFileName(project))
  return { images: manifest.length, size: blob.size }
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Liest eine zuvor exportierte ZIP wieder ein und ersetzt den aktuellen Stand. */
export async function importArchive(file) {
  const store = useProjectStore()
  const media = useMediaStore()

  const zip = await JSZip.loadAsync(file)
  const entry = zip.file(PROJECT_FILE)
  if (!entry) {
    const err = new Error(translate('archive.noProjectJson'))
    err.userMessage = true
    throw err
  }

  const raw = JSON.parse(await entry.async('string'))
  const project = migrateProject(raw)

  let restored = 0
  for (const [slot, items] of Object.entries(project.media || {})) {
    const kept = []
    for (const item of items || []) {
      const found = findImage(zip, item.id)
      // Ohne Blob wäre der Eintrag nur ein leerer Rahmen im Ausdruck.
      if (!found) continue
      // Frische ID: Der Import legt eine neue Mappe an. Mit den alten IDs würde
      // er die Fotos einer bereits vorhandenen Mappe überschreiben.
      const newId = uid('img')
      const blob = await found.async('blob')
      await media.put(newId, new Blob([blob], { type: item.mime || 'image/jpeg' }))
      kept.push({ ...item, id: newId })
      restored += 1
    }
    if (kept.length) project.media[slot] = kept
    else delete project.media[slot]
  }

  await store.replaceProject(project)
  return { restored }
}

/** Findet das Bild unabhängig von der Dateiendung, mit der es exportiert wurde. */
function findImage(zip, id) {
  const safe = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return zip.file(new RegExp(`^${IMAGE_DIR}/${safe}\\.[^./]+$`, 'i'))[0] || null
}
