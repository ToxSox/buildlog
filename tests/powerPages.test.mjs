import { paginatePowerData, SHEET_UNITS, MIN_ROWS_ON_FIRST_SHEET } from '../src/utils/powerPages.js'

let fail = 0
const check = (name, cond, detail = '') => {
  if (!cond) {
    console.log('FAIL:', name, detail)
    fail++
  }
}

const supply = (n) => Array.from({ length: n }, (_, i) => [`Feld ${i + 1}`, `Wert ${i + 1}`])
const branches = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `l${i}`,
    source: 'ACV Verteiler',
    target: `Mosconi ${i + 1}`,
    polarity: '+12 V',
    section: '35 mm²',
    fuse: '150 A',
  }))
const shape = (pages) =>
  pages.map((p) => `${p.supply ? 'S' : ''}${p.branches.length}${p.continued ? '+' : ''}`).join(' ')

// ------------------------------------------------------------ Normalfall
check('ohne Abgänge ein Blatt', shape(paginatePowerData(supply(7), [])) === 'S0')
check('ohne alles trotzdem ein Blatt', shape(paginatePowerData(undefined, undefined)) === 'S0')
check(
  'wenige Abgänge bleiben beim Stammdatenblatt',
  shape(paginatePowerData(supply(7), branches(6))) === 'S6',
)

// ------------------------------------------------- Tabelle passt allein aufs Blatt
// Der Ausgangsfall: sieben Stammdaten, vierzehn Abgänge. Der Browser schob die
// letzten zwei Abgänge auf ein Zusatzblatt ohne Kopfzeile, das sonst leer blieb.
// Die Tabelle gehört dann geschlossen auf ein eigenes Blatt.
const reported = paginatePowerData(supply(7), branches(14))
check('Ausgangsfall: Tabelle beginnt auf eigenem Blatt', shape(reported) === 'S0 14', shape(reported))
check('Ausgangsfall: kein Fortsetzungsvermerk', !reported[1].continued)
check(
  'Ausgangsfall: Reihenfolge bleibt',
  reported[1].branches.map((b) => b.id).join() ===
    branches(14)
      .map((b) => b.id)
      .join(),
)

// ---------------------------------------------- Tabelle sprengt auch ein Blatt
// Dann bringt ein eigenes Blatt nichts – die Tabelle beginnt unter den
// Stammdaten und läuft weiter, statt ein halb leeres Blatt zu hinterlassen.
const long = paginatePowerData(supply(7), branches(30))
check(
  'lange Tabelle beginnt unter den Stammdaten',
  long[0].supply && long[0].branches.length > 0,
  shape(long),
)
check('lange Tabelle läuft auf Folgeblättern weiter', long.length === 3 && !long[1].supply, shape(long))
check(
  'Folgeblätter tragen den Fortsetzungsvermerk',
  !long[0].continued && long.slice(1).every((p) => p.continued),
)
check(
  'keine Zeile geht verloren oder doppelt',
  long.flatMap((p) => p.branches.map((b) => b.id)).join() ===
    branches(30)
      .map((b) => b.id)
      .join(),
)
check(
  'kein Folgeblatt überschreitet die Blatthöhe',
  long.slice(1).every((p) => 1.5 + 1 + p.branches.length <= SHEET_UNITS),
  shape(long),
)

// Bleibt unter den Stammdaten kaum Platz, stünden dort Überschrift und
// Spaltenkopf über einer einzelnen Zeile – dann lieber gleich ein neues Blatt.
const crowded = paginatePowerData(supply(15), branches(30))
check(
  'kein Tabellenrest unter vollen Stammdaten',
  crowded[0].branches.length === 0 || crowded[0].branches.length >= MIN_ROWS_ON_FIRST_SHEET,
  shape(crowded),
)
check(
  'auch dann geht keine Zeile verloren',
  crowded.flatMap((p) => p.branches).length === 30 && !crowded[1].continued,
  shape(crowded),
)

// ------------------------------------------------------ Zeilenumbrüche zählen
// Lange Zellen brechen um und machen die Zeile höher – nach reiner Zeilenzahl
// passte die Tabelle noch unter die Stammdaten, gedruckt lief sie über.
const wordy = branches(6).map((b) => ({ ...b, target: 'Sehr lange Bezeichnung '.repeat(3) }))
check('umbrechende Zeilen werden höher gerechnet', shape(paginatePowerData(supply(7), wordy)) === 'S0 6')

// Eine einzelne Riesenzeile darf keine Endlosschleife und kein leeres Blatt auslösen.
const huge = [...branches(20), { ...branches(1)[0], id: 'big', target: 'x'.repeat(5000) }]
const hugePages = paginatePowerData(supply(7), huge)
check(
  'Riesenzeile bekommt ein Blatt, kein leeres Blatt entsteht',
  hugePages.slice(1).every((p) => p.branches.length) && hugePages.flatMap((p) => p.branches).length === 21,
  shape(hugePages),
)

console.log(fail === 0 ? 'Strom-Seiten: alle Checks bestanden.' : `\n${fail} Check(s) fehlgeschlagen.`)
process.exit(fail ? 1 : 0)
