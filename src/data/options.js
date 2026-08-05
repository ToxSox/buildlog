import { translateInline } from '../i18n/index.js'

/**
 * Auswahllisten, deren Wert gespeichert wird.
 *
 * Gespeichert wird immer der deutsche Text – er ist der Schlüssel und bleibt
 * stabil, auch wenn der Nutzer die Sprache wechselt. Angezeigt und gedruckt
 * wird die Fassung der aktiven Sprache.
 */

export const CABLE_PROTECTION = [
  { de: 'Gummitülle in der Blechdurchführung', en: 'Grommet in the metal pass-through' },
  { de: 'Wellrohr / Schutzschlauch', en: 'Corrugated conduit / protective sleeving' },
  { de: 'Gewebeband', en: 'Fabric tape' },
  { de: 'Kantenschutzprofil', en: 'Edge protection profile' },
  { de: 'Kabelkanal', en: 'Cable duct' },
  { de: 'Zugentlastung / Kabelbinder', en: 'Strain relief / cable ties' },
]

export const FABRICATION_TECHNIQUES = [
  { de: '3D-Druck', en: '3D printing' },
  { de: 'GFK / Laminat', en: 'GRP / laminate' },
  { de: 'MDF / Holz', en: 'MDF / wood' },
  { de: 'CNC-Fräsen', en: 'CNC milling' },
  { de: 'Metallbau', en: 'Metalwork' },
  { de: 'Sonstiges', en: 'Other' },
]

/**
 * Übersetzt einen gespeicherten Wert. Unbekannte Werte (aus einer älteren
 * Mappe oder von Hand eingetragen) werden unverändert durchgereicht.
 */
export function optionLabel(list, value) {
  if (!value) return ''
  const found = list.find((entry) => entry.de === value)
  return found ? translateInline(found) : String(value)
}
