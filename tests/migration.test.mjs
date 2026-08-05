import { migrateProject, SCHEMA_VERSION, INSTALL_DEFAULTS } from '../src/data/schema.js'

let fail = 0
const check = (name, cond) => {
  if (!cond) {
    console.log('FAIL:', name)
    fail++
  }
}

// ---------------------------------------------------------------------------
// v5-Fixture: getrennte Listen auf „Hardware-Montage“ und „Strom & Sicherheit“,
// dazu ein Blockdiagramm mit Batterie, Endstufe und Massepunkt.
// ---------------------------------------------------------------------------
const v5 = () => ({
  schemaVersion: 5,
  mode: 'SQMasterclass',
  system: {
    components: [
      { id: 'cmp_bat', type: 'battery', name: 'AGM 80', detail: '', channels: '', oem: false },
      { id: 'cmp_amp', type: 'amp', name: 'Alte Endstufe', detail: '', channels: '4', oem: false },
      { id: 'cmp_gnd', type: 'ground', name: '', detail: '', channels: '', oem: false },
    ],
    signalLinks: [],
    powerLinks: [
      { id: 'lnk_plus', from: 'cmp_bat', to: 'cmp_amp', label: '', section: 25, oem: false, remote: false },
      { id: 'lnk_gnd', from: 'cmp_amp', to: 'cmp_gnd', label: '', section: 25, oem: false, remote: false },
    ],
  },
  power: {
    distributionFuses: [
      { id: 'br_1', label: 'Endstufe Front', section: 10, amps: 60, target: '' },
      // 'target' war ein totes Feld – eine gültige Komponenten-ID wird respektiert.
      { id: 'br_2', label: 'DSP', section: '4', amps: '25', target: 'cmp_amp' },
      { id: 'br_3', label: 'krumm', section: 7, amps: 'abc', target: 'cmp_geloescht' },
    ],
  },
  hardware: {
    amps: [
      {
        id: 'hw_1',
        brand: 'Audison AP8.9 bit',
        channels: '8',
        power: '8 × 85 W',
        location: 'Unter dem Sitz',
        mounting: 'MDF-Platte',
        fuse: '60',
      },
    ],
    dsp: [],
    speakers: [
      {
        id: 'hw_2',
        brand: 'Gladen RS 165',
        position: 'Tür vorne links',
        size: '165 mm',
        mounting: 'MDF-Ring',
        wiring: '2,5',
      },
    ],
    subs: [],
    mountingNotes: 'Alles verschraubt.',
  },
})

const m = migrateProject(v5())

check('schemaVersion wird gestempelt', m.schemaVersion === SCHEMA_VERSION)

// ---- Altdaten-Container sind abgeräumt, Notizen bleiben
check('hardware.amps ist entfernt', !('amps' in m.hardware))
check('hardware.dsp ist entfernt', !('dsp' in m.hardware))
check('hardware.speakers ist entfernt', !('speakers' in m.hardware))
check('hardware.subs ist entfernt', !('subs' in m.hardware))
check('mountingNotes bleibt erhalten', m.hardware.mountingNotes === 'Alles verschraubt.')
check('power.distributionFuses ist entfernt', !('distributionFuses' in m.power))

// ---- Schritt A: Hardware-Einträge werden getrennte Komponenten (keine Heuristik)
const amps = m.system.components.filter((c) => c.type === 'amp')
check('alte + neue Endstufe existieren getrennt', amps.length === 2)
const newAmp = amps.find((c) => c.name === 'Audison AP8.9 bit')
check('Endstufe übernimmt Hersteller/Modell als Name', !!newAmp)
check('Endstufe übernimmt Kanäle', newAmp?.channels === '8')
check('Leistung landet im install-Bag', newAmp?.install.power === '8 × 85 W')
check('Einbauort landet im install-Bag', newAmp?.install.location === 'Unter dem Sitz')
check('Befestigung landet im install-Bag', newAmp?.install.mounting === 'MDF-Platte')

