/**
 * Zentrale Datenstruktur der Mappe.
 *
 * Alles, was hier definiert ist, wird 1:1 als JSON in die IndexedDB gespeichert
 * (Autosave) und beim Projekt-Export in die ZIP-Datei geschrieben.
 * Bilder liegen NICHT in dieser Struktur, sondern als Blob im Media-Store –
 * hier steht nur die Metadaten-Referenz (id, caption, rotation, ...).
 */

export const SCHEMA_VERSION = 3

export const MODES = {
  QUICK: 'QuickRescue',
  MASTER: 'SQMasterclass',
}

/** Frei erweiterbare Liste der EMMA-Klassen (Stand Rulebook 2024/2025). */
export const EMMA_CLASSES = [
  { id: 'rookie', label: 'Rookie', group: 'Sound Quality' },
  { id: 'crazy', label: 'Crazy', group: 'Sound Quality' },
  { id: 'expert', label: 'Expert', group: 'Sound Quality' },
  { id: 'master', label: 'Master', group: 'Sound Quality' },
  { id: 'esql', label: 'ESQL / Esoteric', group: 'Sound Quality' },
  { id: 'multimedia', label: 'Multimedia', group: 'Multimedia' },
  { id: 'tuning', label: 'Car Tuning / Show', group: 'Show' },
  { id: 'spl', label: 'SPL', group: 'SPL' },
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

/** Gängige Kupfer-Querschnitte in mm². */
export const CABLE_SECTIONS = [2.5, 4, 6, 10, 16, 20, 25, 35, 50, 70, 95, 120]

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
      mainCableSection: null,
      groundCableSection: null,
      groundLengthCm: null,
      groundPoint: '',
      secondBattery: false,
      secondBatteryFuseAmps: null,
      secondBatteryDistanceCm: null,
      chargingCableSection: null,
      distributionFuses: [],
      cableProtection: [],
      remoteFuseAmps: null,
      totalAmpFuseAmps: null,
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
     * Medien-Referenzen pro Slot:
     * media['power.mainFuse'] = [{ id, caption, rotation, width, height, mime, name }]
     */
    media: {},

    /** Slots, die der Nutzer bewusst übersprungen hat (für Warnungen/Score). */
    skipped: [],
  }
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
    media: { ...(raw.media || {}) },
    skipped: Array.isArray(raw.skipped) ? raw.skipped : [],
  }
  merged.schemaVersion = SCHEMA_VERSION
  return merged
}
