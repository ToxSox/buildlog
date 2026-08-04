/**
 * Zentrale Datenstruktur der Mappe.
 *
 * Alles, was hier definiert ist, wird 1:1 als JSON in die IndexedDB gespeichert
 * (Autosave) und beim Projekt-Export in die ZIP-Datei geschrieben.
 * Bilder liegen NICHT in dieser Struktur, sondern als Blob im Media-Store –
 * hier steht nur die Metadaten-Referenz (id, caption, width, height, ...).
 */

export const SCHEMA_VERSION = 5

export const MODES = {
  QUICK: 'QuickRescue',
  MASTER: 'SQMasterclass',
}

/**
 * Kategorien laut EMMA competition manual, edition 2026, Kapitel 2
 * („EMMA Categories & Classes overview“).
 *
 * Welche Bewertungskriterien und Maximalpunkte je Kategorie gelten, steht in
 * `matrix.js` – das ist die einzige Quelle der Wahrheit dafür.
 */
export const EMMA_CLASSES = [
  { id: 'esql-inside', label: 'ESQL Inside (Einsteiger)', group: 'Einstieg' },
  { id: 'sq-e', label: 'SQ E – Entry', group: 'Sound Quality' },
  { id: 'sq-s', label: 'SQ S – Skilled', group: 'Sound Quality' },
  { id: 'sq-m', label: 'SQ M – Master', group: 'Sound Quality' },
  { id: 'sq-x-limited', label: 'SQ X – Expert Limited', group: 'Sound Quality' },
  { id: 'sq-x-unlimited', label: 'SQ X – Expert Unlimited', group: 'Sound Quality' },
  { id: 'mm', label: 'MM – Multimedia', group: 'Multimedia' },
  { id: 'espl-trunk', label: 'ESPL Trunk', group: 'ESPL' },
  { id: 'espl-br', label: 'ESPL B / R', group: 'ESPL' },
  { id: 'espl-wall', label: 'ESPL Wall', group: 'ESPL' },
  { id: 'espl-expert', label: 'ESPL Expert', group: 'ESPL' },
  { id: 'esql-limited', label: 'ESQL Limited', group: 'ESQL' },
  { id: 'esql-unlimited', label: 'ESQL Unlimited', group: 'ESQL' },
  { id: 'tuning-stock', label: 'Tuning Stock', group: 'EMMA Tuning' },
  { id: 'tuning-custom-trunk', label: 'Tuning Custom Trunk', group: 'EMMA Tuning' },
  { id: 'tuning-custom-unlimited', label: 'Tuning Custom Unlimited', group: 'EMMA Tuning' },
]

export const COMPONENT_TYPES = [
  { id: 'source', label: 'Signalquelle / Headunit', icon: '🎛️' },
  { id: 'dsp', label: 'DSP / Prozessor', icon: '🧠' },
  { id: 'amp', label: 'Endstufe', icon: '⚡' },
  { id: 'speaker', label: 'Lautsprecher', icon: '🔊' },
  { id: 'sub', label: 'Subwoofer', icon: '🥁' },
  { id: 'battery', label: 'Batterie / Stromquelle', icon: '🔋' },
  { id: 'fuse', label: 'Sicherung / Verteiler', icon: '🛡️' },
]

/**
 * Querschnitte exakt nach der Fuse Size Matrix des Rulebooks 2026.
 * Andere Querschnitte sind zwar verbaubar, das Regelwerk verlangt dann aber eine
 * eigene Berechnung nach der Formel aus dem Judge Book.
 */
export const CABLE_SECTIONS = [0.5, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70]

