/**
 * Zusammenhalt der Datenbasis.
 *
 * Foto-Slots, Bewertungskriterien, Beispielbilder und Wizard-Schritte werden in
 * vier getrennten Dateien gepflegt. Passt eine Verbindung nicht mehr, merkt der
 * Nutzer das an Stellen, die er nicht selbst aufloesen kann – etwa an einem
 * Pflichtfoto, dessen Feld in seiner Kategorie gar nicht auftaucht.
 *
 *   node tests/sections.test.mjs
 */
import { SECTIONS } from '../src/data/sections.js'
import { CRITERIA } from '../src/data/matrix.js'
import { exampleFor } from '../src/data/examples.js'
import { STEPS } from '../src/data/steps.js'

let fail = 0
const check = (name, list) => {
  if (list.length) {
    console.log('FAIL:', name, '–', list.slice(0, 5).join(' | '))
    fail += 1
  }
}

const slots = SECTIONS.flatMap((section) => section.slots.map((slot) => ({ ...slot, section })))
const duplicates = (values) => values.filter((value, i) => values.indexOf(value) !== i)

check('Slot-Schlüssel sind eindeutig', duplicates(slots.map((s) => s.key)))
check('Abschnitts-Schlüssel sind eindeutig', duplicates(SECTIONS.map((s) => s.key)))

const criterionIds = new Set(CRITERIA.map((c) => c.id))
check(
  'jeder Slot zahlt auf ein bekanntes Kriterium ein',
  slots.filter((s) => s.criterion && !criterionIds.has(s.criterion)).map((s) => `${s.key} → ${s.criterion}`),
)
check(
  'jede Beispiel-Illustration existiert',
  slots.filter((s) => s.example && !exampleFor(s.example)).map((s) => `${s.key} → ${s.example}`),
)

const stepColumns = Object.fromEntries(STEPS.map((s) => [s.key, s.columns]))
check(
  'jeder Abschnitt gehört zu einem bekannten Schritt',
  SECTIONS.filter((s) => !stepColumns[s.step]).map((s) => `${s.key} → ${s.step}`),
)

// Pflicht ohne Sichtbarkeit waere eine Forderung, die der Nutzer nie erfuellen kann.
check(
  'kein Pflichtfoto ohne sichtbares Feld',
  slots.flatMap((s) =>
    (s.required || []).filter((col) => !(s.shown || []).includes(col)).map((col) => `${s.key} in ${col}`),
  ),
)
check(
  'kein sichtbarer Slot in einem Schritt, den es dort nicht gibt',
  slots.flatMap((s) =>
    (s.shown || [])
      .filter((col) => !(stepColumns[s.section.step] || []).includes(col))
      .map((col) => `${s.key} in ${col} (Schritt ${s.section.step})`),
  ),
)

check(
  'jeder Slot ist zweisprachig beschriftet',
  slots.filter((s) => !s.label?.de || !s.label?.en).map((s) => s.key),
)
check(
  'jeder Abschnitt ist zweisprachig beschriftet',
  SECTIONS.filter((s) => !s.title?.de || !s.title?.en).map((s) => s.key),
)

console.log(
  fail === 0
    ? `Datenbasis: alle Checks bestanden (${slots.length} Slots).`
    : `\n${fail} Check(s) fehlgeschlagen.`,
)
process.exit(fail ? 1 : 0)
