import Compressor from 'compressorjs'

/**
 * Zielgröße: Handyfotos kommen mit 5–12 MB an. Für eine A4-Seite reichen
 * 1920 px Kantenlänge locker aus – damit bleibt das PDF klein und der
 * Browser-RAM stabil, auch wenn 60 Bilder in der Mappe liegen.
 */
export const MAX_EDGE = 1920
export const TARGET_QUALITY = 0.82

export function isImage(file) {
  if (!file) return false
  if (typeof file.type === 'string' && file.type.startsWith('image/')) return true
  // Manche Kamera-Apps und WebViews liefern keinen MIME-Typ – dann zählt die Endung.
  return /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif)$/i.test(file.name || '')
}

/** HEIC/HEIF können die meisten Browser außer Safari nicht dekodieren. */
export function isHeic(file) {
  if (!file) return false
  return /hei[cf]/i.test(file.type || '') || /\.hei[cf]$/i.test(file.name || '')
}

/**
 * Komprimiert lokal im Browser. `checkOrientation` dreht das Bild anhand der
 * EXIF-Daten gerade – das behebt die klassischen "liegenden" Handyfotos.
 * Scheitert Compressor.js (auf manchen Geräten passiert das bei Kamerafotos),
 * übernimmt ein schlichter Canvas-Resize als Notweg.
 */
export function compressImage(file, opts = {}) {
  return compressorResize(file, opts).catch((err) =>
    canvasResize(file, opts).catch(() => {
      // Der ursprüngliche Fehler beschreibt die Ursache – der des Notwegs ist Folgefehler.
      throw err
    }),
  )
}

function compressorResize(file, opts = {}) {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      maxWidth: opts.maxEdge ?? MAX_EDGE,
      maxHeight: opts.maxEdge ?? MAX_EDGE,
      quality: opts.quality ?? TARGET_QUALITY,
      checkOrientation: true,
      // PNG-Screenshots (z. B. REW) als JPEG speichern, sobald sie groß werden.
      convertTypes: ['image/png', 'image/bmp', 'image/webp'],
      convertSize: 600_000,
      success: resolve,
      error: reject,
    })
  })
}

/**
 * Notweg ohne Compressor.js: Neuzeichnen über ein Canvas. Die EXIF-Ausrichtung
 * wendet der Browser beim Dekodieren selbst an (`image-orientation: from-image`
 * ist seit Jahren Standard), das Ergebnis ist immer ein JPEG.
 */
function canvasResize(file, opts = {}) {
  const maxEdge = opts.maxEdge ?? MAX_EDGE
  const quality = opts.quality ?? TARGET_QUALITY
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight, 1))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (out) => {
            URL.revokeObjectURL(url)
            if (out) resolve(out)
            else reject(new Error('Canvas lieferte kein Bild'))
          },
          'image/jpeg',
          quality,
        )
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Bild konnte nicht dekodiert werden'))
    }
    img.src = url
  })
}

/** Liest die tatsächlichen Pixelmaße eines Blobs aus. */
export function readDimensions(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

/**
 * Dreht ein Bild physisch um 90° im Uhrzeigersinn und gibt einen neuen Blob
 * zurück. Bewusst nicht per CSS-Transform: so stimmt die Ausrichtung auch im
 * Ausdruck und im ZIP-Export.
 */
export function rotate90(blob, mime) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalHeight
        canvas.height = img.naturalWidth
        const ctx = canvas.getContext('2d')
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(Math.PI / 2)
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
        const type = mime && mime !== 'image/png' ? mime : 'image/jpeg'
        canvas.toBlob(
          (out) => {
            URL.revokeObjectURL(url)
            if (out) resolve({ blob: out, width: canvas.width, height: canvas.height })
            else reject(new Error('Bild konnte nicht gedreht werden'))
          },
          type,
          TARGET_QUALITY,
        )
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Bild konnte nicht geladen werden'))
    }
    img.src = url
  })
}

export function formatBytes(bytes) {
  if (!bytes) return '–'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function extensionFor(mime) {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}