export function uid(prefix = 'id') {
  const rnd = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}_${rnd}`
}

export function createEmptyProject() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    /** null = noch keine Auswahl getroffen (Startbildschirm) */
    mode: null,

    meta: {
      participantName: '',
      teamName: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
      plate: '',
      emmaClass: '',
      eventName: '',
      installerName: '',
      notes: '',
    },

    /** Systemaufbau – Basis für die automatisch generierten Blockdiagramme. */
    system: {
      components: [],
      signalLinks: [],
      powerLinks: [],
    },

    power: {
      batteryLocation: '',
      batteryType: '',
      batterySecured: '',
      mainFuseAmps: null,
      mainFuseType: '',
      mainFuseDistanceCm: null,
      /** true / false / null – Sicherung vor jeder Blechdurchführung? */
      fuseBeforeMetalPanel: null,
      mainCableSection: null,
      /** OEM-Masseleitung des Fahrzeugs verstärkt? (100-A-Deckel des Rulebooks) */
      oemGroundUpgraded: false,
      /** Berechnung nach Judge-Book-Formel liegt bei? */
      groundCalculationProvided: false,
      groundCableSection: null,
      groundLengthCm: null,
      groundPoint: '',
      secondBattery: false,
      secondBatteryFuseAmps: null,
      secondBatteryDistanceCm: null,
      chargingCableSection: null,
      distributionFuses: [],
      cableProtection: [],
    },

    hardware: {
      amps: [],
      speakers: [],
      subs: [],
      dsp: [],
      mountingNotes: '',
    },

    craft: {
      dampingDoors: '',
      dampingFloor: '',
      dampingTrunk: '',
      customParts: [],
      measurements: [],
      tuningNotes: '',
    },

    /**
     * Selbsteinschätzung je Matrix-Kriterium:
     * assessment['cleanliness'] = { state: 'yes'|'partly'|'no'|null, note: '' }
     */
    assessment: {},

    /** Bonus-Point-Anträge (X / X Unlimited), max. 50 laut Regelwerk. */
    bonusRequests: [],

    /** Vorbereitung der 7-Minuten-Erklärung an die Richter. */
    presentation: {
      goal: '',
      story: '',
      challenge: '',
      highlights: [],
    },

    /**
     * Medien-Referenzen pro Slot:
     * media['power.mainFuse'] = [{ id, caption, width, height, mime, name }]
     */
    media: {},

    /** Slots, die der Nutzer bewusst übersprungen hat (für Warnungen/Score). */
    skipped: [],
  }
}

/**
 * Klassen-IDs vor Schema 4 stammten aus einer nicht verifizierten Liste.
 * Best-effort-Zuordnung auf die echten Kategorien des Rulebooks 2026.
 */
const LEGACY_CLASS_MAP = {
  rookie: 'sq-e',
  crazy: 'sq-s',
  master: 'sq-m',
  expert: 'sq-x-limited',
  esql: 'esql-limited',
  multimedia: 'mm',
  tuning: 'tuning-stock',
  spl: 'espl-trunk',
}

/**
 * Querschnitte, die es in der offiziellen Fuse Size Matrix nicht gibt, werden
 * bewusst geleert statt stillschweigend umgerechnet – ein falsch übernommener
 * Sicherheitswert wäre gefährlicher als eine erneute Eingabe.
 */
function sanitizeSection(value) {
  if (value === null || value === undefined || value === '') return null
  return CABLE_SECTIONS.includes(Number(value)) ? Number(value) : null
}

/** Migriert ältere Projektstände auf das aktuelle Schema. */
export function migrateProject(raw) {
  const base = createEmptyProject()
  if (!raw || typeof raw !== 'object') return base

  const merged = {
    ...base,
    ...raw,
    meta: { ...base.meta, ...(raw.meta || {}) },
    system: { ...base.system, ...(raw.system || {}) },
    power: { ...base.power, ...(raw.power || {}) },
    hardware: { ...base.hardware, ...(raw.hardware || {}) },
    craft: { ...base.craft, ...(raw.craft || {}) },
    assessment: { ...(raw.assessment || {}) },
    bonusRequests: Array.isArray(raw.bonusRequests) ? raw.bonusRequests : [],
    presentation: { ...base.presentation, ...(raw.presentation || {}) },
    media: { ...(raw.media || {}) },
    skipped: Array.isArray(raw.skipped) ? raw.skipped : [],
  }

  if (LEGACY_CLASS_MAP[merged.meta.emmaClass]) {
    merged.meta.emmaClass = LEGACY_CLASS_MAP[merged.meta.emmaClass]
  } else if (merged.meta.emmaClass && !EMMA_CLASSES.some((c) => c.id === merged.meta.emmaClass)) {
    merged.meta.emmaClass = ''
  }

  merged.power.mainCableSection = sanitizeSection(merged.power.mainCableSection)
  merged.power.groundCableSection = sanitizeSection(merged.power.groundCableSection)
  merged.power.chargingCableSection = sanitizeSection(merged.power.chargingCableSection)
  merged.power.distributionFuses = (merged.power.distributionFuses || []).map((b) => ({
    ...b,
    section: sanitizeSection(b.section),
  }))

  // 'rotation' wurde durch physisches Drehen abgelöst und wird nicht mehr geführt.
  Object.values(merged.media).forEach((list) =>
    (list || []).forEach((item) => {
      delete item.rotation
    }),
  )

  merged.schemaVersion = SCHEMA_VERSION
  return merged
}
