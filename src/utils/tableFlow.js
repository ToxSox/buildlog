/**
 * Verteilt Tabellen auf Druckblätter („Strom & Sicherheit“, „Verbaute Komponenten“).
 *
 * Beide Abschnitte waren früher fest ein Blatt bzw. in grob geschätzten
 * Zeilen-Einheiten aufgeteilt. Das ging in beide Richtungen schief: Die
 * Abgangstabelle lief über und hinterließ zwei Zeilen auf einem Zusatzblatt
 * ohne Kopfzeile; die Komponenten dagegen schoben den Subwoofer allein auf ein
 * zweites Blatt, obwohl auf dem ersten noch Platz war.
 *
 * Deshalb gilt je Tabelle:
 *  1. Passt sie auf das laufende Blatt, steht sie dort.
 *  2. Passt sie für sich auf ein Blatt, beginnt sie auf einem neuen und bleibt
 *     am Stück.
 *  3. Sprengt sie auch ein eigenes Blatt, bringt der Wechsel nichts: Sie beginnt
 *     auf dem laufenden Blatt und läuft auf Folgeblättern mit wiederholter
 *     Überschrift („Fortsetzung“) und Spaltenkopf weiter.
 *
 * Gerechnet wird in Millimetern. Die Höhen misst die Druckvorschau im Browser
 * nach (views/PrintView.vue); bis dahin – und auf schmalen Displays, wo die
 * Vorschau skaliert – gelten die Schätzwerte unten.
 */

/** Abstand über jeder weiteren Tabelle eines Blatts (margin-top). */
export const BLOCK_GAP_MM = 4

/**
 * Weniger Zeilen lohnen den Anfang auf einem angebrochenen Blatt nicht:
 * Überschrift und Spaltenkopf über einer einzelnen Zeile lesen sich wie ein Rest.
 */
export const MIN_LEADING_ROWS = 3

/** Schätzwerte, im Chromium an der `.print-table` nachgemessen (8,5 pt). */
export const ESTIMATE = {
  /** Inhaltshöhe eines Blatts zwischen Kopf- und Fußzeile, abzüglich Reserve (gemessen 153,6 mm). */
  capacity: 146,
  /** `.print-h2` samt Abstand zur Tabelle (gemessen 9,3 mm). */
  heading: 9.5,
  /** Einzeilige Tabellenzeile samt Innenabstand. */
  row: 7.1,
  /** Jede weitere Textzeile einer umbrechenden Zelle (8,5 pt × 1,35). */
  line: 4.1,
  /** Fließtext unter den Tabellen (9 pt × 1,35). */
  textLine: 4.3,
}

/**
 * Geschätzte Zeilenhöhe: Die längste Zelle entscheidet, wie oft die Zeile umbricht.
 * @param {Array} cells Zellinhalte
 * @param {number} charsPerLine grobe Zeichenzahl, die in eine Spalte passt
 */
export function estimateRow(cells, charsPerLine) {
  const lines = Math.max(1, ...cells.map((cell) => Math.ceil(String(cell ?? '').length / charsPerLine)))
  return ESTIMATE.row + (lines - 1) * ESTIMATE.line
}

/** Geschätzte Höhe eines Fließtexts mit Zeilenumbrüchen (white-space: pre-line). */
export function estimateText(text, charsPerLine = 150) {
  const lines = String(text || '')
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
  return lines * ESTIMATE.textLine
}

const total = (rows) => rows.reduce((sum, r) => sum + r.height, 0)

/**
 * @param {Array<{key: string, heading: number, head: number, keepEmpty?: boolean,
 *   rows: Array<{row: any, height: number}>}>} sections Tabellen in Druckreihenfolge,
 *   Höhen in mm (`heading`: Überschrift samt Abstand, `head`: Spaltenkopf oder 0)
 * @param {object} [options]
 * @param {number} [options.capacity] nutzbare Blatthöhe in mm
 * @param {number} [options.trailer] Höhe eines Schlusstexts samt Abstand, 0 = keiner
 * @returns {Array<{blocks: Array<{key: string, rows: Array, continued: boolean}>, trailer: boolean}>}
 */
export function flowTables(sections, { capacity = ESTIMATE.capacity, trailer = 0 } = {}) {
  const pages = []
  let page
  let free
  const newPage = () => {
    page = { blocks: [], trailer: false }
    pages.push(page)
    free = capacity
  }
  newPage()

  for (const section of sections || []) {
    const rows = section.rows || []
    if (!rows.length && !section.keepEmpty) continue
    const gap = () => (page.blocks.length ? BLOCK_GAP_MM : 0)
    const frame = section.heading + section.head

    if (page.blocks.length && gap() + frame + total(rows) > free) {
      const whole = frame + total(rows)
      const lead = frame + total(rows.slice(0, MIN_LEADING_ROWS))
      if (whole <= capacity || gap() + lead > free) newPage()
    }

    let block
    const open = (continued) => {
      free -= gap() + frame
      block = { key: section.key, rows: [], continued }
      page.blocks.push(block)
    }
    open(false)
    for (const { row, height } of rows) {
      // Eine Zeile, die schon allein ein Blatt sprengt, bleibt stehen – sonst entstünden leere Blätter.
      if (height > free && block.rows.length) {
        newPage()
        open(true)
      }
      block.rows.push(row)
      free -= height
    }
  }

  if (trailer > 0) {
    if (trailer > free && page.blocks.length) newPage()
    page.trailer = true
  }
  return pages
}
