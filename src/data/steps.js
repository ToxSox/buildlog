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
    labelKey: 'steps.vehicle',
    shortKey: 'steps.vehicleShort',
    icon: '🚗',
    columns: ALL,
  },
  {
    key: 'diagram',
    path: '/wizard/diagramme',
    labelKey: 'steps.diagram',
    shortKey: 'steps.diagramShort',
    icon: '🧩',
    columns: ALL,
  },
  {
    key: 'power',
    path: '/wizard/strom',
    labelKey: 'steps.power',
    shortKey: 'steps.powerShort',
    icon: '⚡',
    columns: ALL,
  },
  {
    key: 'hardware',
    path: '/wizard/hardware',
    labelKey: 'steps.hardware',
    shortKey: 'steps.hardwareShort',
    icon: '🔩',
    columns: ALL,
  },
  {
    key: 'craft',
    path: '/wizard/handwerk',
    labelKey: 'steps.craft',
    shortKey: 'steps.craftShort',
    icon: '🎨',
    columns: FROM_M,
  },
  {
    key: 'presentation',
    path: '/wizard/praesentation',
    labelKey: 'steps.presentation',
    shortKey: 'steps.presentationShort',
    icon: '🎤',
    columns: FROM_M,
  },
  {
    key: 'matrix',
    path: '/wizard/punkte',
    labelKey: 'steps.matrix',
    shortKey: 'steps.matrixShort',
    icon: '🎯',
    columns: ALL,
  },
  {
    key: 'review',
    path: '/wizard/pruefen',
    labelKey: 'steps.review',
    shortKey: 'steps.reviewShort',
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
