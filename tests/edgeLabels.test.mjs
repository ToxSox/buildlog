import { overlapArea, chooseLabelSpot } from '../src/utils/edgeLabels.js'

let fail = 0
const check = (name, cond, detail = '') => {
  if (!cond) {
    console.log('FAIL:', name, detail)
    fail++
  }
}

// ------------------------------------------------------------ Überlappung
const box = (x, y, w, h) => ({ x, y, w, h })
check('getrennte Kaesten ueberlappen nicht', overlapArea(box(0, 0, 10, 10), box(20, 0, 10, 10)) === 0)
check('Beruehrung zaehlt nicht als Ueberlappung', overlapArea(box(0, 0, 10, 10), box(10, 0, 10, 10)) === 0)
check('Schnittflaeche wird berechnet', overlapArea(box(0, 0, 10, 10), box(5, 5, 10, 10)) === 25)
check(
  'vollstaendig enthalten ergibt die kleine Flaeche',
  overlapArea(box(0, 0, 10, 10), box(2, 2, 4, 4)) === 16,
)

// ---------------------------------------------------------------- Auswahl
// Eine waagerechte Linie mit elf Stuetzstellen; die Beschriftung sitzt in der
// Mitte und wird dort von einem Kasten verdeckt – so lag im Stromlaufplan der
// Querschnitt zum Monoblock unter dem Pac-Audio-Modul.
const line = Array.from({ length: 11 }, (_, i) => ({ x: i * 10, y: 0 }))
const size = { w: 8, h: 6 }
const blocker = box(40, -20, 20, 40)

// Frei bleiben damit nur die Stuetzstellen bis x=30 und ab x=70.
const dodged = chooseLabelSpot(line, size, { nodes: [blocker], from: 5 })
check(
  'verdeckte Beschriftung weicht aus',
  overlapArea(dodged.box, blocker) === 0,
  JSON.stringify(dodged.spot),
)
check(
  'sie bleibt auf der eigenen Linie',
  line.some((p) => p.x === dodged.spot.x && p.y === dodged.spot.y),
)

// Ohne Hindernis darf sich nichts bewegen: Ein sauberes Diagramm soll durch
// den Durchlauf unveraendert bleiben.
const kept = chooseLabelSpot(line, size, { nodes: [box(200, 200, 10, 10)], from: 5 })
check('freie Beschriftung bleibt stehen', kept.index === 5)

// Auf beiden Seiten ist Platz – die naeher gelegene Stelle gewinnt.
check('Ausweichen nach links', chooseLabelSpot(line, size, { nodes: [blocker], from: 4 }).index === 3)
check('Ausweichen nach rechts', chooseLabelSpot(line, size, { nodes: [blocker], from: 6 }).index === 7)

// Bereits gesetzte Beschriftungen werden gemieden.
const shared = chooseLabelSpot(line, size, {
  nodes: [blocker],
  placed: [box(64, -3, 20, 6)],
  from: 6,
})
check('fremde Beschriftung wird gemieden', shared.index === 3, `Index ${shared.index}`)

// Eine kreuzende Leitung unter dem Text wuerde die Angabe der falschen Linie
// zuordnen – das wiegt schwerer als der laengere Weg zur anderen Seite.
const crossed = chooseLabelSpot(line, size, {
  nodes: [blocker],
  crossings: [
    [
      { x: 70, y: -4 },
      { x: 70, y: 0 },
      { x: 70, y: 4 },
    ],
  ],
  from: 6,
})
check('Kreuzung wird gemieden', crossed.spot.x !== 70, `x=${crossed.spot.x}`)
check(
  'die Ausweichstelle liegt frei',
  overlapArea(crossed.box, blocker) === 0 && crossed.box.x > 74,
  JSON.stringify(crossed.box),
)

// Der Rand des Diagramms ist eine harte Grenze: was darueber hinaussteht,
// fehlt im Ausdruck. Frei von Knoten waeren hier x=90 und x=100, aber nur
// x=90 passt noch ganz ins Blatt.
const inside = chooseLabelSpot(line, size, {
  nodes: [box(-5, -20, 85, 40)],
  bounds: box(-4, -20, 98, 40),
  from: 5,
})
check('abgeschnittene Stellen werden gemieden', inside.spot.x === 90, `x=${inside.spot.x}`)

console.log(
  fail === 0 ? 'Kantenbeschriftungen: alle Checks bestanden.' : `\n${fail} Check(s) fehlgeschlagen.`,
)
process.exit(fail ? 1 : 0)
