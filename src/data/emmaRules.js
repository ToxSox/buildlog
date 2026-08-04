/**
 * EMMA-Regel-Engine
 * =================
 * Geprüft gegen: EMMA competition manual, edition 2026 (EMMARulebook2026final.pdf,
 * Kapitel 3 „EMMA rules – Installation Quality“, Kategorien SQ E / S / M / X / X Unlimited
 * sowie ESPL / ESQL).
 *
 * Die Texte liegen in den i18n-Katalogen (rules.*); die Engine liefert nur
 * Schlüssel und Parameter, damit Befunde in jeder Sprache identisch entstehen.
 *
 * Jeder Befund trägt ein `source`-Feld:
 *   'rulebook' – steht so (oder sinngemäß) im offiziellen Regelwerk
 *   'praxis'   – gute Einbaupraxis, aber KEINE EMMA-Vorgabe (gibt keinen Punktabzug)
 *
 * Die Zahlenwerte liegen in Tabellen am Kopf der Datei, damit sie bei einer neuen
 * Rulebook-Edition an einer Stelle nachgezogen werden können.
 */

export const RULEBOOK_EDITION = 'EMMA competition manual, edition 2026'

/**
 * Offizielle „Fuse Size Matrix“ aus dem Rulebook 2026 (Kriterium
 * „Is the fuse value appropriate to the cable circuit?“, 20 Punkte).
 * Das Regelwerk verweist als Grundlage auf VW75212 – Dimensionierung von
 * Leitungen und Sicherungen im Kraftfahrzeug. Rechenspannung U = 12 V.
 *
 * Die AWG-Spalte ist die Zuordnung des Rulebooks, nicht die exakte metrische
 * Umrechnung.
 */
export const FUSE_LIMITS = [
  { mm2: 0.5, awg: 'AWG 20', maxAmps: 10 },
  { mm2: 1.0, awg: 'AWG 17', maxAmps: 15 },
  { mm2: 1.5, awg: 'AWG 15', maxAmps: 20 },
  { mm2: 2.5, awg: 'AWG 13', maxAmps: 20 },
  { mm2: 4.0, awg: 'AWG 11', maxAmps: 30 },
  { mm2: 6.0, awg: 'AWG 9', maxAmps: 50 },
  { mm2: 10, awg: 'AWG 7', maxAmps: 60 },
  { mm2: 16, awg: 'AWG 5', maxAmps: 100 },
  { mm2: 25, awg: 'AWG 4', maxAmps: 125 },
  { mm2: 35, awg: 'AWG 2', maxAmps: 175 },
  { mm2: 50, awg: 'AWG 0', maxAmps: 250 },
  { mm2: 70, awg: 'AWG 2/0', maxAmps: 300 },
]

/** Hauptsicherung: max. 40 cm zum Pluspol UND vor jeder Blechdurchführung. */
export const MAX_FUSE_DISTANCE_CM = 40

/**
 * Rulebook 2026: Ist die OEM-Masseleitung des Fahrzeugs nicht verstärkt, ist die
 * größte zulässige Hauptsicherung (bzw. die Summe mehrerer Hauptsicherungen) 100 A –
 * es sei denn, der Teilnehmer legt eine Berechnung mit der Formel aus dem Judge Book
 * auf Basis des OEM-Massequerschnitts vor.
 */
export const OEM_GROUND_MAX_MAIN_FUSE_A = 100

/** Praxis-Empfehlung, KEINE Rulebook-Vorgabe. */
export const RECOMMENDED_MAX_GROUND_LENGTH_CM = 50

export function maxAmpsFor(mm2) {
  const entry = FUSE_LIMITS.find((e) => e.mm2 === Number(mm2))
  if (entry) return entry.maxAmps
  // Nicht gelistete Querschnitte: nächstkleineren Eintrag verwenden (konservativ).
  const smaller = [...FUSE_LIMITS].reverse().find((e) => e.mm2 <= Number(mm2))
  return smaller ? smaller.maxAmps : null
}

