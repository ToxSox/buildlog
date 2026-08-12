/**
 * Zentrale Datenstruktur der Mappe.
 *
 * Alles, was hier definiert ist, wird 1:1 als JSON in die IndexedDB gespeichert
 * (Autosave) und beim Projekt-Export in die ZIP-Datei geschrieben.
 * Bilder liegen NICHT in dieser Struktur, sondern als Blob im Media-Store –
 * hier steht nur die Metadaten-Referenz (id, caption, width, height, ...).
 */

import { toNumber } from './emmaRules.js'

export const SCHEMA_VERSION = 6

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

/**
 * Bekannte Unterklassen (Budget-/OEM-Varianten) je Kategorie – Schnellauswahl
 * bei der Fahrzeugeingabe. Die Liste stammt aus Teilnehmer-Feedback; die
 * Eingabe bleibt bewusst Freitext, damit jede Variante der jeweils gültigen
 * Edition eintragbar ist. Bei einer neuen Edition gegen Kapitel 2 abgleichen.
 */
export const EMMA_SUBCLASSES = {
  'sq-s': ['Skilled 4000', 'Skilled Unlimited'],
  'sq-m': ['Master Limited', 'Master 8000', 'Master Unlimited', 'Master OEM 4000', 'Master OEM Unlimited'],
}

export const COMPONENT_TYPES = [
  { id: 'source', label: { de: 'Signalquelle / Headunit', en: 'Source / head unit' }, icon: '🎛️' },
  { id: 'dsp', label: { de: 'DSP / Prozessor', en: 'DSP / processor' }, icon: '🧠' },
  { id: 'amp', label: { de: 'Endstufe', en: 'Amplifier' }, icon: '⚡' },
  { id: 'speaker', label: { de: 'Lautsprecher', en: 'Speaker' }, icon: '🔊' },
  { id: 'sub', label: { de: 'Subwoofer', en: 'Subwoofer' }, icon: '🥁' },
  { id: 'battery', label: { de: 'Batterie / Stromquelle', en: 'Battery / power source' }, icon: '🔋' },
  {
    id: 'distributor',
    label: { de: 'Verteiler / Sicherungsblock', en: 'Distributor / fuse block' },
    icon: '🔌',
  },
  { id: 'fuse', label: { de: 'Sicherung (inline)', en: 'Fuse (inline)' }, icon: '🛡️' },
  { id: 'ground', label: { de: 'Massepunkt (Karosserie)', en: 'Ground point (chassis)' }, icon: '🔩' },
]

/**
 * Auswahlliste der Querschnitte. Sie deckt die Fuse Size Matrix des Rulebooks
 * 2026 vollständig ab und enthält zusätzlich handelsübliche Größen, die dort
 * nicht gelistet sind (20 mm²). Für die verlangt das Regelwerk eine eigene
 * Berechnung nach der Formel aus dem Judge Book – die Regelprüfung weist
 * darauf hin und rechnet bis dahin mit dem nächstkleineren gelisteten Wert.
 * Maßgeblich für die Absicherung bleibt allein FUSE_LIMITS in emmaRules.js.
 */
export const CABLE_SECTIONS = [0.5, 1, 1.5, 2.5, 4, 6, 10, 16, 20, 25, 35, 50, 70]

/**
 * Montage-Details je Komponente – gepflegt auf „Hardware-Montage“, gespeichert
 * an der zentralen Komponente aus dem Blockdiagramm. Welche Felder eine Seite
 * anzeigt, entscheidet der Komponententyp; hier liegen alle mit Leer-Default.
 */
export const INSTALL_DEFAULTS = {
  location: '',
  mounting: '',
  power: '',
  input: '',
  position: '',
  size: '',
  wiring: '',
  enclosure: '',
  volume: '',
  securing: '',
}

/** Kennzeichnung einer Stromverbindung: Plus- oder Masseleitung. */
export const POLARITIES = ['plus', 'minus']

