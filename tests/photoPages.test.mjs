import {
  isPortrait,
  paginateFigures,
  layoutFor,
  PORTRAIT_PER_PAGE,
  LANDSCAPE_PER_PAGE,
} from '../src/utils/photoPages.js'

let fail = 0
const check = (name, cond, detail = '') => {
  if (!cond) {
    console.log('FAIL:', name, detail)
    fail++
  }
}

// ------------------------------------------------------------- Ausrichtung
check('hoeher als breit ist Hochformat', isPortrait({ width: 480, height: 640 }))
check('breiter als hoch ist Querformat', !isPortrait({ width: 640, height: 480 }))
check('quadratisch zaehlt als Querformat', !isPortrait({ width: 500, height: 500 }))
// Fehlende Masse duerfen nicht zu Hochformat-Seiten fuehren: sonst wuerde eine
// alte Mappe ohne Dimensionen den Ausdruck auf zwei Bilder pro Blatt strecken.
check('fehlende Masse gelten als Querformat', !isPortrait({ width: 0, height: 0 }))
check('undefined gilt als Querformat', !isPortrait(undefined))

// --------------------------------------------------------------- Kapazitaet
const land = (id) => ({ id, portrait: false })
const port = (id) => ({ id, portrait: true })

const fourLandscape = paginateFigures([land(1), land(2), land(3), land(4)])
check('vier Querformate passen auf ein Blatt', fourLandscape.length === 1)
check('Kapazitaet Querformat ist 4', LANDSCAPE_PER_PAGE === 4)

const fiveLandscape = paginateFigures([land(1), land(2), land(3), land(4), land(5)])
check('fuenf Querformate brauchen zwei Blaetter', fiveLandscape.length === 2)
check('das fuenfte steht allein', fiveLandscape[1].figures.length === 1)

const threePortrait = paginateFigures([port(1), port(2), port(3)])
check('drei Hochformate brauchen zwei Blaetter', threePortrait.length === 2)
check('Kapazitaet Hochformat ist 2', PORTRAIT_PER_PAGE === 2)
check('erstes Blatt traegt zwei Hochformate', threePortrait[0].figures.length === 2)

// ------------------------------------------------- Orientierungsreine Seiten
// Ein Hochformat quer ueber zwei Rasterzeilen wuerde die Seite auf drei Zeilen
// sprengen, sobald es nach zwei Querformaten kommt. Deshalb bleibt jede Seite
// orientierungsrein – und die Reihenfolge der Slots exakt erhalten.
const mixed = paginateFigures([land(1), land(2), port(3), land(4)])
check('gemischte Folge wird getrennt', mixed.length === 3, JSON.stringify(mixed.map((p) => p.figures.length)))
check(
  'jede Seite ist orientierungsrein',
  mixed.every((page) => page.figures.every((f) => f.portrait === page.portrait)),
)
check(
  'Reihenfolge bleibt erhalten',
  mixed.flatMap((page) => page.figures.map((f) => f.id)).join(',') === '1,2,3,4',
)

check('leere Liste ergibt keine Seite', paginateFigures([]).length === 0)
check('undefined ergibt keine Seite', paginateFigures(undefined).length === 0)

// ------------------------------------------------------------ Rastervariante
check(
  'ein einzelnes Bild bekommt die volle Breite',
  layoutFor({ figures: [land(1)], portrait: false }) === 'solo',
)
check('einzelnes Hochformat ebenso', layoutFor({ figures: [port(1)], portrait: true }) === 'solo')
check('zwei Hochformate nebeneinander', layoutFor({ figures: [port(1), port(2)], portrait: true }) === 'tall')
// Halbleere Querformat-Blätter nutzen die volle Höhe – sonst wären genau die
// Seiten kleiner als vor der Umstellung.
check(
  'zwei Querformate nutzen die volle Hoehe',
  layoutFor({ figures: [land(1), land(2)], portrait: false }) === 'tall',
)
check(
  'drei Querformate im 2x2',
  layoutFor({ figures: [land(1), land(2), land(3)], portrait: false }) === 'wide',
)
check(
  'vier Querformate im 2x2',
  layoutFor({ figures: [land(1), land(2), land(3), land(4)], portrait: false }) === 'wide',
)

console.log(fail === 0 ? 'Fotoseiten: alle Checks bestanden.' : `\n${fail} Check(s) fehlgeschlagen.`)
process.exit(fail ? 1 : 0)
