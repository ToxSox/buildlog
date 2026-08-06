/**
 * Seitenaufteilung der Fotostrecke im Ausdruck.
 *
 * Fotos sind der eigentliche Nachweis in der Mappe. Sechs Bilder pro Blatt
 * machten Stecker und Crimpungen unlesbar – ein Juror lehnt das ab. Deshalb
 * gilt eine harte Obergrenze von zwei Bildern pro Blatt, einstellbar auf eines.
 *
 * Bei höchstens zwei Bildern bekommen Hoch- und Querformat dieselbe Zelle
 * (rund 130 × 139 mm), eine orientierungsabhängige Aufteilung wäre also ohne
 * Wirkung. Nebeneinander schlägt dabei übereinander: Ein 4:3-Foto rendert in
 * einer 130 × 139 mm hohen Zelle mit 130 × 97 mm deutlich größer als in einer
 * flachen 265 × 70 mm breiten.
 */

export const MIN_PHOTOS_PER_PAGE = 1
export const MAX_PHOTOS_PER_PAGE = 2

/** Nur 1 oder 2 sind zulässig; alles andere fällt auf 2 zurück. */
export function photosPerPage(value) {
  return Number(value) === MIN_PHOTOS_PER_PAGE ? MIN_PHOTOS_PER_PAGE : MAX_PHOTOS_PER_PAGE
}

/**
 * Teilt Figuren in Blätter auf; die Reihenfolge bleibt unverändert.
 *
 * @param {Array} figures
 * @param {number} perPage 1 oder 2
 * @returns {Array<{figures: Array}>}
 */
export function paginateFigures(figures, perPage = MAX_PHOTOS_PER_PAGE) {
  const size = photosPerPage(perPage)
  const pages = []
  for (let i = 0; i < (figures || []).length; i += size) {
    pages.push({ figures: figures.slice(i, i + size) })
  }
  return pages
}

/** Rastervariante eines Fotoblatts – steuert Spalten und Rahmenhöhe im Druck-CSS. */
export function layoutFor(page) {
  return page.figures.length === 1 ? 'solo' : 'duo'
}
