import { MODES } from './schema.js'

/**
 * Reihenfolge des Assistenten. `modes` steuert, in welchem Pfad der Schritt
 * überhaupt auftaucht (Quick Rescue blendet Optik-/Klang-Schritte aus).
 */
export const STEPS = [
  {
    key: 'vehicle',
    path: '/wizard/fahrzeug',
    label: 'Fahrzeug & Klasse',
    short: 'Fahrzeug',
    icon: '🚗',
    modes: [MODES.QUICK, MODES.MASTER],
  },
  {
    key: 'diagram',
    path: '/wizard/diagramme',
    label: 'Blockdiagramme',
    short: 'Diagramme',
    icon: '🧩',
    modes: [MODES.QUICK, MODES.MASTER],
  },
  {
    key: 'power',
    path: '/wizard/strom',
    label: 'Strom & Sicherheit',
    short: 'Strom',
    icon: '⚡',
    modes: [MODES.QUICK, MODES.MASTER],
  },
  {
    key: 'hardware',
    path: '/wizard/hardware',
    label: 'Hardware-Montage',
    short: 'Hardware',
    icon: '🔩',
    modes: [MODES.QUICK, MODES.MASTER],
  },
  {
    key: 'craft',
    path: '/wizard/handwerk',
    label: 'Handwerk & Akustik',
    short: 'Handwerk',
    icon: '🎨',
    modes: [MODES.MASTER],
  },
  {
    key: 'review',
    path: '/wizard/pruefen',
    label: 'Prüfen & Export',
    short: 'Export',
    icon: '📄',
    modes: [MODES.QUICK, MODES.MASTER],
  },
]

export function stepsForMode(mode) {
  return STEPS.filter((s) => !mode || s.modes.includes(mode))
}

export function neighbours(mode, currentKey) {
  const list = stepsForMode(mode)
  const idx = list.findIndex((s) => s.key === currentKey)
  return {
    index: idx,
    total: list.length,
    prev: idx > 0 ? list[idx - 1] : null,
    next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
  }
}
