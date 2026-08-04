/**
 * EMMA-Regel-Engine
 * =================
 * Prüft den Projekt-State gegen die sicherheitsrelevanten Kernregeln des
 * EMMA-Regelwerks (Installation / Safety).
 *
 * WICHTIG: Die Zahlenwerte sind bewusst in Tabellen ausgelagert, damit sie bei
 * einer neuen Regelwerk-Version an EINER Stelle nachgezogen werden können.
 * Sie bilden die üblichen Absicherungsgrenzen für Kupferleitungen ab; im
 * Zweifel gilt immer das aktuelle offizielle Rulebook.
 */

/** Maximale Absicherung (A) je Kupfer-Querschnitt (mm²). */
export const FUSE_LIMITS = [
  { mm2: 2.5, maxAmps: 30, awg: '≈ AWG 14' },
  { mm2: 4, maxAmps: 40, awg: '≈ AWG 12' },
  { mm2: 6, maxAmps: 50, awg: '≈ AWG 10' },
  { mm2: 10, maxAmps: 80, awg: '≈ AWG 8' },
  { mm2: 16, maxAmps: 125, awg: '≈ AWG 6' },
  { mm2: 20, maxAmps: 150, awg: '≈ AWG 4' },
  { mm2: 25, maxAmps: 175, awg: '≈ AWG 4' },
  { mm2: 35, maxAmps: 225, awg: '≈ AWG 2' },
  { mm2: 50, maxAmps: 300, awg: '≈ AWG 1/0' },
  { mm2: 70, maxAmps: 350, awg: '≈ AWG 2/0' },
  { mm2: 95, maxAmps: 400, awg: '≈ AWG 3/0' },
  { mm2: 120, maxAmps: 500, awg: '≈ AWG 4/0' },
]

/** Maximaler Abstand Hauptsicherung ↔ Batterie-Pluspol in cm. */
export const MAX_FUSE_DISTANCE_CM = 40
/** Empfohlene maximale Masseleitungslänge in cm. */
export const MAX_GROUND_LENGTH_CM = 50

export function maxAmpsFor(mm2) {
  const entry = FUSE_LIMITS.find((e) => e.mm2 === Number(mm2))
  if (entry) return entry.maxAmps
  // Nicht gelistete Querschnitte: nächstkleineren Eintrag verwenden.
  const smaller = [...FUSE_LIMITS].reverse().find((e) => e.mm2 <= Number(mm2))
  return smaller ? smaller.maxAmps : null
}

