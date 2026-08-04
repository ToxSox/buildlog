/**
 * Speicher-Robustheit.
 *
 * Die ganze App lebt davon, dass die Daten im Browser bleiben. Zwei Dinge
 * können das kippen: der Browser räumt die IndexedDB auf, oder der Speicher
 * läuft voll. Beides wird hier behandelt statt still zu scheitern.
 */

/**
 * Bittet den Browser, die Daten dieser Origin nicht automatisch zu löschen.
 * Chrome gewährt das oft still, Firefox fragt nach, Safari ignoriert es –
 * darum ist das Ergebnis nur eine Information, keine Garantie.
 */
export async function requestPersistence() {
  if (!navigator.storage?.persist) return { supported: false, persisted: false }
  try {
    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false
    if (already) return { supported: true, persisted: true }
    const granted = await navigator.storage.persist()
    return { supported: true, persisted: granted }
  } catch (err) {
    console.warn('[emma] Persistenz konnte nicht angefordert werden', err)
    return { supported: true, persisted: false }
  }
}

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return null
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate()
    return {
      usage,
      quota,
      percent: quota ? Math.min(100, Math.round((usage / quota) * 100)) : 0,
      remaining: Math.max(0, quota - usage),
    }
  } catch {
    return null
  }
}

export function isQuotaError(err) {
  if (!err) return false
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    /quota|storage.*full|exceeded/i.test(err.message || '')
  )
}

export function quotaMessage(estimate) {
  const base =
    'Der Browser-Speicher ist voll. Neue Fotos können nicht mehr gesichert werden, ohne dass Platz frei wird.'
  const tip =
    ' Sichere die Mappe als ZIP, lösche danach nicht mehr benötigte Mappen oder einzelne Detailfotos.'
  if (!estimate?.quota) return base + tip
  return `${base} Belegt: ${formatBytes(estimate.usage)} von ${formatBytes(estimate.quota)}.${tip}`
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
