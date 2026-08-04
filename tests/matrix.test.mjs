import { MATRIX_COLUMNS, maxPointsForColumn, CRITERIA, CLASS_TO_COLUMN } from '../src/data/matrix.js'
import { EMMA_CLASSES } from '../src/data/schema.js'

// Maximalpunkte laut Installation Matrix, Rulebook 2026 Kapitel 10
const EXPECTED = { E: 69, S: 115, M: 161, X: 231, XUNL: 325 }

let fail = 0
const check = (name, cond) => {
  if (!cond) {
    console.log('FAIL:', name)
    fail++
  }
}

MATRIX_COLUMNS.forEach((col) => {
  const actual = maxPointsForColumn(col)
  check(`${col}: ${actual} == ${EXPECTED[col]}`, actual === EXPECTED[col])
})

// Kriterien, die laut Regelwerk in bestimmten Spalten NICHT gelten
const pts = (id) => CRITERIA.find((c) => c.id === id).points
check('Lautsprecherschutz entfaellt in X Unlimited', pts('speakerProtection').XUNL === 0)
check(
  'Normale Nutzbarkeit entfaellt in E und X Unlimited',
  pts('normalUse').E === 0 && pts('normalUse').XUNL === 0,
)
check(
  'System documentation erst ab M',
  pts('sysDoc').E === 0 && pts('sysDoc').S === 0 && pts('sysDoc').M === 10,
)
check('Diagramm-Punkte nur in E und S', pts('diagram').E === 4 && pts('diagram').M === 0)
check('Bonuspunkte: 15 in X, 100 in X Unlimited', pts('bonus').X === 15 && pts('bonus').XUNL === 100)
check('Craftsmanship: 10 in M, 50 in X', pts('craftsmanship').M === 10 && pts('craftsmanship').X === 50)

// jede Klasse muss auf eine gueltige Spalte zeigen
EMMA_CLASSES.forEach((c) => {
  check(`Klasse ${c.id} hat eine Matrix-Spalte`, MATRIX_COLUMNS.includes(CLASS_TO_COLUMN[c.id]))
})

check(
  'jedes Kriterium hat assess-Modus',
  CRITERIA.every((c) => ['auto', 'self'].includes(c.assess)),
)
check(
  'jedes Kriterium ist zweisprachig',
  CRITERIA.every((c) => c.label.de && c.label.en && c.help.de && c.help.en),
)

console.log(fail === 0 ? 'Matrix: alle Checks bestanden.' : `Matrix: ${fail} Check(s) fehlgeschlagen.`)
process.exit(fail ? 1 : 0)
