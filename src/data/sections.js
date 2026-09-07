/**
 * Sichtbarkeit und Pflicht ergeben sich aus der EMMA-Kategorie (Matrix-Spalte),
 * nicht mehr aus dem Modus. Der Modus filtert nur noch den Umfang:
 * Quick Rescue blendet alles aus, was in dieser Kategorie nicht Pflicht ist.
 */
const ALL = ['E', 'S', 'M', 'X', 'XUNL']
const FROM_S = ['S', 'M', 'X', 'XUNL']
const FROM_M = ['M', 'X', 'XUNL']
const NONE = []

/**
 * Manifest aller Foto-Slots.
 *
 * Diese Datei ist die einzige Quelle der Wahrheit für
 *  – die Upload-Felder im Wizard,
 *  – den Fortschritts-/Punktestand,
 *  – die "Fehlt noch"-Warnungen,
 *  – und das Layout des DIN-A4-Ausdrucks.
 *
 * required  : in welchen Kategorien (Matrix-Spalten) das Foto Pflicht ist
 * shown     : in welchen Kategorien das Feld überhaupt auftaucht
 * criterion : Bewertungskriterium der Installation Matrix, auf das es einzahlt
 * points    : Gewicht innerhalb des Foto-Fortschritts
 * example   : Schlüssel der Ghost-Overlay-Illustration (siehe examples.js)
 */
