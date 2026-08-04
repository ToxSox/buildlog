import { COMPONENT_TYPES } from '../data/schema.js'

/** Mermaid-Labels vertragen keine Anführungszeichen und keine spitzen Klammern. */
function clean(text) {
  return String(text ?? '')
    .replace(/["`<>{}|]/g, '')
    .replace(/\r?\n/g, ' ')
    .trim()
}

function nodeId(id) {
  return 'n' + String(id).replace(/[^a-zA-Z0-9]/g, '')
}

function typeMeta(type) {
  return COMPONENT_TYPES.find((t) => t.id === type) || { label: type, icon: '•' }
}

function labelFor(component) {
  const meta = typeMeta(component.type)
  const lines = [clean(component.name) || clean(meta.label)]
  if (component.detail) lines.push(clean(component.detail))
  if (component.channels) lines.push(`${clean(component.channels)} Kanäle`)
  return `${meta.icon} ${lines.join('<br/>')}`
}

const CLASS_DEFS = `
  classDef source fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e;
  classDef dsp fill:#ede9fe,stroke:#7c3aed,color:#3b0764;
  classDef amp fill:#fef3c7,stroke:#d97706,color:#78350f;
  classDef speaker fill:#dcfce7,stroke:#16a34a,color:#14532d;
  classDef sub fill:#d1fae5,stroke:#059669,color:#064e3b;
  classDef battery fill:#fee2e2,stroke:#dc2626,color:#7f1d1d;
  classDef fuse fill:#ffe4e6,stroke:#e11d48,color:#881337;
`

function buildFlowchart(components, links, edgeLabel) {
  if (!components.length) return null

  const lines = ['flowchart LR']
  components.forEach((c) => {
    lines.push(`  ${nodeId(c.id)}["${labelFor(c)}"]`)
  })

  links
    .filter((l) => l.from && l.to)
    .forEach((l) => {
      const label = clean(edgeLabel(l))
      const arrow = label ? `-->|${label}|` : '-->'
      lines.push(`  ${nodeId(l.from)} ${arrow} ${nodeId(l.to)}`)
    })

  lines.push(CLASS_DEFS.trim())
  components.forEach((c) => {
    lines.push(`  class ${nodeId(c.id)} ${c.type};`)
  })

  return lines.join('\n')
}

/** Signalweg: alles außer reinen Strom-Komponenten. */
export function signalDefinition(system) {
  const components = (system.components || []).filter((c) => !['battery', 'fuse'].includes(c.type))
  return buildFlowchart(components, system.signalLinks || [], (l) => l.label)
}

/** Stromlaufplan: Batterie, Sicherung, Verbraucher. */
export function powerDefinition(system) {
  const components = (system.components || []).filter((c) => !['speaker', 'sub'].includes(c.type))
  return buildFlowchart(components, system.powerLinks || [], (l) => (l.section ? `${l.section} mm²` : ''))
}
