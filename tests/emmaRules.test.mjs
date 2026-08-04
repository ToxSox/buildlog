import { FUSE_LIMITS, maxAmpsFor, minSectionFor, evaluateRules } from '../src/data/emmaRules.js'
import { createEmptyProject } from '../src/data/schema.js'

// Offizielle Fuse Size Matrix, abgetippt aus dem Rulebook 2026 (Seite 25/28)
const OFFICIAL = [
  [0.5, 'AWG 20', 10],
  [1.0, 'AWG 17', 15],
  [1.5, 'AWG 15', 20],
  [2.5, 'AWG 13', 20],
  [4.0, 'AWG 11', 30],
  [6.0, 'AWG 9', 50],
  [10, 'AWG 7', 60],
  [16, 'AWG 5', 100],
  [25, 'AWG 4', 125],
  [35, 'AWG 2', 175],
  [50, 'AWG 0', 250],
  [70, 'AWG 2/0', 300],
]

let fail = 0
const check = (name, cond) => {
  if (!cond) {
    console.log('FAIL:', name)
    fail++
  }
}

check('Matrix hat 12 Zeilen', FUSE_LIMITS.length === OFFICIAL.length)
OFFICIAL.forEach(([mm2, awg, amps]) => {
  const e = FUSE_LIMITS.find((x) => x.mm2 === mm2)
  check(`${mm2}mm² vorhanden`, !!e)
  check(`${mm2}mm² -> ${amps}A`, e && e.maxAmps === amps)
  check(`${mm2}mm² -> ${awg}`, e && e.awg === awg)
  check(`maxAmpsFor(${mm2})`, maxAmpsFor(mm2) === amps)
})

check('minSectionFor(250) == 50', minSectionFor(250) === 50)
check('minSectionFor(300) == 70', minSectionFor(300) === 70)
check('minSectionFor(400) == null', minSectionFor(400) === null)
check('maxAmpsFor(20) faellt auf 16mm² zurueck', maxAmpsFor(20) === 100)

const ids = (f) => f.map((x) => x.id)

// Fall 1: 50mm² / 300A -> zu gross (Matrix erlaubt 250A)
let p = createEmptyProject()
p.power.mainCableSection = 50
p.power.mainFuseAmps = 300
p.power.mainFuseDistanceCm = 30
p.power.fuseBeforeMetalPanel = true
p.power.oemGroundUpgraded = true
let f = evaluateRules(p)
check('50mm²/300A wird als Fehler erkannt', ids(f).includes('fuse.oversized'))

// Fall 2: 50mm² / 250A -> exakt zulaessig
p.power.mainFuseAmps = 250
f = evaluateRules(p)
check('50mm²/250A ist ok', ids(f).includes('fuse.ok') && !ids(f).includes('fuse.oversized'))

// Fall 3: 10mm² / 80A -> nach alter Tabelle ok, nach offizieller Matrix zu gross
p.power.mainCableSection = 10
p.power.mainFuseAmps = 80
f = evaluateRules(p)
check('10mm²/80A wird jetzt beanstandet', ids(f).includes('fuse.oversized'))

// Fall 4: OEM-Masse nicht verstaerkt + 150A -> 100A-Deckel greift
p = createEmptyProject()
p.power.mainCableSection = 35
p.power.mainFuseAmps = 150
p.power.mainFuseDistanceCm = 20
p.power.fuseBeforeMetalPanel = true
f = evaluateRules(p)
check('100A-Deckel greift bei OEM-Masse', ids(f).includes('ground.oemCap'))
check('Sicherungswert selbst ist ok (35mm² -> 175A)', !ids(f).includes('fuse.oversized'))

p.power.oemGroundUpgraded = true
f = evaluateRules(p)
check('Deckel entfaellt bei verstaerkter Masse', !ids(f).includes('ground.oemCap'))

p.power.oemGroundUpgraded = false
p.power.groundCalculationProvided = true
f = evaluateRules(p)
check('Deckel entfaellt bei beigelegter Berechnung', !ids(f).includes('ground.oemCap'))

// Fall 5: Blechdurchfuehrung
p = createEmptyProject()
p.power.fuseBeforeMetalPanel = false
f = evaluateRules(p)
check('Sicherung hinter Blech = Fehler', ids(f).includes('fuse.metalPanel'))
p.power.fuseBeforeMetalPanel = null
f = evaluateRules(p)
check('unbeantwortet = Warnung', ids(f).includes('fuse.metalPanel.missing'))

// Fall 6: Quellenkennzeichnung
p = createEmptyProject()
p.power.mainCableSection = 50
p.power.groundCableSection = 25
p.power.mainFuseAmps = 100
f = evaluateRules(p)
const gs = f.find((x) => x.id === 'ground.section')
check('Masse-Querschnitt ist als Praxis markiert', gs && gs.source === 'praxis' && gs.severity === 'info')
check(
  'alle Befunde haben eine Quelle',
  f.every((x) => x.source === 'rulebook' || x.source === 'praxis'),
)

console.log(fail === 0 ? `\nAlle Checks bestanden.` : `\n${fail} Check(s) fehlgeschlagen.`)
process.exit(fail ? 1 : 0)
