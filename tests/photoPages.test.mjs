import {
  paginateFigures,
  layoutFor,
  photosPerPage,
  MIN_PHOTOS_PER_PAGE,
  MAX_PHOTOS_PER_PAGE,
} from '../src/utils/photoPages.js'

let fail = 0
const check = (name, cond, detail = '') => {
  if (!cond) {
    console.log('FAIL:', name, detail)
    fail++
  }
}

// ------------------------------------------------------------- Einstellung
check('Standard sind zwei Bilder', photosPerPage(undefined) === 2)
check('eins ist zulaessig', photosPerPage(1) === 1)
check('zwei ist zulaessig', photosPerPage(2) === 2)
// Sechs Bilder pro Blatt waren der Ausgangspunkt der Beschwerde – die Grenze
// darf sich weder ueber die Einstellung noch ueber eine manipulierte ZIP heben.
check('vier faellt auf zwei zurueck', photosPerPage(4) === 2)
check('null faellt auf zwei zurueck', photosPerPage(0) === 2)
check('Unsinn faellt auf zwei zurueck', photosPerPage('viele') === 2)
check('Grenzen sind 1 und 2', MIN_PHOTOS_PER_PAGE === 1 && MAX_PHOTOS_PER_PAGE === 2)

// ------------------------------------------------------------ Aufteilung
const fig = (id) => ({ id })
const five = [fig(1), fig(2), fig(3), fig(4), fig(5)]

const byTwo = paginateFigures(five, 2)
check('fuenf Bilder zu zweit ergeben drei Blaetter', byTwo.length === 3)
check('die ersten Blaetter sind voll', byTwo[0].figures.length === 2 && byTwo[1].figures.length === 2)
check('das letzte Blatt traegt den Rest', byTwo[2].figures.length === 1)

const byOne = paginateFigures(five, 1)
check('fuenf Bilder einzeln ergeben fuenf Blaetter', byOne.length === 5)
check(
  'jedes Blatt traegt genau ein Bild',
  byOne.every((p) => p.figures.length === 1),
)

check(
  'Reihenfolge bleibt erhalten',
  byTwo.flatMap((p) => p.figures.map((f) => f.id)).join(',') === '1,2,3,4,5',
)
check('ohne Angabe gilt der Standard', paginateFigures(five).length === 3)
check('leere Liste ergibt keine Seite', paginateFigures([], 2).length === 0)
check('undefined ergibt keine Seite', paginateFigures(undefined, 2).length === 0)

// ------------------------------------------------------------ Rastervariante
check('ein Bild bekommt das ganze Blatt', layoutFor({ figures: [fig(1)] }) === 'solo')
check('zwei Bilder stehen nebeneinander', layoutFor({ figures: [fig(1), fig(2)] }) === 'duo')

console.log(fail === 0 ? 'Fotoseiten: alle Checks bestanden.' : `\n${fail} Check(s) fehlgeschlagen.`)
process.exit(fail ? 1 : 0)
