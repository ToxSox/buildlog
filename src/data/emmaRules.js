/**
 * EMMA-Regel-Engine
 * =================
 * Geprüft gegen: EMMA competition manual, edition 2026 (EMMARulebook2026final.pdf,
 * Kapitel 3 „EMMA rules – Installation Quality“, Kategorien SQ E / S / M / X / X Unlimited
 * sowie ESPL / ESQL).
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
 * @returns {Array<{id,severity,source,step,title,message,fix,ref}>}
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
        title: 'Hauptsicherung zu groß für den Querschnitt',
        message: `Laut Fuse Size Matrix des EMMA-Regelwerks darf ${mainSection} mm² mit maximal ${limit} A abgesichert werden – eingetragen sind ${mainFuse} A.`,
        fix: needed
          ? `Sicherung auf ≤ ${limit} A reduzieren oder Kabel auf mindestens ${needed} mm² vergrößern.`
          : `Sicherung auf ≤ ${limit} A reduzieren. Für ${mainFuse} A reicht selbst 70 mm² laut Matrix nicht – hier ist die Berechnung nach Judge-Book-Formel nötig.`,
        ref: 'Kriterium „Is the fuse value appropriate to the cable circuit?“ (20 Punkte)',
      })
    } else if (limit) {
      out.push({
        id: 'fuse.ok',
        severity: 'ok',
        source: 'rulebook',
        step: 'power',
        title: 'Absicherung passt zum Querschnitt',
        message: `${mainSection} mm² darf laut Fuse Size Matrix bis ${limit} A abgesichert werden – ${mainFuse} A liegen im grünen Bereich.`,
      })
    }

    if (!listed) {
      out.push({
        id: 'fuse.sectionNotListed',
        severity: 'info',
        source: 'rulebook',
        step: 'power',
        title: `${mainSection} mm² steht nicht in der Fuse Size Matrix`,
        message:
          'Die App rechnet konservativ mit dem nächstkleineren gelisteten Querschnitt. Alternativ erlaubt das Regelwerk eine Berechnung nach der Formel aus dem Judge Book – diese muss dann dokumentiert und den Richtern vorgelegt werden.',
      })
    }
  } else if (mainSection || mainFuse) {
    out.push({
      id: 'fuse.incomplete',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      title: 'Angaben zur Hauptabsicherung unvollständig',
      message: 'Trage Querschnitt des Pluskabels und Wert der Hauptsicherung ein, damit die Prüfung greifen kann.',
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
        title: `Hauptsicherung weiter als ${MAX_FUSE_DISTANCE_CM} cm vom Pluspol`,
        message: `Eingetragen: ${distance} cm. Das Regelwerk verlangt die Hauptsicherung innerhalb von ${MAX_FUSE_DISTANCE_CM} cm zu jedem Batterie-Pluspol.`,
        fix: 'Sicherungshalter näher an den Pluspol setzen oder eine zusätzliche Sicherung direkt an der Batterie ergänzen.',
        ref: 'Kriterium „Main fuse present y/n“ – bei Nichterfüllung 0 von 10 Punkten',
      })
    } else {
      out.push({
        id: 'fuse.distance.ok',
        severity: 'ok',
        source: 'rulebook',
        step: 'power',
        title: 'Abstand zum Pluspol eingehalten',
        message: `${distance} cm liegen innerhalb der ${MAX_FUSE_DISTANCE_CM}-cm-Grenze. Lege für den Richter einen Zollstock mit ins Foto.`,
      })
    }
  } else {
    out.push({
      id: 'fuse.distance.missing',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      title: 'Abstand Hauptsicherung ↔ Pluspol fehlt',
      message: 'Ohne cm-Angabe kann der Richter die 40-cm-Regel nicht nachvollziehen.',
    })
  }

  // Das Regelwerk fordert die Sicherung 40 cm zum Pol UND/ODER vor der Blechdurchführung.
  if (p.fuseBeforeMetalPanel === false) {
    out.push({
      id: 'fuse.metalPanel',
      severity: 'error',
      source: 'rulebook',
      step: 'power',
      title: 'Sicherung sitzt hinter der Blechdurchführung',
      message:
        'Die Hauptsicherung muss sitzen, bevor das Kabel ein Blech durchdringt. Ein ungesichertes Kabel durch die Spritzwand kostet die vollen 10 Punkte für „Main fuse present“.',
      fix: 'Sicherungshalter vor die Durchführung setzen.',
      ref: '„…connected to any positive battery post within 40cm and/or before passing any metal panel“',
    })
  } else if (p.fuseBeforeMetalPanel === true) {
    out.push({
      id: 'fuse.metalPanel.ok',
      severity: 'ok',
      source: 'rulebook',
      step: 'power',
      title: 'Sicherung vor der Blechdurchführung',
      message: 'Das Kabel ist bereits abgesichert, bevor es Blech durchdringt.',
    })
  } else {
    out.push({
      id: 'fuse.metalPanel.missing',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      title: 'Lage der Sicherung zur Blechdurchführung nicht angegeben',
      message:
        'Das Regelwerk verlangt die Hauptsicherung innerhalb von 40 cm zum Pol und/oder vor jeder Blechdurchführung. Beantworte die Frage, damit die Prüfung vollständig ist.',
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
        title: `Bei originaler Masseleitung sind maximal ${OEM_GROUND_MAX_MAIN_FUSE_A} A erlaubt`,
        message: `Die Hauptsicherung liegt bei ${mainFuse} A. Solange die OEM-Masseleitung des Fahrzeugs nicht verstärkt ist, begrenzt das Regelwerk die Hauptsicherung (bzw. die Summe mehrerer Hauptsicherungen) auf ${OEM_GROUND_MAX_MAIN_FUSE_A} A.`,
        fix: 'Masseleitung Motor/Karosserie ↔ Batterie verstärken – oder eine Berechnung nach der Judge-Book-Formel mit dem OEM-Massequerschnitt beilegen.',
        ref: '„If the car\'s OEM ground cable is not upgraded the biggest allowed size for the main fuse … is 100 A“',
      })
    } else {
      out.push({
        id: 'ground.oemCap.ok',
        severity: 'ok',
        source: 'rulebook',
        step: 'power',
        title: `Hauptsicherung unter der ${OEM_GROUND_MAX_MAIN_FUSE_A}-A-Grenze`,
        message: `Auch mit originaler Masseleitung zulässig (${mainFuse} A ≤ ${OEM_GROUND_MAX_MAIN_FUSE_A} A).`,
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
        title: 'Zweitbatterie ohne Absicherung',
        message:
          'Die Absicherungsregel gilt für alle Leiter im Stromsystem. Bei Mehrbatterie-Anlagen achten die Richter besonders darauf, dass jede Quelle, die Strom in einen Verteiler speist, abgesichert ist.',
        fix: 'Sicherungswert der Zweitbatterie eintragen und im Foto belegen.',
      })
    }
    if (secDist !== null && secDist > MAX_FUSE_DISTANCE_CM) {
      out.push({
        id: 'secondBattery.distance',
        severity: 'error',
        source: 'rulebook',
        step: 'power',
        title: 'Sicherung der Zweitbatterie zu weit entfernt',
        message: `${secDist} cm überschreiten die ${MAX_FUSE_DISTANCE_CM}-cm-Grenze. Die Regel gilt für jeden Batterie-Pluspol.`,
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
          title: 'Ladekabel zu hoch abgesichert',
          message: `${chargeSection} mm² dürfen laut Fuse Size Matrix mit maximal ${limit} A abgesichert werden, eingetragen sind ${secFuse} A.`,
        })
      }
    }

    out.push({
      id: 'secondBattery.combined',
      severity: 'info',
      source: 'rulebook',
      step: 'power',
      title: 'Mehrbatterie-System: Strom kann von beiden Seiten kommen',
      message:
        'Bei einem Kurzschluss können mehrere Quellen gleichzeitig einspeisen. Jeder Leiter muss die Summe aller einspeisenden Quellen bzw. den Wert der ihn schützenden Sicherung aushalten – das prüfen die Richter ausdrücklich.',
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
        title: `Abgang „${entry.label || i + 1}“ zu hoch abgesichert`,
        message: `${section} mm² dürfen laut Fuse Size Matrix mit maximal ${limit} A abgesichert werden, eingetragen sind ${amps} A. Die Regel gilt ausdrücklich auch für Verteilerblöcke und Busbars.`,
      })
    }
  })

  if (!dist.length) {
    out.push({
      id: 'distribution.missing',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      title: 'Keine Abgänge erfasst',
      message:
        'Jede Leitung zu jeder Komponente (Headunit, DSP, Endstufen) muss abgesichert sein und die Sicherungen müssen innerhalb von drei Minuten auffindbar sein. Erfasse die Abgänge, damit sie im Stromlaufplan auftauchen.',
      ref: 'Kriterium „Are all the cables to the components fused?“ (15 Punkte)',
    })
  }

  // -------------------------------------------------------- Batteriebefestigung
  if (!p.batterySecured) {
    out.push({
      id: 'battery.secured',
      severity: 'warn',
      source: 'rulebook',
      step: 'power',
      title: 'Batteriebefestigung nicht angegeben',
      message:
        'Alle Komponenten werden per Handprüfung auf feste Montage kontrolliert. Beschreibe, wie die Batterie gegen Verrutschen gesichert ist.',
      ref: 'Kriterium „Are all components securely mounted?“ (24 Punkte)',
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
      title: 'Kein Kabelschutz dokumentiert',
      message:
        'Kabel, die Blech durchdringen, müssen durch Tüllen, Gummis o. ä. geschützt sein; mechanisch belastete Kabel (Türdurchführung) oder Kabel nahe beweglichen Teilen brauchen einen Schutzschlauch.',
      ref: 'Kriterium „Cables protected from damage y/n“ (5 Punkte)',
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
      title: 'Masseleitung dünner als Plusleitung',
      message: `Plus: ${mainSection} mm², Masse: ${groundSection} mm². Gute Praxis ist ein mindestens gleich großer Querschnitt. Das EMMA-Regelwerk schreibt das nicht vor – es gibt dafür also keinen Punktabzug.`,
    })
  }
  if (groundLength !== null && groundLength > RECOMMENDED_MAX_GROUND_LENGTH_CM) {
    out.push({
      id: 'ground.length',
      severity: 'info',
      source: 'praxis',
      step: 'power',
      title: 'Masseleitung sehr lang',
      message: `${groundLength} cm – als Faustregel gilt „so kurz wie möglich“. Keine Rulebook-Vorgabe, aber es hilft dem Klang und der Erklärung gegenüber den Richtern.`,
    })
  }
  if (!p.groundPoint) {
    out.push({
      id: 'ground.point.missing',
      severity: 'info',
      source: 'praxis',
      step: 'power',
      title: 'Massepunkt nicht beschrieben',
      message: 'Beschreibe kurz, wo die Masse angeschlossen ist (z. B. „Karosserieschraube Reserveradmulde, blank geschliffen“).',
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
