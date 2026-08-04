import { CRITERIA, criteriaForColumn, BONUS_POINTS_PER_REQUEST } from './matrix.js'
import { evaluateRules } from './emmaRules.js'
import { translate } from '../i18n/index.js'

const d = (key, params) => translate(`assessment.${key}`, params)

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
      return ok(n * 2, d('diagrams', { n }))
    }

    case 'sysDoc': {
      const missing = [
        hasSignalDiagram(project) ? null : d('sysDocSignal'),
        hasPowerDiagram(project) ? null : d('sysDocPower'),
        hasHiddenPhotoLog(project) ? null : d('sysDocPhotoLog'),
      ].filter(Boolean)
      return ok(
        max - missing.length,
        missing.length ? d('sysDocMissing', { list: missing.join(', ') }) : d('sysDocComplete'),
      )
    }

    case 'mainFuse': {
      const p = project.power || {}
      const distanceOk = p.mainFuseDistanceCm !== null && Number(p.mainFuseDistanceCm) <= 40
      const panelOk = p.fuseBeforeMetalPanel === true
      const placed = distanceOk || panelOk
      if (!p.mainFuseAmps) return ok(0, d('mainFuseNoValue'))
      if (!placed) return ok(0, d('mainFuseBadPlacement'))
      if (!hasPowerDiagram(project)) return ok(0, d('mainFuseNoDiagram'))
      if (!has(project, 'power.mainFuse')) return ok(max, d('mainFuseOkNoPhoto'))
      return ok(max, d('mainFuseOk'))
    }

    case 'allFused': {
      const needed = fusedComponentCount(project)
      const fuses = (project.power?.distributionFuses || []).length
      if (!needed) return ok(0, d('allFusedNoComponents'))
      const unfused = Math.max(0, needed - fuses)
      return ok(
        max - unfused * 2,
        unfused ? d('allFusedUnfused', { n: unfused }) : d('allFusedOk', { n: needed }),
      )
    }

    case 'fuseValue': {
      const bad = findings.filter(
        (f) => f.severity === 'error' && /oversized|oemCap|noFuse/.test(f.id),
      ).length
      return ok(max - bad * 2, bad ? d('fuseValueBad', { n: bad }) : d('fuseValueOk'))
    }

    case 'terminated': {
      const n = ['power.terminals', 'power.underCarpet', 'power.ground'].filter((k) => has(project, k)).length
      return ok((n / 3) * max, d('terminatedPhotos', { n }))
    }

    case 'terminationsProtected': {
      if (!has(project, 'power.terminals')) return ok(0, d('terminationsNoPhoto'))
      return ok(max, d('terminationsOk'))
    }

    case 'cablesProtected': {
      const photo = has(project, 'power.grommet')
      const declared = (project.power?.cableProtection || []).length > 0
      if (photo && declared) return ok(max, d('protectedBoth'))
      if (photo || declared) return ok(max / 2, photo ? d('protectedPhotoOnly') : d('protectedDeclaredOnly'))
      return ok(0, d('protectedNone'))
    }

    case 'mounted': {
      const groups = ['hardware.amps', 'hardware.dsp', 'hardware.speakersFront', 'hardware.sub', 'power.battery']
      const covered = groups.filter((k) => has(project, k)).length
      return ok((covered / groups.length) * max, d('mountedGroups', { covered, total: groups.length }))
    }

    case 'bonus': {
      const n = (project.bonusRequests || []).filter((r) => r.title).length
      const earned = n * BONUS_POINTS_PER_REQUEST
      return ok(earned, n ? d('bonusSubmitted', { n }) : d('bonusNone'))
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
      detail: state ? '' : d('notRated'),
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