export function minSectionFor(amps) {
  const entry = FUSE_LIMITS.find((e) => e.maxAmps >= Number(amps))
  return entry ? entry.mm2 : null
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

/**
 * @returns {Array<{id,severity,step,title,message,fix}>}
 * severity: 'error' (Disqualifikationsgefahr) | 'warn' | 'info' | 'ok'
 */
export function evaluateRules(project) {
  const out = []
  const p = project.power || {}

  const mainSection = num(p.mainCableSection)
  const mainFuse = num(p.mainFuseAmps)
  const distance = num(p.mainFuseDistanceCm)
  const groundSection = num(p.groundCableSection)
  const groundLength = num(p.groundLengthCm)

  // ------------------------------------------------ Hauptsicherung vs. Querschnitt
  if (mainSection && mainFuse) {
    const limit = maxAmpsFor(mainSection)
    if (limit && mainFuse > limit) {
      out.push({
        id: 'fuse.oversized',
        severity: 'error',
        step: 'power',
        title: 'Hauptsicherung zu groß für den Querschnitt',
        message: `Achtung: Laut EMMA-Regelwerk darf ${mainSection} mm² mit maximal ${limit} A abgesichert werden – eingetragen sind ${mainFuse} A. Disqualifikationsgefahr!`,
        fix: `Entweder Sicherung auf ≤ ${limit} A tauschen oder Kabel auf mindestens ${minSectionFor(mainFuse) ?? '>120'} mm² vergrößern.`,
      })
    } else if (limit) {
      out.push({
        id: 'fuse.ok',
        severity: 'ok',
        step: 'power',
        title: 'Absicherung passt zum Querschnitt',
        message: `${mainSection} mm² darf bis ${limit} A abgesichert werden – ${mainFuse} A liegen im grünen Bereich.`,
      })
    }
  } else if (mainSection || mainFuse) {
    out.push({
      id: 'fuse.incomplete',
      severity: 'warn',
      step: 'power',
      title: 'Angaben zur Hauptabsicherung unvollständig',
      message: 'Trage sowohl den Querschnitt des Pluskabels als auch den Wert der Hauptsicherung ein, damit die Prüfung greifen kann.',
    })
  }

  // ------------------------------------------------------------ Abstand zur Batterie
  if (distance !== null) {
    if (distance > MAX_FUSE_DISTANCE_CM) {
      out.push({
        id: 'fuse.distance',
        severity: 'error',
        step: 'power',
        title: `Hauptsicherung weiter als ${MAX_FUSE_DISTANCE_CM} cm von der Batterie`,
        message: `Eingetragen: ${distance} cm. Das ungeschützte Stück zwischen Pluspol und Sicherung darf maximal ${MAX_FUSE_DISTANCE_CM} cm lang sein.`,
        fix: 'Sicherungshalter näher an den Pluspol setzen – oder eine zusätzliche Sicherung direkt an der Batterie ergänzen.',
      })
    } else {
      out.push({
        id: 'fuse.distance.ok',
        severity: 'ok',
        step: 'power',
        title: 'Abstand zur Batterie eingehalten',
        message: `${distance} cm liegen innerhalb der ${MAX_FUSE_DISTANCE_CM}-cm-Grenze. Lege für den Richter einen Zollstock mit ins Foto.`,
      })
    }
  } else {
    out.push({
      id: 'fuse.distance.missing',
      severity: 'warn',
      step: 'power',
      title: 'Abstand Hauptsicherung ↔ Batterie fehlt',
      message: 'Ohne cm-Angabe kann der Richter die 40-cm-Regel nicht nachvollziehen.',
    })
  }

  // ------------------------------------------------------------------- Zweitbatterie
  if (p.secondBattery) {
    const secFuse = num(p.secondBatteryFuseAmps)
    const secDist = num(p.secondBatteryDistanceCm)
    const chargeSection = num(p.chargingCableSection)

    if (!secFuse) {
      out.push({
        id: 'secondBattery.noFuse',
        severity: 'error',
        step: 'power',
        title: 'Zweitbatterie ohne Absicherung',
        message: 'Jede zusätzliche Stromquelle muss eigenständig abgesichert sein – auch Richtung Ladekabel.',
        fix: 'Sicherungswert der Zweitbatterie eintragen und im Foto belegen.',
      })
    }
    if (secDist !== null && secDist > MAX_FUSE_DISTANCE_CM) {
      out.push({
        id: 'secondBattery.distance',
        severity: 'error',
        step: 'power',
        title: 'Sicherung der Zweitbatterie zu weit entfernt',
        message: `${secDist} cm überschreiten die ${MAX_FUSE_DISTANCE_CM}-cm-Grenze.`,
      })
    }
    if (chargeSection && secFuse) {
      const limit = maxAmpsFor(chargeSection)
      if (limit && secFuse > limit) {
        out.push({
          id: 'secondBattery.oversized',
          severity: 'error',
          step: 'power',
          title: 'Ladekabel zu schwach abgesichert',
          message: `${chargeSection} mm² dürfen mit maximal ${limit} A abgesichert werden, eingetragen sind ${secFuse} A.`,
        })
      }
    }
  }

  // -------------------------------------------------------------------------- Masse
  if (groundSection && mainSection && groundSection < mainSection) {
    out.push({
      id: 'ground.section',
      severity: 'warn',
      step: 'power',
      title: 'Masseleitung dünner als Plusleitung',
      message: `Plus: ${mainSection} mm², Masse: ${groundSection} mm². Die Masseleitung sollte mindestens den gleichen Querschnitt haben.`,
      fix: `Masse auf ${mainSection} mm² anheben.`,
    })
  }
  if (groundLength !== null && groundLength > MAX_GROUND_LENGTH_CM) {
    out.push({
      id: 'ground.length',
      severity: 'warn',
      step: 'power',
      title: 'Masseleitung sehr lang',
      message: `${groundLength} cm – als Faustregel gilt: so kurz wie möglich, idealerweise unter ${MAX_GROUND_LENGTH_CM} cm.`,
    })
  }
  if (!project.power?.groundPoint) {
    out.push({
      id: 'ground.point.missing',
      severity: 'info',
      step: 'power',
      title: 'Massepunkt nicht beschrieben',
      message: 'Beschreibe kurz, wo die Masse angeschlossen ist (z. B. "Karosserieschraube Reserveradmulde, blank geschliffen").',
    })
  }

  // ------------------------------------------------------------------ Verteiler
  const dist = Array.isArray(p.distributionFuses) ? p.distributionFuses : []
  dist.forEach((entry, i) => {
    const section = num(entry.section)
    const amps = num(entry.amps)
    if (!section || !amps) return
    const limit = maxAmpsFor(section)
    if (limit && amps > limit) {
      out.push({
        id: `distribution.oversized.${entry.id || i}`,
        severity: 'error',
        step: 'power',
        title: `Abgang "${entry.label || i + 1}" zu hoch abgesichert`,
        message: `${section} mm² dürfen mit maximal ${limit} A abgesichert werden, eingetragen sind ${amps} A.`,
      })
    }
  })

  const sumBranch = dist.reduce((acc, e) => acc + (num(e.amps) || 0), 0)
  if (mainFuse && sumBranch && sumBranch > mainFuse) {
    out.push({
      id: 'distribution.sum',
      severity: 'info',
      step: 'power',
      title: 'Summe der Abgänge übersteigt die Hauptsicherung',
      message: `Abgänge gesamt ${sumBranch} A vs. Hauptsicherung ${mainFuse} A. Das ist zulässig, solange nie alles gleichzeitig zieht – erkläre es im Kommentarfeld.`,
    })
  }

  // -------------------------------------------------------------- Batteriebefestigung
  if (!p.batterySecured) {
    out.push({
      id: 'battery.secured',
      severity: 'warn',
      step: 'power',
      title: 'Batteriebefestigung nicht angegeben',
      message: 'Beschreibe, wie die Batterie gegen Verrutschen gesichert ist – eine lose Batterie ist ein Sicherheitsmangel.',
    })
  }

  // ------------------------------------------------------------------ Kabelschutz
  const protection = Array.isArray(p.cableProtection) ? p.cableProtection : []
  if (!protection.length) {
    out.push({
      id: 'protection.missing',
      severity: 'warn',
      step: 'power',
      title: 'Kein Kabelschutz dokumentiert',
      message: 'Gib an, wie die Leitungen geschützt sind (Gummitülle, Wellrohr, Gewebeband, Kantenschutz).',
    })
  }

  return out
}

export function summarize(findings) {
  return {
    errors: findings.filter((f) => f.severity === 'error'),
    warnings: findings.filter((f) => f.severity === 'warn'),
    infos: findings.filter((f) => f.severity === 'info'),
    oks: findings.filter((f) => f.severity === 'ok'),
  }
}
