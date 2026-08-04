import Compressor from 'compressorjs'

/**
 * Zielgröße: Handyfotos kommen mit 5–12 MB an. Für eine A4-Seite reichen
 * 1920 px Kantenlänge locker aus – damit bleibt das PDF klein und der
 * Browser-RAM stabil, auch wenn 60 Bilder in der Mappe liegen.
 */
export const MAX_EDGE = 1920
export const TARGET_QUALITY = 0.82

export function isImage(file) {
  return Boolean(file) && typeof file.type === 'string' && file.type.startsWith('image/')
}

/**
 * Komprimiert lokal im Browser. `checkOrientation` dreht das Bild anhand der
 * EXIF-Daten gerade – das behebt die klassischen "liegenden" Handyfotos.
 */
export function compressImage(file, opts = {}) {
  return new Promise((resolve, reject) => {
    /* eslint-disable no-new */
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
