const ALL = ['E', 'S', 'M', 'X', 'XUNL']
const FROM_M = ['M', 'X', 'XUNL']
const X_ONLY = ['X', 'XUNL']

/**
 * Reihenfolge des Assistenten. `columns` steuert, in welchen EMMA-Kategorien
 * der Schritt überhaupt auftaucht – solange keine Kategorie gewählt ist, werden
 * alle Schritte gezeigt, damit nichts unsichtbar verloren geht.
 */
export const STEPS = [
  {
    key: 'vehicle',
    path: '/wizard/fahrzeug',
    label: 'Fahrzeug & Klasse',
    short: 'Fahrzeug',
    icon: '🚗',
    columns: ALL,
  },
  {
    key: 'diagram',
    path: '/wizard/diagramme',
    label: 'Blockdiagramme',
    short: 'Diagramme',
    icon: '🧩',
    columns: ALL,
  },
  {
    key: 'power',
    path: '/wizard/strom',
    label: 'Strom & Sicherheit',
    short: 'Strom',
    icon: '⚡',
    columns: ALL,
  },
  {
    key: 'hardware',
    path: '/wizard/hardware',
    label: 'Hardware-Montage',
    short: 'Hardware',
    icon: '🔩',
    columns: ALL,
  },
  {
    key: 'craft',
    path: '/wizard/handwerk',
    label: 'Handwerk & Akustik',
    short: 'Handwerk',
    icon: '🎨',
    columns: FROM_M,
  },
  {
    key: 'presentation',
    path: '/wizard/praesentation',
    label: 'Erklärung an die Richter',
    short: 'Vortrag',
    icon: '🎤',
    columns: FROM_M,
  },
  {
    key: 'matrix',
    path: '/wizard/punkte',
    label: 'Punkte-Check',
    short: 'Punkte',
    icon: '🎯',
    columns: ALL,
  },
  {
    key: 'review',
    path: '/wizard/pruefen',
    label: 'Prüfen & Export',
    short: 'Export',
    icon: '📄',
    columns: ALL,
  },
]

/** Schritte, die in dieser Kategorie relevant sind. */
export function stepsForColumn(column) {
  if (!column) return STEPS
  return STEPS.filter((s) => s.columns.includes(column))
}

export function neighbours(column, currentKey) {
  const list = stepsForColumn(column)
  const idx = list.findIndex((s) => s.key === currentKey)
  return {
    index: idx,
    total: list.length,
    prev: idx > 0 ? list[idx - 1] : null,
    next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
  }
}

export { X_ONLY }