export const SECTIONS = [
  // ------------------------------------------------------------- Fahrzeug
  {
    step: 'vehicle',
    key: 'sec.vehicle',
    title: { de: 'Fahrzeug & Teilnehmer', en: 'Vehicle & competitor' },
    intro: {
      de: 'Damit der Juror die Mappe eindeutig deinem Auto zuordnen kann.',
      en: 'So the judge can clearly match the build log to your car.',
    },
    slots: [
      {
        key: 'vehicle.exterior',
        label: { de: 'Fahrzeug Außenansicht', en: 'Vehicle exterior' },
        shown: ALL,
        required: ALL,
        criterion: 'firstOptic',
        points: 4,
        multiple: true,
        example: 'vehicle',
        hint: {
          de: 'Dreiviertel-Ansicht, Kennzeichen lesbar oder bewusst abgeklebt.',
          en: 'Three-quarter view, plate either readable or deliberately covered.',
        },
        tip: {
          de: 'Ein Bild vom kompletten Auto ist die Titelseite deiner Mappe – ohne das wirkt die Doku anonym.',
          en: 'A photo of the whole car is the cover of your build log – without it the documentation feels anonymous.',
        },
      },
      {
        key: 'vehicle.interior',
        label: { de: 'Innenraum / Hörplatz', en: 'Interior / listening position' },
        shown: ALL,
        required: FROM_M,
        criterion: 'interiorCables',
        points: 3,
        multiple: true,
        example: 'interior',
        hint: {
          de: 'Blick vom Fahrersitz Richtung Armaturenbrett.',
          en: 'View from the driver seat towards the dashboard.',
        },
        tip: {
          de: 'Zeigt dem Juror die Einbaulage der Hochtöner und den Hörplatz.',
          en: 'Shows the judge where the tweeters sit and what the listening position looks like.',
        },
      },
    ],
  },

  // -------------------------------------------------------- Strom & Sicherheit
  {
    step: 'power',
    key: 'sec.power.battery',
    title: { de: 'Batterie & Hauptsicherung', en: 'Battery & main fuse' },
    intro: {
      de: 'Der wichtigste Sicherheitsblock – hier wird am häufigsten Punktabzug verteilt.',
      en: 'The most important safety block – this is where points are lost most often.',
    },
    slots: [
      {
        key: 'power.battery',
        label: { de: 'Batterie & Befestigung', en: 'Battery & mounting' },
        shown: ALL,
        required: ALL,
        criterion: 'mounted',
        points: 6,
        multiple: true,
        example: 'battery',
        hint: {
          de: 'Batterie im eingebauten Zustand inkl. Niederhalter/Halterung.',
          en: 'Battery as installed, including hold-down or bracket.',
        },
        tip: {
          de: 'Eine lose Batterie ist ein sofortiger Sicherheitsmangel. Zeige die Verschraubung im Bild.',
          en: 'A loose battery is an immediate safety defect. Show the bolted fixing in the photo.',
        },
      },
      {
        key: 'power.mainFuse',
        label: { de: 'Hauptsicherung mit Maßstab', en: 'Main fuse with a ruler' },
        shown: ALL,
        required: ALL,
        criterion: 'mainFuse',
        points: 10,
        multiple: true,
        example: 'fuseRuler',
        hint: {
          de: 'Sicherung + Zollstock/Maßband bis zum Batterie-Pluspol im selben Bild.',
          en: 'Fuse and folding rule up to the positive battery post in the same shot.',
        },
        tip: {
          de: 'Juroren können keine Entfernungen raten. Lege einen Zollstock ins Bild und fotografiere so, dass Sicherung UND Batteriepol sichtbar sind. Die Sicherung muss innerhalb von 40 cm zum Pol und/oder vor der ersten Blechdurchführung sitzen – sonst gibt es 0 von 10 Punkten.',
          en: 'Judges cannot guess distances. Put a folding rule in the shot and frame it so the fuse AND the battery post are visible. The fuse must sit within 40 cm of the post and/or before the first metal pass-through – otherwise it is 0 of 10 points.',
        },
      },
      {
        key: 'power.secondBattery',
        label: { de: 'Zweitbatterie / Powercap', en: 'Second battery / power cap' },
        shown: ALL,
        required: NONE,
        criterion: 'fuseValue',
        points: 3,
        multiple: true,
        example: 'battery',
        hint: {
          de: 'Nur nötig, wenn verbaut – inkl. eigener Absicherung.',
          en: 'Only needed if installed – including its own fuse.',
        },
        tip: {
          de: 'Jede zusätzliche Stromquelle braucht eine eigene Sicherung innerhalb von 40 cm.',
          en: 'Every additional power source needs its own fuse within 40 cm.',
        },
      },
    ],
  },
  {
    step: 'power',
    key: 'sec.power.cabling',
    title: { de: 'Kabelverlegung & Schutz', en: 'Cable routing & protection' },
    intro: {
      de: 'Jede Blechdurchführung und jede Klemmstelle will belegt sein.',
      en: 'Every metal pass-through and every termination wants evidence.',
    },
    slots: [
      {
        key: 'power.routing',
        label: { de: 'Kabelverlegung Motorraum', en: 'Cable routing in the engine bay' },
        shown: ALL,
        required: FROM_M,
        criterion: 'cablesProtected',
        points: 6,
        multiple: true,
        example: 'routing',
        hint: {
          de: 'Verlauf des Pluskabels von der Batterie bis zur Spritzwand.',
          en: 'Route of the positive cable from the battery to the firewall.',
        },
        tip: {
          de: 'Kabel dürfen nicht auf scharfen Kanten oder heißen Teilen (Krümmer) aufliegen.',
          en: 'Cables must not rest on sharp edges or hot parts such as the manifold.',
        },
      },
      {
        key: 'power.grommet',
        label: { de: 'Blechdurchführung / Gummitülle', en: 'Metal pass-through / grommet' },
        shown: ALL,
        required: FROM_M,
        criterion: 'cablesProtected',
        points: 8,
        multiple: true,
        example: 'grommet',
        hint: {
          de: 'Nahaufnahme der Durchführung durch die Spritzwand.',
          en: 'Close-up of the pass-through in the firewall.',
        },
        tip: {
          de: 'Kabel durch Blech müssen durch Tüllen oder Gummis geschützt sein, mechanisch belastete Kabel (Türdurchführung, Nähe Keilriemen) brauchen einen Schutzschlauch. Pro ungeschütztem Kabel wird 1 Punkt abgezogen.',
          en: 'Cables passing metal must be protected by grommets or rubbers; mechanically stressed cables (door pass-through, near the drive belt) need protective sleeving. 1 point is deducted per unprotected cable.',
        },
      },
      {
        key: 'power.terminals',
        label: { de: 'Terminierung / Crimpungen', en: 'Terminations / crimps' },
        shown: ALL,
        required: FROM_M,
        criterion: 'terminationsProtected',
        points: 8,
        multiple: true,
        example: 'crimp',
        hint: {
          de: 'Kabelschuhe, Crimpungen, Schrumpfschlauch – am besten offen und montiert.',
          en: 'Lugs, crimps, heat shrink – ideally open and installed.',
        },
        tip: {
          de: 'Das Regelwerk lässt für "Cables properly terminated / secured" und "Cable terminations protected" ausdrücklich den Foto-Log als Nachweis zu – ohne Bild bleibt nur die Sichtprüfung. Ein Bild "offen gecrimpt" + "fertig geschrumpft" wirkt Wunder.',
          en: 'The rulebook explicitly accepts a photo log as evidence for "Cables properly terminated / secured" and "Cable terminations protected" – without a photo only visual inspection remains. One shot "crimped, open" plus one "shrink-wrapped, done" works wonders.',
        },
      },
      {
        key: 'power.underCarpet',
        label: { de: 'Terminierung unter dem Teppich', en: 'Terminations under the carpet' },
        shown: FROM_M,
        required: FROM_M,
        criterion: 'terminated',
        points: 6,
        multiple: true,
        example: 'crimp',
        hint: {
          de: 'Verbindungen, die im fertigen Zustand nicht mehr sichtbar sind.',
          en: 'Connections that are no longer visible once everything is finished.',
        },
        tip: {
          de: 'Ab Kategorie SQ M verlangt das Regelwerk ausdrücklich einen Foto-Log nicht zugänglicher Verbindungen und Komponenten – pro fehlendem Element 1 Punkt Abzug.',
          en: 'From category SQ M upwards the rulebook explicitly requires a photo log of not accessible connections and components – 1 point deducted per missing element.',
        },
      },
      {
        key: 'power.distribution',
        label: { de: 'Verteiler & Sicherungshalter', en: 'Distribution block & fuse holders' },
        shown: ALL,
        required: FROM_S,
        criterion: 'allFused',
        points: 6,
        multiple: true,
        example: 'distribution',
        hint: {
          de: 'Verteilerblock mit allen Abgängen und deren Absicherung.',
          en: 'Distribution block with all branches and their fuses.',
        },
        tip: {
          de: 'Jeder Abgang mit kleinerem Querschnitt braucht eine eigene Sicherung.',
          en: 'Every branch with a smaller cross-section needs its own fuse.',
        },
      },
      {
        key: 'power.ground',
        label: { de: 'Massepunkt', en: 'Ground point' },
        shown: ALL,
        required: FROM_S,
        criterion: 'terminated',
        points: 8,
        multiple: true,
        example: 'ground',
        hint: {
          de: 'Blank geschliffene Stelle, Schraube, Kabelschuh.',
          en: 'Bare sanded spot, bolt, cable lug.',
        },
        tip: {
          de: 'Zeige das blank geschliffene Blech. Kurze Masse im gleichen Querschnitt wie Plus ist gute Praxis – das Regelwerk schreibt dafür allerdings keinen Wert vor.',
          en: 'Show the bare sanded metal. A short ground in the same cross-section as the positive is good practice – the rulebook does not prescribe a value for it though.',
        },
      },
    ],
  },

  // ------------------------------------------------------------- Hardware
  {
    step: 'hardware',
    key: 'sec.hardware.mount',
    title: { de: 'Hardware-Montage', en: 'Hardware mounting' },
    intro: {
      de: 'Jede Komponente muss sicher und nachvollziehbar befestigt sein.',
      en: 'Every component must be securely and verifiably mounted.',
    },
    slots: [
      {
        key: 'hardware.amps',
        label: { de: 'Endstufen inkl. Verschraubung', en: 'Amplifiers including fixings' },
        shown: ALL,
        required: ALL,
        criterion: 'mounted',
        points: 7,
        multiple: true,
        example: 'mount',
        hint: {
          de: 'Einbaulage + Nahaufnahme der Befestigungspunkte.',
          en: 'Installed position plus a close-up of the mounting points.',
        },
        tip: {
          de: 'Die Juroren prüfen jede Komponente per Handprobe auf festen Sitz (2 Punkte Abzug pro loser Komponente). Zeige Schrauben oder Gewindeeinsätze.',
          en: 'Judges check every component by hand for a secure fit (2 points deducted per loose component). Show bolts or threaded inserts.',
        },
      },
      {
        key: 'hardware.dsp',
        label: { de: 'DSP / Signalprozessor', en: 'DSP / signal processor' },
        shown: ALL,
        required: ALL,
        criterion: 'mounted',
        points: 5,
        multiple: true,
        example: 'mount',
        hint: {
          de: 'Gerät im eingebauten Zustand, Anschlüsse erkennbar.',
          en: 'Device as installed, connections visible.',
        },
        tip: {
          de: 'Wenn der DSP versteckt sitzt, ist dieses Foto der einzige Beweis für saubere Arbeit.',
          en: 'If the DSP is hidden, this photo is the only proof of clean work.',
        },
      },
      {
        key: 'hardware.speakersFront',
        label: { de: 'Lautsprecher vorne', en: 'Front speakers' },
        shown: ALL,
        required: ALL,
        criterion: 'mounted',
        points: 6,
        multiple: true,
        example: 'speaker',
        hint: {
          de: 'Tief-/Mitteltöner und Hochtöner in Einbaulage.',
          en: 'Woofers/midranges and tweeters in their installed position.',
        },
        tip: {
          de: 'Adapterringe und Verschraubung mitfotografieren. Denk an das Kriterium "Protection of Speakers": Lautsprecher in Fronttüren und Fußraum brauchen einen starren Schutz, wenn man die Membran mit einem 3-cm-Zylinder berühren kann.',
          en: 'Photograph adapter rings and fixings too. Remember the "Protection of Speakers" criterion: speakers in front doors and the foot room need rigid protection if the membrane can be touched with a 3 cm cylinder.',
        },
      },
      {
        key: 'hardware.speakersRear',
        label: { de: 'Lautsprecher hinten', en: 'Rear speakers' },
        shown: ALL,
        required: NONE,
        criterion: 'mounted',
        points: 2,
        multiple: true,
        example: 'speaker',
        hint: { de: 'Nur wenn verbaut.', en: 'Only if installed.' },
        tip: { de: '', en: '' },
      },
      {
        key: 'hardware.sub',
        label: { de: 'Subwoofer & Gehäuse', en: 'Subwoofer & enclosure' },
        shown: ALL,
        required: ALL,
        criterion: 'mounted',
        points: 6,
        multiple: true,
        example: 'sub',
        hint: {
          de: 'Gehäuse inkl. Befestigung im Fahrzeug.',
          en: 'Enclosure including how it is secured in the vehicle.',
        },
        tip: {
          de: 'Ein ungesichertes Gehäuse ist ein Sicherheitsmangel – zeige Spanngurte, Winkel oder Verschraubung.',
          en: 'An unsecured enclosure is a safety defect – show straps, brackets or bolts.',
        },
      },
      {
        key: 'hardware.signalRouting',
        label: { de: 'Signalkabel-Verlegung (Cinch)', en: 'Signal cable routing (RCA)' },
        shown: FROM_M,
        required: FROM_M,
        criterion: 'craftsmanship',
        points: 5,
        multiple: true,
        example: 'routing',
        hint: {
          de: 'Trennung von Strom- und Signalkabeln sichtbar machen.',
          en: 'Make the separation of power and signal cables visible.',
        },
        tip: {
          de: 'Getrennte Verlegung von Strom und Signal ist gute Praxis und zahlt in den Craftsmanship-Block (Kabelführung) ein. Eine eigene Regel dafür gibt es im Rulebook nicht.',
          en: 'Routing power and signal separately is good practice and feeds into the craftsmanship block (cable routing). There is no dedicated rule for it in the rulebook.',
        },
      },
      {
        key: 'hardware.overview',
        label: { de: 'Gesamtansicht Einbau', en: 'Overall view of the installation' },
        shown: ALL,
        required: ALL,
        criterion: 'firstOptic',
        points: 4,
        multiple: true,
        example: 'overview',
        hint: { de: 'Kofferraum / Ausbau im fertigen Zustand.', en: 'Trunk / build in its finished state.' },
        tip: { de: '', en: '' },
      },
    ],
  },

  // ------------------------------------------------- Handwerk & Akustik (Master)
  {
    step: 'craft',
    key: 'sec.craft.damping',
    title: { de: 'Dämmung & Türaufbau', en: 'Damping & door build-up' },
    intro: {
      de: 'Der Bauprozess Schicht für Schicht – hier holst du die Handwerkspunkte.',
      en: 'The build process layer by layer – this is where you earn the craftsmanship points.',
    },
    slots: [
      {
        key: 'craft.doorOuter',
        label: { de: 'Tür: Außenblech gedämmt', en: 'Door: outer skin damped' },
        shown: FROM_M,
        required: FROM_M,
        criterion: 'craftsmanship',
        points: 5,
        multiple: true,
        example: 'damping',
        hint: { de: 'Bitumen/Alubutyl auf dem Außenblech.', en: 'Bitumen/alubutyl on the outer skin.' },
        tip: {
          de: 'Ohne Zwischenschritt-Foto sieht der Juror am Ende nur eine verkleidete Tür.',
          en: 'Without intermediate photos the judge only ever sees a trimmed door.',
        },
      },
      {
        key: 'craft.doorInner',
        label: { de: 'Tür: Innenblech / Schallwand', en: 'Door: inner skin / baffle' },
        shown: FROM_M,
        required: FROM_M,
        criterion: 'craftsmanship',
        points: 5,
        multiple: true,
        example: 'damping',
        hint: {
          de: 'Verschlossenes Innenblech, Kabeldurchführungen abgedichtet.',
          en: 'Sealed inner skin, cable pass-throughs made airtight.',
        },
        tip: { de: '', en: '' },
      },
      {
        key: 'craft.doorTrim',
        label: { de: 'Tür: Verkleidung (TVK)', en: 'Door: trim panel' },
        shown: FROM_M,
        required: NONE,
        criterion: 'craftsmanship',
        points: 3,
        multiple: true,
        example: 'damping',
        hint: { de: 'Entdröhnte Türverkleidung von innen.', en: 'Deadened door trim seen from the inside.' },
        tip: { de: '', en: '' },
      },
      {
        key: 'craft.floor',
        label: { de: 'Boden / Kofferraum gedämmt', en: 'Floor / trunk damped' },
        shown: FROM_M,
        required: NONE,
        criterion: 'craftsmanship',
        points: 3,
        multiple: true,
        example: 'damping',
        hint: { de: '', en: '' },
        tip: { de: '', en: '' },
      },
    ],
  },
  {
    step: 'craft',
    key: 'sec.craft.custom',
    title: { de: 'Custom-Parts & Messung', en: 'Custom parts & measurement' },
    intro: {
      de: 'Alles, was du selbst gebaut oder gemessen hast.',
      en: 'Everything you built or measured yourself.',
    },
    slots: [
      {
        key: 'craft.customParts',
        label: { de: '3D-Druck / GFK / Custom-Teile', en: '3D printing / fibreglass / custom parts' },
        shown: FROM_M,
        required: NONE,
        criterion: 'craftsmanship',
        points: 5,
        multiple: true,
        example: 'custom',
        hint: {
          de: 'CAD-Screenshot, Rohteil, fertig verbautes Teil.',
          en: 'CAD screenshot, raw part, finished installed part.',
        },
        tip: {
          de: 'Der Dreiklang CAD → Druck → Einbau ist die stärkste Story in jeder Mappe.',
          en: 'The trio CAD → print → installation is the strongest story in any build log.',
        },
      },
      {
        key: 'craft.baffles',
        label: { de: 'Adapterringe / Schallwände', en: 'Adapter rings / baffles' },
        shown: FROM_M,
        required: NONE,
        criterion: 'craftsmanship',
        points: 4,
        multiple: true,
        example: 'custom',
        hint: { de: '', en: '' },
        tip: { de: '', en: '' },
      },
      {
        key: 'craft.measurement',
        label: { de: 'Messung (REW o. ä.)', en: 'Measurement (REW or similar)' },
        shown: FROM_M,
        required: NONE,
        criterion: 'explanation',
        points: 5,
        multiple: true,
        example: 'measurement',
        hint: {
          de: 'Screenshot des Frequenzgangs, gerne vorher/nachher – Material für deinen Vortrag.',
          en: 'Screenshot of the frequency response, ideally before/after – material for your talk.',
        },
        tip: {
          de: 'Kein Kriterium der Matrix bewertet die Messung selbst – sie zahlt sich beim Vortrag aus und landet dafür im Leitfaden. Screenshot vom Handy abfotografieren geht auch, Hauptsache die Achsenbeschriftung ist lesbar.',
          en: 'No matrix criterion scores the measurement itself – it pays off during your talk and feeds the outline. Photographing the screen works too, as long as the axis labels are readable.',
        },
      },
      {
        key: 'craft.finish',
        label: { de: 'Finish / Endergebnis', en: 'Finish / final result' },
        shown: FROM_M,
        required: NONE,
        criterion: 'designTrunk',
        points: 3,
        multiple: true,
        example: 'overview',
        hint: { de: '', en: '' },
        tip: { de: '', en: '' },
      },
    ],
  },
]

