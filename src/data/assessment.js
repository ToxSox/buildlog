import { CRITERIA, criteriaForColumn, BONUS_POINTS_PER_REQUEST } from './matrix.js'
import { evaluateRules } from './emmaRules.js'

/**
 * Selbsteinschätzung gegen die Installation Matrix.
 *
 * WICHTIG: Das Ergebnis ist eine Schätzung, keine Wertung. Die App kann nur
 * prüfen, was sie sieht – ob eine Crimpung wirklich sauber ist, entscheidet der
 * Richter am Auto. Kriterien mit `assess: 'auto'` werden aus Eingaben und Fotos
 * abgeleitet, alle anderen schätzt der Teilnehmer selbst ein.
 */

const SELF_FACTOR = { yes: 1, partly: 0.5, no: 0 }

const count = (project, slotKey) => (project.media?.[slotKey] || []).length
const has = (project, slotKey) => count(project, slotKey) > 0

function hasSignalDiagram(project) {
  const sys = project.system || {}
  return (sys.components || []).length >= 2 && (sys.signalLinks || []).length >= 1
}

function hasPowerDiagram(project) {
  const sys = project.system || {}
  return (sys.components || []).length >= 2 && (sys.powerLinks || []).length >= 1
}

/** Foto-Log nicht zugänglicher Verbindungen / Komponenten. */
function hasHiddenPhotoLog(project) {
  return has(project, 'power.underCarpet') || has(project, 'power.terminals')
}

/** Zählt Komponenten, die laut Regelwerk eine eigene Sicherung brauchen. */
function fusedComponentCount(project) {
  const hw = project.hardware || {}
  const explicit = (hw.amps?.length || 0) + (hw.dsp?.length || 0)
  const sources = (project.system?.components || []).filter((c) => c.type === 'source').length
  return explicit + sources
}

/**
 * @returns {{id, earned, max, basis, detail}}
 */
function deriveAuto(criterion, project, column, findings) {
  const max = criterion.points[column]
  const ok = (earned, detail) => ({ earned: Math.max(0, Math.min(max, earned)), detail })

  switch (criterion.id) {
    case 'diagram': {
      const n = (hasSignalDiagram(project) ? 1 : 0) + (hasPowerDiagram(project) ? 1 : 0)
      return ok(n * 2, `${n} von 2 Diagrammen vorhanden`)
    }

    case 'sysDoc': {
      const missing = [
        hasSignalDiagram(project) ? null : 'Signal-Flowchart',
        hasPowerDiagram(project) ? null : 'Kabel-/Sicherungsdiagramm',
        hasHiddenPhotoLog(project) ? null : 'Foto-Log verdeckter Verbindungen',
      ].filter(Boolean)
      return ok(max - missing.length, missing.length ? `fehlt: ${missing.join(', ')}` : 'alle drei Elemente vorhanden')
    }

    case 'mainFuse': {
      const p = project.power || {}
      const distanceOk = p.mainFuseDistanceCm !== null && Number(p.mainFuseDistanceCm) <= 40
      const panelOk = p.fuseBeforeMetalPanel === true
      const placed = distanceOk || panelOk
      if (!p.mainFuseAmps) return ok(0, 'kein Sicherungswert eingetragen')
      if (!placed) return ok(0, 'Lage der Sicherung erfüllt die Regel nicht (40 cm / vor Blech)')
      if (!hasPowerDiagram(project)) return ok(0, 'ohne Stromlaufplan wird nicht gewertet')
      if (!has(project, 'power.mainFuse')) return ok(max, 'Regel erfüllt – ein Foto mit Maßstab macht es beweisbar')
      return ok(max, 'Regel erfüllt und fotografisch belegt')
    }

    case 'allFused': {
      const needed = fusedComponentCount(project)
      const fuses = (project.power?.distributionFuses || []).length
      if (!needed) return ok(0, 'noch keine Komponenten erfasst')
      const unfused = Math.max(0, needed - fuses)
      return ok(max - unfused * 2, unfused ? `${unfused} Komponente(n) ohne erfassten Abgang` : `${needed} Komponenten abgesichert`)
    }

    case 'fuseValue': {
      const bad = findings.filter(
        (f) => f.severity === 'error' && /oversized|oemCap|noFuse/.test(f.id),
      ).length
      return ok(max - bad * 2, bad ? `${bad} unpassende Absicherung(en)` : 'alle erfassten Sicherungen passen zum Querschnitt')
    }

    case 'terminated': {
      const n = ['power.terminals', 'power.underCarpet', 'power.ground'].filter((k) => has(project, k)).length
      return ok((n / 3) * max, `${n} von 3 Nachweisfotos vorhanden`)
    }

    case 'terminationsProtected': {
      if (!has(project, 'power.terminals')) return ok(0, 'kein Foto der Terminierungen – nur Sichtprüfung möglich')
      return ok(max, 'per Foto-Log belegt')
    }

    case 'cablesProtected': {
      const photo = has(project, 'power.grommet')
      const declared = (project.power?.cableProtection || []).length > 0
      if (photo && declared) return ok(max, 'Schutzmaßnahmen benannt und fotografiert')
      if (photo || declared) return ok(max / 2, photo ? 'Foto vorhanden, Schutzart nicht benannt' : 'Schutzart benannt, Foto fehlt')
      return ok(0, 'kein Kabelschutz dokumentiert')
    }

    case 'mounted': {
      const groups = ['hardware.amps', 'hardware.dsp', 'hardware.speakersFront', 'hardware.sub', 'power.battery']
      const covered = groups.filter((k) => has(project, k)).length
      return ok((covered / groups.length) * max, `${covered} von ${groups.length} Komponentengruppen fotografiert`)
    }

    case 'bonus': {
      const n = (project.bonusRequests || []).filter((r) => r.title).length
      const earned = n * BONUS_POINTS_PER_REQUEST
      return ok(earned, n ? `${n} Antrag/Anträge eingereicht` : 'noch keine Anträge formuliert')
    }

    default:
      return ok(0, '')
  }
}

export function assessProject(project, column) {
  if (!column) {
    return { column: null, criteria: [], earned: 0, max: 0, unrated: 0, percent: 0 }
  }

  const findings = evaluateRules(project)
  const list = criteriaForColumn(column).map((criterion) => {
    const max = criterion.points[column]

    if (criterion.assess === 'auto') {
      const { earned, detail } = deriveAuto(criterion, project, column, findings)
      return { ...criterion, max, earned: Math.round(earned * 10) / 10, basis: 'auto', state: null, detail }
    }

    const entry = project.assessment?.[criterion.id] || {}
    const state = entry.state || null
    const factor = state ? SELF_FACTOR[state] ?? 0 : 0
    return {
      ...criterion,
      max,
      earned: Math.round(max * factor * 10) / 10,
      basis: state ? 'self' : 'unrated',
      state,
      note: entry.note || '',
      detail: state ? '' : 'noch nicht eingeschätzt',
    }
  })

  const earned = list.reduce((sum, c) => sum + c.earned, 0)
  const max = list.reduce((sum, c) => sum + c.max, 0)

  return {
    column,
    criteria: list,
    earned: Math.round(earned * 10) / 10,
    max,
    unrated: list.filter((c) => c.basis === 'unrated').length,
    percent: max ? Math.round((earned / max) * 100) : 0,
  }
}

export function criterionLabel(id, lang = 'de') {
  const c = CRITERIA.find((x) => x.id === id)
  return c ? c.label[lang] || c.label.de : id
}
