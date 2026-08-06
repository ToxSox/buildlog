/**
 * Seitenaufteilung der Fotostrecke im Ausdruck.
 *
 * Fotos sind der eigentliche Nachweis in der Mappe – sie sollen so groß wie
 * möglich auf das Blatt. Weil ein Hochformatfoto in einem breiten, flachen
 * Rahmen winzig wird, hängt die Anzahl pro Seite an der Bildausrichtung:
 * Hochformat zu zweit nebeneinander, Querformat zu viert (2 × 2).
 *
 * Eine Seite bleibt bewusst orientierungsrein. Ein Hochformat quer über zwei
 * Rasterzeilen zu legen, würde die Seite sprengen, sobald es erst nach zwei
 * Querformaten kommt – dann bräuchte es eine dritte Zeile. Orientierungsreine
 * Seiten halten dagegen die Reihenfolge der Foto-Slots exakt ein.
 */

export const PORTRAIT_PER_PAGE = 2
export const LANDSCAPE_PER_PAGE = 4

/**
 * Fehlende Maße (0 oder undefined, etwa wenn das Auslesen fehlschlug) gelten
 * als Querformat – so bleibt das Verhalten wie vor der Umstellung.
 */
export function isPortrait(item) {
  return Number(item?.height) > Number(item?.width)
}

/**
 * Teilt Figuren in orientierungsreine Seiten auf; die Reihenfolge bleibt
 * unverändert.
 *
 * @param {Array<{portrait?: boolean}>} figures
 * @returns {Array<{figures: Array, portrait: boolean}>}
 */
export function paginateFigures(figures) {
  const pages = []
  let run = []
  let runPortrait = false

  const flush = () => {
    if (run.length) pages.push({ figures: run, portrait: runPortrait })
    run = []
  }

  for (const figure of figures || []) {
    const portrait = Boolean(figure.portrait)
    const capacity = portrait ? PORTRAIT_PER_PAGE : LANDSCAPE_PER_PAGE
    if (run.length && (runPortrait !== portrait || run.length >= capacity)) flush()
    if (!run.length) runPortrait = portrait
    run.push(figure)
  }
  flush()

  return pages
}

/**
 * Rastervariante einer Fotoseite – steuert Spalten und Rahmenhöhe im Druck-CSS.
 *
 * Nicht ganz volle Blätter nutzen die volle Blatthöhe: Zwei Bilder stehen
 * nebeneinander über die ganze Höhe, ein einzelnes bekommt das ganze Blatt.
 * Ohne das wären ausgerechnet die halbleeren Seiten kleiner als vorher.
 */
export function layoutFor(page) {
  if (page.figures.length === 1) return 'solo'
  if (page.figures.length === 2) return 'tall'
  return 'wide'
}
