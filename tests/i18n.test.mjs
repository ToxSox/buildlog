/**
 * Sprachkataloge gegenprüfen.
 *
 * Fehlt ein Schlüssel in der Zielsprache, fällt die App still auf Deutsch
 * zurück – im englischen Ausdruck steht dann ein deutscher Satz. Fehlt er in
 * beiden, landet der rohe Schlüssel im Dokument. Beides sieht man beim
 * Entwickeln kaum, deshalb prüft das hier eine Maschine.
 *
 *   node tests/i18n.test.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import de from '../src/i18n/de.js'
import en from '../src/i18n/en.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

let failures = 0
const check = (name, list) => {
  const ok = list.length === 0
  if (!ok) failures += 1
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${name}${ok ? '' : ` – ${list.slice(0, 8).join(' | ')}`}`)
}

function flatten(obj, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, path, out)
    else out.set(path, String(value))
  }
  return out
}

const DE = flatten(de)
const EN = flatten(en)
const has = (catalog, key) => catalog.has(key)

// ------------------------------------------------ 1. Beide Kataloge deckungsgleich
check(
  'jeder deutsche Schlüssel existiert auf Englisch',
  [...DE.keys()].filter((k) => !has(EN, k)),
)
check(
  'jeder englische Schlüssel existiert auf Deutsch',
  [...EN.keys()].filter((k) => !has(DE, k)),
)

// -------------------------------------- 2. Platzhalter dürfen nicht verloren gehen
const placeholders = (text) =>
  [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(',')
check(
  'Platzhalter stimmen in beiden Sprachen überein',
  [...DE].filter(([k, v]) => has(EN, k) && placeholders(v) !== placeholders(EN.get(k))).map(([k]) => k),
)

// ------------------------------------------- 3. Alle im Code benutzten Schlüssel
const sources = []
;(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(vue|js)$/.test(path)) sources.push(path)
  }
})(SRC)

const used = new Set()
for (const file of sources) {
  const code = readFileSync(file, 'utf8')
  for (const m of code.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'|\btranslate\(\s*'([a-zA-Z0-9_.]+)'/g)) {
    used.add(m[1] || m[2])
  }
}
check(
  'jeder im Code benutzte Schlüssel ist übersetzt',
  [...used].filter((k) => !has(DE, k) || !has(EN, k)),
)

// ------------------------------- 4. Regel-Engine: .title/.message je Befund vorhanden
const rules = readFileSync(join(SRC, 'data/emmaRules.js'), 'utf8')
const ruleKeys = new Set(
  [...rules.matchAll(/(?:key|fixKey):\s*(?:\w+ \?\s*)?'([a-zA-Z0-9_.]+)'(?:\s*:\s*'([a-zA-Z0-9_.]+)')?/g)]
    .flatMap((m) => [m[1], m[2]])
    .filter(Boolean),
)
const ruleMissing = []
for (const key of ruleKeys) {
  const needed = key.includes('.fix') ? [key] : [`${key}.title`, `${key}.message`]
  for (const path of needed) {
    if (!has(DE, path)) ruleMissing.push(`DE ${path}`)
    if (!has(EN, path)) ruleMissing.push(`EN ${path}`)
  }
}
check(`jeder Regel-Befund hat Titel und Text (${ruleKeys.size} Schlüssel)`, ruleMissing)

console.log(failures ? `\n${failures} i18n-Prüfung(en) fehlgeschlagen.` : 'i18n: alle Checks bestanden.')
process.exit(failures ? 1 : 0)
