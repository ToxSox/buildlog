import {
  flowTables,
  estimateRow,
  estimateText,
  ESTIMATE,
  BLOCK_GAP_MM,
  MIN_LEADING_ROWS,
} from '../src/utils/tableFlow.js'

let fail = 0
const check = (name, cond, detail = '') => {
  if (!cond) {
    console.log('FAIL:', name, detail)
    fail++
  }
}

// Höhen wie im Chromium gemessen: Zeile 7,1 mm, Überschrift 9,3 mm, Blatt 151,6 mm.
const CAPACITY = 151.6
const HEADING = 9.3
const ROW = 7.1
const table = (key, n, { head = ROW, height = ROW } = {}) => ({
  key,
  heading: HEADING,
  head,
  rows: Array.from({ length: n }, (_, i) => ({ row: { id: `${key}${i}` }, height })),
})
const flow = (sections, trailer = 0) => flowTables(sections, { capacity: CAPACITY, trailer })
const shape = (pages) =>
  pages
    .map((p) =>
      [
        ...p.blocks.map((b) => `${b.key}${b.rows.length}${b.continued ? '+' : ''}`),
        ...(p.trailer ? ['notiz'] : []),
      ].join(','),
    )
    .join(' | ')
const ids = (pages, key) =>
  pages.flatMap((p) => p.blocks.filter((b) => b.key === key).flatMap((b) => b.rows.map((r) => r.id)))
const supply = (n) => ({ ...table('supply', n, { head: 0 }), keepEmpty: true })

// ------------------------------------------------------------ Normalfall
check('leere Stammdaten behalten ihr Blatt', shape(flow([supply(0), table('branches', 0)])) === 'supply0')
check('ohne Abschnitte ein leeres Blatt', flowTables(undefined).length === 1)
check(
  'wenige Abgänge bleiben beim Stammdatenblatt',
  shape(flow([supply(7), table('branches', 6)])) === 'supply7,branches6',
)

// ------------------------------------------------- Tabelle passt allein aufs Blatt
// Der Ausgangsfall: sieben Stammdaten, vierzehn Abgänge. Der Browser schob die
// letzten zwei Abgänge auf ein Zusatzblatt ohne Kopfzeile, das sonst leer blieb.
// Die Tabelle gehört dann geschlossen auf ein eigenes Blatt.
const reported = flow([supply(7), table('branches', 14)])
check(
  'Ausgangsfall: Tabelle beginnt auf eigenem Blatt',
  shape(reported) === 'supply7 | branches14',
  shape(reported),
)
check(
  'Ausgangsfall: Reihenfolge bleibt',
  ids(reported, 'branches').join() ===
    table('branches', 14)
      .rows.map((r) => r.row.id)
      .join(),
)

// ---------------------------------------------- Tabelle sprengt auch ein Blatt
// Dann bringt ein eigenes Blatt nichts – die Tabelle beginnt unter den
// Stammdaten und läuft weiter, statt ein halb leeres Blatt zu hinterlassen.
const long = flow([supply(7), table('branches', 30)])
check(
  'lange Tabelle beginnt unter den Stammdaten',
  long[0].blocks.length === 2 && long[0].blocks[1].rows.length > 0,
  shape(long),
)
check(
  'Folgeblätter tragen den Fortsetzungsvermerk',
  long.slice(1).every((p) => p.blocks.every((b) => b.continued)),
  shape(long),
)
check(
  'keine Zeile geht verloren oder doppelt',
  ids(long, 'branches').length === 30 && new Set(ids(long, 'branches')).size === 30,
)
const used = (page) =>
  page.blocks.reduce(
    (sum, b, i) =>
      sum + (i ? BLOCK_GAP_MM : 0) + HEADING + (b.key === 'supply' ? 0 : ROW) + b.rows.length * ROW,
    0,
  )
check(
  'kein Blatt überschreitet die Blatthöhe',
  long.every((p) => used(p) <= CAPACITY),
  long.map(used).join(),
)

// Bleibt unter den Stammdaten kaum Platz, stünden dort Überschrift und
// Spaltenkopf über einer einzelnen Zeile – dann lieber gleich ein neues Blatt.
const crowded = flow([supply(16), table('branches', 30)])
check(
  'kein Tabellenrest unter vollen Stammdaten',
  crowded[0].blocks.length === 1 || crowded[0].blocks[1].rows.length >= MIN_LEADING_ROWS,
  shape(crowded),
)
check('dann beginnt die Tabelle ohne Fortsetzungsvermerk', !crowded[1].blocks[0].continued, shape(crowded))

// ------------------------------------------------------- Komponenten-Seiten
// Drei Endstufen, ein DSP, drei Lautsprecher, ein Subwoofer und eine
// zweizeilige Einbau-Notiz: Die grobe Einheitenrechnung schob den Subwoofer
// samt Notiz allein auf ein zweites Blatt, obwohl beides noch aufs erste passte.
const components = [table('amps', 3), table('dsp', 1), table('speakers', 3), table('subs', 1)]
const notes = BLOCK_GAP_MM + 2 * ESTIMATE.textLine
const hw = flow(components, notes)
check('Komponenten samt Notiz auf einem Blatt', shape(hw) === 'amps3,dsp1,speakers3,subs1,notiz', shape(hw))

// Passt die nächste Tabelle nicht mehr, aber allein aufs Blatt, wandert sie
// geschlossen weiter – ohne Fortsetzungsvermerk.
const many = flow([table('amps', 6), table('speakers', 12)])
check(
  'passt nicht mehr dazu, aber allein: ganze Tabelle aufs nächste Blatt',
  shape(many) === 'amps6 | speakers12',
  shape(many),
)

// Die Notiz geht nicht verloren, wenn das letzte Blatt voll ist.
const fullPage = flow([table('amps', 18)], 30)
check('Notiz bekommt notfalls ein eigenes Blatt', shape(fullPage) === 'amps18 | notiz', shape(fullPage))
check('Notiz steht nur einmal', fullPage.filter((p) => p.trailer).length === 1)

// ------------------------------------------------------ Schätzwerte
// Lange Zellen brechen um und machen die Zeile höher – nach reiner Zeilenzahl
// passte die Tabelle noch unter die Stammdaten, gedruckt lief sie über.
check('kurze Zeile ist einzeilig', estimateRow(['ACV Verteiler', '35 mm²'], 50) === ESTIMATE.row)
check(
  'lange Zelle macht die Zeile höher',
  estimateRow(['x'.repeat(120)], 50) === ESTIMATE.row + 2 * ESTIMATE.line,
)
check('leere Zellen stören nicht', estimateRow([null, undefined, ''], 50) === ESTIMATE.row)
check('Notiz zählt ihre Zeilen', estimateText('a\nb') === 2 * ESTIMATE.textLine)

// Eine einzelne Riesenzeile darf keine Endlosschleife und kein leeres Blatt auslösen.
const huge = table('branches', 3)
huge.rows[1].height = 400
const hugePages = flow([supply(7), huge])
check(
  'Riesenzeile erzeugt kein leeres Blatt',
  hugePages.every((p) => p.blocks.every((b) => b.rows.length || b.key === 'supply')) &&
    ids(hugePages, 'branches').length === 3,
  shape(hugePages),
)

console.log(fail === 0 ? 'Tabellen-Aufteilung: alle Checks bestanden.' : `\n${fail} Check(s) fehlgeschlagen.`)
process.exit(fail ? 1 : 0)