function sanitizePolarity(value) {
  return POLARITIES.includes(value) ? value : null
}

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
      /** Unterklasse der Kategorie (z. B. „Master OEM Unlimited“) – Freitext. */
      emmaSubclass: '',
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
      cableProtection: [],
    },

    /**
     * Seit Schema 6 nur noch Notizen: Die Komponenten selbst leben zentral in
     * system.components, Montage-Details im install-Bag jeder Komponente.
     */
    hardware: {
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

    /** Vorbereitung der 7-Minuten-Erklärung an die Juroren. */
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

    /**
     * Druck-Einstellungen der Mappe. Wandern bewusst mit dem ZIP-Export mit:
     * Wer am Handy fotografiert und am PC druckt, bekommt dasselbe Layout.
     */
    print: {
      /** 1 oder 2 – mehr Bilder pro Blatt lehnen Juroren als zu klein ab. */
      photosPerPage: 2,
    },

    /** Slots, die der Nutzer bewusst übersprungen hat (für Warnungen/Score). */
    skipped: [],

    /**
     * Slots, deren Motiv sichtbar verbaut ist: Der Juror prüft direkt am
     * Fahrzeug, ein Foto ist laut Regelwerk nur für Verdecktes Pflicht.
     */
    visibleNoPhoto: [],
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
const NUMERIC_POWER_FIELDS = [
  'mainFuseAmps',
  'mainFuseDistanceCm',
  'groundLengthCm',
  'secondBatteryFuseAmps',
  'secondBatteryDistanceCm',
]

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
    print: { ...base.print, ...(raw.print || {}) },
    media: { ...(raw.media || {}) },
    skipped: Array.isArray(raw.skipped) ? raw.skipped : [],
    visibleNoPhoto: Array.isArray(raw.visibleNoPhoto) ? raw.visibleNoPhoto : [],
  }

  if (LEGACY_CLASS_MAP[merged.meta.emmaClass]) {
    merged.meta.emmaClass = LEGACY_CLASS_MAP[merged.meta.emmaClass]
  } else if (merged.meta.emmaClass && !EMMA_CLASSES.some((c) => c.id === merged.meta.emmaClass)) {
    merged.meta.emmaClass = ''
    // Ohne Kategorie ergibt die Unterklasse keinen Sinn mehr.
    merged.meta.emmaSubclass = ''
  }

  // Nur 1 oder 2 sind zulässig – alles andere (Altstände, manipulierte ZIPs)
  // fällt auf den Standard zurück.
  merged.print.photosPerPage = merged.print.photosPerPage === 1 ? 1 : 2

  merged.power.mainCableSection = sanitizeSection(merged.power.mainCableSection)
  merged.power.groundCableSection = sanitizeSection(merged.power.groundCableSection)
  merged.power.chargingCableSection = sanitizeSection(merged.power.chargingCableSection)

  // Ein geleertes Formularfeld hinterlässt einen leeren String. Der soll weder
  // in der gespeicherten Mappe noch im ZIP-Export stehen.
  for (const key of NUMERIC_POWER_FIELDS) merged.power[key] = toNumber(merged.power[key])

  // Vor Schema 6 kannten Stromverbindungen keine Polarität. Nur für solche
  // Links wird sie unten aus den Endpunkten abgeleitet – eine später bewusst
  // auf „offen“ zurückgesetzte Polarität bleibt offen.
  const linksNeedingPolarity = new Set(
    (merged.system.powerLinks || []).filter((l) => !('polarity' in l)).map((l) => l.id),
  )

  merged.system.components = (merged.system.components || []).map((c) => ({
    ...c,
    oem: Boolean(c.oem),
    install: { ...INSTALL_DEFAULTS, ...(c.install || {}) },
  }))
  merged.system.signalLinks = (merged.system.signalLinks || []).map((link) => ({
    ...link,
    remote: Boolean(link.remote),
  }))
  merged.system.powerLinks = (merged.system.powerLinks || []).map((link) => ({
    ...link,
    section: sanitizeSection(link.section),
    fuseAmps: toNumber(link.fuseAmps),
    polarity: sanitizePolarity(link.polarity),
    oem: Boolean(link.oem),
  }))

  // ------------------------------------------------------------ Schema 5 → 6
  // „Hardware-Montage“ und „Strom & Sicherheit“ pflegten eigene Listen. Sie
  // werden einmalig in zentrale Komponenten bzw. Verbindungen überführt –
  // bewusst getrennt, ohne Zusammenführungs-Heuristik: nichts wird gelöscht
  // oder geraten, Duplikate räumt der Nutzer auf. Erneute Läufe finden keine
  // Altdaten mehr vor (idempotent).
  const legacyHardware = { amps: 'amp', dsp: 'dsp', speakers: 'speaker', subs: 'sub' }
  for (const [listKey, type] of Object.entries(legacyHardware)) {
    for (const entry of merged.hardware[listKey] || []) {
      const component = {
        id: uid('cmp'),
        type,
        name: entry.brand || '',
        detail: '',
        channels: entry.channels || '',
        oem: false,
        install: {
          ...INSTALL_DEFAULTS,
          location: entry.location || '',
          mounting: entry.mounting || '',
          power: entry.power || '',
          input: entry.input || '',
          position: entry.position || '',
          size: entry.size || '',
          wiring: entry.wiring || '',
          enclosure: entry.enclosure || '',
          volume: entry.volume || '',
          securing: entry.securing || '',
        },
      }
      merged.system.components.push(component)
      const fuse = toNumber(entry.fuse)
      if (fuse !== null) {
        // Die Absicherung lebt jetzt an der Stromverbindung. Ohne bekannte
        // Quelle bleibt der Abgang offen und wartet auf manuelle Zuordnung.
        merged.system.powerLinks.push({
          id: uid('lnk'),
          from: '',
          to: component.id,
          label: '',
          section: null,
          fuseAmps: fuse,
          polarity: null,
          oem: false,
          remote: false,
        })
      }
    }
    delete merged.hardware[listKey]
  }

  const legacyBranches = merged.power.distributionFuses || []
  if (legacyBranches.length) {
    let source = merged.system.components.find((c) => c.type === 'distributor')
    if (!source) {
      // Leerer Name rendert überall als übersetztes Typ-Label.
      source = {
        id: uid('cmp'),
        type: 'distributor',
        name: '',
        detail: '',
        channels: '',
        oem: false,
        install: { ...INSTALL_DEFAULTS },
      }
      merged.system.components.push(source)
    }
    const knownIds = new Set(merged.system.components.map((c) => c.id))
    for (const branch of legacyBranches) {
      merged.system.powerLinks.push({
        id: uid('lnk'),
        from: source.id,
        // 'target' war ein totes Feld – eine gültige ID darin ist aber eine
        // explizite Referenz und wird respektiert, alles andere bleibt offen.
        to: knownIds.has(branch.target) ? branch.target : '',
        label: branch.label || '',
        section: sanitizeSection(branch.section),
        fuseAmps: toNumber(branch.amps),
        polarity: null,
        oem: false,
        remote: false,
      })
    }
  }
  delete merged.power.distributionFuses

  if (linksNeedingPolarity.size) {
    const typeById = new Map(merged.system.components.map((c) => [c.id, c.type]))
    merged.system.powerLinks = merged.system.powerLinks.map((link) => {
      if (!linksNeedingPolarity.has(link.id) || link.polarity) return link
      if (typeById.get(link.from) === 'ground' || typeById.get(link.to) === 'ground') {
        return { ...link, polarity: 'minus' }
      }
      if (typeById.get(link.from) === 'battery') return { ...link, polarity: 'plus' }
      return link
    })
  }

  // 'rotation' wurde durch physisches Drehen abgelöst und wird nicht mehr geführt.
  Object.values(merged.media).forEach((list) =>
    (list || []).forEach((item) => {
      delete item.rotation
    }),
  )

  merged.schemaVersion = SCHEMA_VERSION
  return merged
}
