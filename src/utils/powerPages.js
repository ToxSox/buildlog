/**
 * Seitenaufteilung von „Strom & Sicherheit“ im Ausdruck.
 *
 * Das Blatt trägt oben die Stammdaten der Stromversorgung, darunter die
 * Tabelle der Verteiler-Abgänge. Bei einer größeren Anlage passte beides nicht
 * mehr auf ein Blatt: Der Browser schob die letzten Abgänge auf ein Zusatzblatt
 * ohne Kopfzeile, das bis auf zwei Zeilen leer blieb und im Fuß die Seitenzahl
 * des Vorblatts trug.
 *
 * Deshalb gilt:
 *  1. Passt alles auf ein Blatt, bleibt es ein Blatt.
 *  2. Passt die Abgangstabelle für sich auf ein Blatt, beginnt sie auf einem
 *     eigenen Blatt und bleibt am Stück.
 *  3. Sprengt sie auch ein eigenes Blatt, beginnt sie direkt unter den
 *     Stammdaten – ein eigenes Blatt spart dann nichts, es kostet nur Platz –
 *     und läuft auf Folgeblättern mit wiederholtem Spaltenkopf weiter.
 *
 * Gerechnet wird in Tabellenzeilen: Eine einzeilige Zeile der `.print-table`
 * ist samt Innenabstand rund 7,1 mm hoch, der Inhaltsbereich eines Blatts
 * zwischen Kopf- und Fußzeile rund 154 mm (siehe print/print.css).
 */

/** Nutzbare Blatthöhe in Tabellenzeilen – knapp 22, eine Zeile Reserve bleibt frei. */
export const SHEET_UNITS = 20.5
/** Abschnittsüberschrift (`.print-h2`) samt Abstand zur Tabelle. */
export const HEADING_UNITS = 1.5
/** Abstand über der zweiten Überschrift eines Blatts (margin-top 5 mm). */
export const GAP_UNITS = 0.75
/** Jede weitere Textzeile einer umbrechenden Zelle (8,5 pt × 1,35). */
const LINE_UNITS = 0.57
/**
 * Weniger Abgänge lohnen den Anfang unter den Stammdaten nicht: Überschrift und
 * Spaltenkopf über einer einzelnen Zeile lesen sich wie ein Rest.
 */
export const MIN_ROWS_ON_FIRST_SHEET = 3

/** Zeichen je Zeile, grob für 8,5 pt: Wertespalte der Stammdaten bzw. eine Abgangsspalte. */
const SUPPLY_CHARS_PER_LINE = 120
const BRANCH_CHARS_PER_LINE = 50

function rowUnits(cells, charsPerLine) {
  const lines = Math.max(1, ...cells.map((cell) => Math.ceil(String(cell ?? '').length / charsPerLine)))
  return 1 + (lines - 1) * LINE_UNITS
}

const branchCells = (row) => [row.source, row.target, row.polarity, row.section, row.fuse]

/**
 * @param {Array<[string, string]>} supplyRows Stammdaten als [Bezeichnung, Wert]
 * @param {Array<object>} branchRows Abgänge (source, target, polarity, section, fuse)
 * @returns {Array<{supply: boolean, branches: Array, continued: boolean}>}
 */
export function paginatePowerData(supplyRows = [], branchRows = []) {
  const supply = supplyRows || []
  const branches = branchRows || []
  const supplyUnits =
    HEADING_UNITS + supply.reduce((sum, [, value]) => sum + rowUnits([value], SUPPLY_CHARS_PER_LINE), 0)
  const units = branches.map((row) => rowUnits(branchCells(row), BRANCH_CHARS_PER_LINE))
  const tableUnits = (list) => HEADING_UNITS + 1 + list.reduce((sum, u) => sum + u, 0)

  const first = { supply: true, branches: [], continued: false }
  if (!branches.length) return [first]

  const firstFree = SHEET_UNITS - supplyUnits - GAP_UNITS
  const whole = tableUnits(units)
  if (whole <= firstFree) return [{ ...first, branches }]
  if (whole <= SHEET_UNITS) return [first, { supply: false, branches, continued: false }]

  const pages = [first]
  let page = first
  let free = firstFree - HEADING_UNITS - 1
  let taken = 0
  // Passt unter die Stammdaten zu wenig, fängt die Tabelle doch auf dem nächsten Blatt an.
  const fitsOnFirst = units.slice(0, MIN_ROWS_ON_FIRST_SHEET).reduce((sum, u) => sum + u, 0) <= free
  if (!fitsOnFirst) free = -Infinity

  branches.forEach((row, i) => {
    // Eine Zeile, die für sich schon ein Blatt sprengt, bekommt trotzdem eins – sonst Endlosschleife.
    if (units[i] > free && (page.branches.length || page === first)) {
      page = { supply: false, branches: [], continued: taken > 0 }
      pages.push(page)
      free = SHEET_UNITS - HEADING_UNITS - 1
    }
    page.branches.push(row)
    free -= units[i]
    taken += 1
  })
  return pages
}
