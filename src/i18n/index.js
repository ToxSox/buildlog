import { ref, computed } from 'vue'
import de from './de.js'
import en from './en.js'

export const LANGUAGES = [
  { id: 'de', label: 'Deutsch', short: 'DE' },
  { id: 'en', label: 'English', short: 'EN' },
]

const CATALOGS = { de, en }
const STORAGE_KEY = 'emma-buildlog-lang'

function detectInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && CATALOGS[stored]) return stored
  } catch {
    /* localStorage kann in Privatmodi blockiert sein */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : ''
  return nav.toLowerCase().startsWith('de') ? 'de' : 'en'
}

/** Modulweiter, reaktiver Sprachzustand – von allen Komponenten geteilt. */
export const lang = ref(detectInitial())

export function setLang(next) {
  if (!CATALOGS[next]) return
  lang.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* egal – die Sprache gilt dann nur für diese Sitzung */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = next
}

function lookup(catalog, key) {
  return key.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), catalog)
}

function interpolate(text, params) {
  if (!params) return text
  return String(text).replace(/\{(\w+)\}/g, (match, name) =>
    params[name] === undefined || params[name] === null ? match : String(params[name]),
  )
}

/**
 * Übersetzt einen Schlüssel. Fehlt er in der Zielsprache, wird auf Deutsch
 * zurückgefallen – lieber ein deutscher Text als ein leeres Feld im Ausdruck.
 */
export function translate(key, params, forcedLang) {
  const active = forcedLang || lang.value
  const value = lookup(CATALOGS[active], key) ?? lookup(CATALOGS.de, key)
  if (value === undefined) {
    if (import.meta.env?.DEV) console.warn('[emma] fehlender Übersetzungsschlüssel:', key)
    return key
  }
  return interpolate(value, params)
}

/** Löst inline hinterlegte Objekte der Form { de, en } auf. */
export function translateInline(value, forcedLang) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  const active = forcedLang || lang.value
  return value[active] ?? value.de ?? ''
}

export function useI18n() {
  return {
    lang,
    setLang,
    t: (key, params) => translate(key, params),
    tx: (value) => translateInline(value),
    isGerman: computed(() => lang.value === 'de'),
    locale: computed(() => (lang.value === 'de' ? 'de-DE' : 'en-GB')),
  }
}

if (typeof document !== 'undefined') document.documentElement.lang = lang.value