import { MODES } from './schema.js'

/**
 * Ein Slot ist sichtbar, wenn er in dieser Kategorie überhaupt vorkommt.
 * Quick Rescue reduziert zusätzlich auf das, was Pflicht ist – der Modus ist
 * damit reiner Umfangsfilter, die Anforderung kommt aus der Kategorie.
 */
export function isSlotVisible(slot, column, mode) {
  if (!column) return true
  if (!slot.shown.includes(column)) return false
  if (mode === MODES.QUICK) return slot.required.includes(column)
  return true
}

export function isSlotRequired(slot, column) {
  return Boolean(column) && slot.required.includes(column)
}

export function sectionsForStep(step, column, mode) {
  return SECTIONS.filter((s) => s.step === step)
    .map((s) => ({ ...s, slots: s.slots.filter((slot) => isSlotVisible(slot, column, mode)) }))
    .filter((s) => s.slots.length)
}

export function allSlots(column, mode) {
  return SECTIONS.flatMap((s) =>
    s.slots.filter((slot) => isSlotVisible(slot, column, mode)).map((slot) => ({ ...slot, section: s })),
  )
}

export function requiredSlots(column) {
  return SECTIONS.flatMap((s) =>
    s.slots.filter((slot) => isSlotRequired(slot, column)).map((slot) => ({ ...slot, section: s })),
  )
}

/** Alle Slots, die auf ein bestimmtes Matrix-Kriterium einzahlen. */
export function slotsForCriterion(criterionId, column) {
  return SECTIONS.flatMap((s) =>
    s.slots
      .filter((slot) => slot.criterion === criterionId && slot.shown.includes(column))
      .map((slot) => ({ ...slot, section: s })),
  )
}

export function findSlot(key) {
  for (const section of SECTIONS) {
    const slot = section.slots.find((s) => s.key === key)
    if (slot) return { ...slot, section }
  }
  return null
}
