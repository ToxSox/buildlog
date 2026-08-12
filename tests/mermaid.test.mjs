/**
 * Mermaid-Definitionen gegenprüfen.
 *
 * Der Kantentext landete bei Remote-Leitungen in der Form `-. Text .->`. Dort
 * beendet der erste Punkt im Text den Pfeil: „Litze 1.5mm2“ warf einen
 * Lexer-Fehler und riss damit das komplette Diagramm mit – nicht nur die eine
 * Kante. Sichtbar war für den Nutzer nur „Diagramm konnte nicht gerendert
 * werden“, die Ursache stand ausschließlich in der Browser-Konsole.
 *
 *   node tests/mermaid.test.mjs
 */
import { signalDefinition, powerDefinition } from '../src/utils/mermaid.js'

let fail = 0
const check = (name, cond, detail = '') => {
  if (!cond) {
    console.log('FAIL:', name, detail)
    fail++
  }
}

const system = (links) => ({
  components: [
    { id: 'src1', type: 'source', name: 'Radio' },
    { id: 'amp1', type: 'amp', name: 'Endstufe' },
  ],
  signalLinks: links,
})

// ------------------------------------------------------ Remote-Beschriftung
const dotted = signalDefinition(
  system([{ id: 'l1', from: 'src1', to: 'amp1', remote: true, label: 'Litze 1.5mm2' }]),
)
check('Punkt im Remote-Label bleibt in der Beschriftung', dotted.includes('-.->|Litze 1.5mm2|'), dotted)
check('die Form `-. Text .->` wird nicht mehr erzeugt', !/-\.\s/.test(dotted), dotted)

// Eine unbenannte Remote-Leitung heißt im Signalweg „REM“; ein leeres
// Pipe-Paar darf dabei nie entstehen, das wäre wieder ein Syntaxfehler.
const bare = signalDefinition(system([{ id: 'l1', from: 'src1', to: 'amp1', remote: true, label: '' }]))
check('ohne Label steht REM am Pfeil', bare.includes('-.->|REM|'), bare)
check('kein leeres Pipe-Paar', !bare.includes('||'), bare)

// Pipes im Text würden die Beschriftung vorzeitig schließen.
const piped = signalDefinition(system([{ id: 'l1', from: 'src1', to: 'amp1', remote: true, label: 'a|b' }]))
check('Pipe im Label wird entfernt', piped.includes('-.->|ab|'), piped)

// ------------------------------------------------------- Signal ohne Remote
const plain = signalDefinition(system([{ id: 'l1', from: 'src1', to: 'amp1', label: 'Cinch 2.0 m' }]))
check('Audiokante beschriftet in Pipes', plain.includes('-->|Cinch 2.0 m|'), plain)

// ------------------------------------------------------------- Stromlaufplan
// Der Querschnitt trägt selbst einen Punkt (1.5 mm²) und darf die zweite
// Definition genauso wenig kippen.
const power = powerDefinition({
  components: [
    { id: 'bat', type: 'battery', name: 'Batterie' },
    { id: 'amp1', type: 'amp', name: 'Endstufe' },
  ],
  powerLinks: [{ id: 'p1', from: 'bat', to: 'amp1', section: 1.5, fuseAmps: 20, polarity: 'plus' }],
})
check('Querschnitt mit Punkt steht am Pfeil', power.includes('-->|1.5 mm² / 20 A|'), power)

console.log(fail === 0 ? `\nAlle Checks bestanden.` : `\n${fail} Check(s) fehlgeschlagen.`)
process.exit(fail ? 1 : 0)