const speaker = m.system.components.find((c) => c.type === 'speaker')
check('Lautsprecher wird Komponente', speaker?.name === 'Gladen RS 165')
check('Position landet im install-Bag', speaker?.install.position === 'Tür vorne links')
check('Kabel (mm²) landet im install-Bag', speaker?.install.wiring === '2,5')

const fuseLink = m.system.powerLinks.find((l) => l.to === newAmp?.id)
check('Sicherungswert der Endstufe wird offener Abgang', fuseLink?.fuseAmps === 60 && fuseLink?.from === '')

// ---- Schritt B: Verteiler-Abgänge werden Links an einem neuen Verteiler
const distributor = m.system.components.find((c) => c.type === 'distributor')
check('Verteiler wird angelegt', !!distributor)
const branches = m.system.powerLinks.filter((l) => l.from === distributor?.id)
check('alle drei Abgänge hängen am Verteiler', branches.length === 3)
const br1 = branches.find((l) => l.label === 'Endstufe Front')
check('Abgang behält Bezeichnung/Querschnitt/Sicherung', br1?.section === 10 && br1?.fuseAmps === 60)
check('Abgang ohne Ziel bleibt offen', br1?.to === '')
const br2 = branches.find((l) => l.label === 'DSP')
check('gültige target-ID wird als Ziel übernommen', br2?.to === 'cmp_amp')
check('String-Werte werden zu Zahlen', br2?.section === 4 && br2?.fuseAmps === 25)
const br3 = branches.find((l) => l.label === 'krumm')
check('unbekannter Querschnitt wird geleert, nicht umgerechnet', br3?.section === null)
check('unbrauchbarer Sicherungswert wird geleert', br3?.fuseAmps === null)
check('gelöschte target-ID bleibt offen', br3?.to === '')

// ---- Schritt C: Polaritäts-Ableitung nur für Links ohne polarity-Feld
const byId = (id) => m.system.powerLinks.find((l) => l.id === id)
check('Batterie-Abgang wird Plus', byId('lnk_plus')?.polarity === 'plus')
check('Verbindung zum Massepunkt wird Minus', byId('lnk_gnd')?.polarity === 'minus')
check('migrierte Abgänge bleiben ohne Polarität', branches.every((l) => l.polarity === null))

// ---- Jede Komponente trägt den vollständigen install-Bag
const installKeys = Object.keys(INSTALL_DEFAULTS)
check(
  'alle Komponenten haben alle install-Felder',
  m.system.components.every((c) => installKeys.every((k) => typeof c.install?.[k] === 'string')),
)

// ---- Idempotenz: ein zweiter Lauf ändert nichts mehr
const roundtrip = JSON.parse(JSON.stringify(m))
const m2 = migrateProject(roundtrip)
check('Doppel-Migration ist stabil', JSON.stringify(m2) === JSON.stringify(m))

// ---- Bewusst geleerte Polarität wird nicht erneut geraten
const cleared = JSON.parse(JSON.stringify(m))
cleared.system.powerLinks.find((l) => l.id === 'lnk_plus').polarity = null
const m3 = migrateProject(cleared)
check(
  'auf „offen“ gesetzte Polarität bleibt offen',
  m3.system.powerLinks.find((l) => l.id === 'lnk_plus').polarity === null,
)

// ---- Frisches/leeres Projekt
const empty = migrateProject(null)
check('leeres Projekt hat keine Komponenten', empty.system.components.length === 0)
check('leeres Projekt hat keinen Verteiler', !empty.system.components.some((c) => c.type === 'distributor'))
check('leeres Projekt: hardware nur Notizen', JSON.stringify(empty.hardware) === '{"mountingNotes":""}')
check('leeres Projekt: keine distributionFuses', !('distributionFuses' in empty.power))
check('leeres Projekt: aktuelle Schema-Version', empty.schemaVersion === SCHEMA_VERSION)

console.log(fail === 0 ? '\nMigration: alle Checks bestanden.' : `\n${fail} Check(s) fehlgeschlagen.`)
process.exit(fail ? 1 : 0)