/** Kleinster Querschnitt der Matrix, der den gewünschten Sicherungswert trägt. */
export function minSectionFor(amps) {
  const entry = FUSE_LIMITS.find((e) => e.maxAmps >= Number(amps))
  return entry ? entry.mm2 : null
}

export function isListedSection(mm2) {
  return FUSE_LIMITS.some((e) => e.mm2 === Number(mm2))
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

/**
 * @returns {Array<{id,severity,source,step,key,params,fixKey}>}
 * `key` zeigt auf einen i18n-Eintrag mit .title/.message und optional .fix/.ref
 * severity: 'error' (Punktverlust/Disqualifikationsgefahr) | 'warn' | 'info' | 'ok'
 */
export function evaluateRules(project) {
  const out = []
  const p = project.power || {}

  const mainSection = num(p.mainCableSection)
  const mainFuse = num(p.mainFuseAmps)
  const distance = num(p.mainFuseDistanceCm)
  const groundSection = num(p.groundCableSection)
  const groundLength = num(p.groundLengthCm)

  // -------------------------------------- Hauptsicherung vs. Querschnitt (Fuse Size Matrix)
  if (mainSection && mainFuse) {
    const limit = maxAmpsFor(mainSection)
    const listed = isListedSection(mainSection)

    if (limit && mainFuse > limit) {
      const needed = minSectionFor(mainFuse)
      out.push({
        id: 'fuse.oversized',
        severity: 'error',
        source: 'rulebook',
        step: 'power',
        key: 'rules.fuseOversized',
        fixKey: needed ? 'rules.fuseOversized.fix' : 'rules.fuseOversized.fixNoSection',
        params: { section: mainSection, limit, fuse: mainFuse, needed },
      })
    } else if (limit) {
      out.push({
        id: 'fuse.ok',
        severity: 'ok',
        source: 'rulebook',
        step: 'power',
        key: 'rules.fuseOk',
        params: { section: mainSection, limit, fuse: mainFuse },
      })
    }

    if (!listed) {
      out.push({
        id: 'fuse.sectionNotListed',
        severity: 'info',
        source: 'rulebook',
        step: 'power',
        key: 'rules.fuseSectionNotListed',
        params: { section: mainSection },
      })
    }
  } else if (mainSection || mainFuse) {
    out.push({
      id: 'fuse.incomplete',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      key: 'rules.fuseIncomplete',
    })
  }

  // ------------------------------------------------------ Abstand & Blechdurchführung
  if (distance !== null) {
    if (distance > MAX_FUSE_DISTANCE_CM) {
      out.push({
        id: 'fuse.distance',
        severity: 'error',
        source: 'rulebook',
        step: 'power',
        key: 'rules.fuseDistance',
        params: { distance, max: MAX_FUSE_DISTANCE_CM },
      })
    } else {
      out.push({
        id: 'fuse.distance.ok',
        severity: 'ok',
        source: 'rulebook',
        step: 'power',
        key: 'rules.fuseDistanceOk',
        params: { distance, max: MAX_FUSE_DISTANCE_CM },
      })
    }
  } else {
    out.push({
      id: 'fuse.distance.missing',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      key: 'rules.fuseDistanceMissing',
    })
  }

  // Das Regelwerk fordert die Sicherung 40 cm zum Pol UND/ODER vor der Blechdurchführung.
  if (p.fuseBeforeMetalPanel === false) {
    out.push({
      id: 'fuse.metalPanel',
      severity: 'error',
      source: 'rulebook',
      step: 'power',
      key: 'rules.fuseMetalPanel',
    })
  } else if (p.fuseBeforeMetalPanel === true) {
    out.push({
      id: 'fuse.metalPanel.ok',
      severity: 'ok',
      source: 'rulebook',
      step: 'power',
      key: 'rules.fuseMetalPanelOk',
    })
  } else {
    out.push({
      id: 'fuse.metalPanel.missing',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      key: 'rules.fuseMetalPanelMissing',
    })
  }

  // ------------------------------------------------- OEM-Masseleitung / 100-A-Deckel
  if (mainFuse && !p.oemGroundUpgraded && !p.groundCalculationProvided) {
    if (mainFuse > OEM_GROUND_MAX_MAIN_FUSE_A) {
      out.push({
        id: 'ground.oemCap',
        severity: 'error',
        source: 'rulebook',
        step: 'power',
        key: 'rules.groundOemCap',
        params: { fuse: mainFuse, max: OEM_GROUND_MAX_MAIN_FUSE_A },
      })
    } else {
      out.push({
        id: 'ground.oemCap.ok',
        severity: 'ok',
        source: 'rulebook',
        step: 'power',
        key: 'rules.groundOemCapOk',
        params: { fuse: mainFuse, max: OEM_GROUND_MAX_MAIN_FUSE_A },
      })
    }
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
        source: 'rulebook',
        step: 'power',
        key: 'rules.secondBatteryNoFuse',
      })
    }
    if (secDist !== null && secDist > MAX_FUSE_DISTANCE_CM) {
      out.push({
        id: 'secondBattery.distance',
        severity: 'error',
        source: 'rulebook',
        step: 'power',
        key: 'rules.secondBatteryDistance',
        params: { distance: secDist, max: MAX_FUSE_DISTANCE_CM },
      })
    }
    if (chargeSection && secFuse) {
      const limit = maxAmpsFor(chargeSection)
      if (limit && secFuse > limit) {
        out.push({
          id: 'secondBattery.oversized',
          severity: 'error',
          source: 'rulebook',
          step: 'power',
          key: 'rules.secondBatteryOversized',
          params: { section: chargeSection, limit, fuse: secFuse },
        })
      }
    }

    out.push({
      id: 'secondBattery.combined',
      severity: 'info',
      source: 'rulebook',
      step: 'power',
      key: 'rules.secondBatteryCombined',
    })
  }

  // -------------------------------------------------- Verteiler, Busbars, Abgänge
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
        source: 'rulebook',
        step: 'power',
        key: 'rules.distributionOversized',
        params: { label: entry.label || i + 1, section, limit, fuse: amps },
      })
    }
  })

  if (!dist.length) {
    out.push({
      id: 'distribution.missing',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      key: 'rules.distributionMissing',
    })
  }

  // -------------------------------------------------------- Batteriebefestigung
  if (!p.batterySecured) {
    out.push({
      id: 'battery.secured',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      key: 'rules.batterySecured',
    })
  }

  // ------------------------------------------------------------------ Kabelschutz
  const protection = Array.isArray(p.cableProtection) ? p.cableProtection : []
  if (!protection.length) {
    out.push({
      id: 'protection.missing',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      key: 'rules.protectionMissing',
    })
  }

  // -------------------------------------------------------- Praxis-Empfehlungen
  // Bewusst als 'praxis' markiert: Das Rulebook 2026 macht dazu KEINE Vorgabe.
  if (groundSection && mainSection && groundSection < mainSection) {
    out.push({
      id: 'ground.section',
      severity: 'info',
      source: 'praxis',
      step: 'power',
      key: 'rules.groundSection',
      params: { main: mainSection, ground: groundSection },
    })
  }
  if (groundLength !== null && groundLength > RECOMMENDED_MAX_GROUND_LENGTH_CM) {
    out.push({
      id: 'ground.length',
      severity: 'info',
      source: 'praxis',
      step: 'power',
      key: 'rules.groundLength',
      params: { length: groundLength },
    })
  }
  if (!p.groundPoint) {
    out.push({
      id: 'ground.point.missing',
      severity: 'info',
      source: 'praxis',
      step: 'power',
      key: 'rules.groundPointMissing',
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
