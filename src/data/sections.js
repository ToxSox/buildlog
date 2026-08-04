import { MODES } from './schema.js'

const BOTH = [MODES.QUICK, MODES.MASTER]
const MASTER_ONLY = [MODES.MASTER]

/**
 * Manifest aller Foto-Slots.
 *
 * Diese Datei ist die einzige Quelle der Wahrheit für
 *  – die Upload-Felder im Wizard,
 *  – den Fortschritts-/Punktestand,
 *  – die "Fehlt noch"-Warnungen,
 *  – und das Layout des DIN-A4-Ausdrucks.
 *
 * required : in welchen Modi das Foto Pflicht ist
 * shown    : in welchen Modi das Feld überhaupt auftaucht
 * points   : Gewicht für den Fortschrittsbalken
 * example  : Schlüssel der Ghost-Overlay-Illustration (siehe examples.js)
 */
export const SECTIONS = [
  // ------------------------------------------------------------- Fahrzeug
  {
    step: 'vehicle',
    key: 'sec.vehicle',
    title: 'Fahrzeug & Teilnehmer',
    intro: 'Damit der Richter die Mappe eindeutig deinem Auto zuordnen kann.',
    slots: [
      {
        key: 'vehicle.exterior',
        label: 'Fahrzeug Außenansicht',
        shown: BOTH,
        required: BOTH,
        points: 4,
        multiple: true,
        example: 'vehicle',
        hint: 'Dreiviertel-Ansicht, Kennzeichen lesbar oder bewusst abgeklebt.',
        tip: 'Ein Bild vom kompletten Auto ist die Titelseite deiner Mappe – ohne das wirkt die Doku anonym.',
      },
      {
        key: 'vehicle.interior',
        label: 'Innenraum / Hörplatz',
        shown: BOTH,
        required: MASTER_ONLY,
        points: 3,
        multiple: true,
        example: 'interior',
        hint: 'Blick vom Fahrersitz Richtung Armaturenbrett.',
        tip: 'Zeigt dem Richter die Einbaulage der Hochtöner und den Hörplatz.',
      },
    ],
  },

  // -------------------------------------------------------- Strom & Sicherheit
  {
    step: 'power',
    key: 'sec.power.battery',
    title: 'Batterie & Hauptsicherung',
    intro: 'Der wichtigste Sicherheitsblock – hier wird am häufigsten Punktabzug verteilt.',
    slots: [
      {
        key: 'power.battery',
        label: 'Batterie & Befestigung',
        shown: BOTH,
        required: BOTH,
        points: 6,
        multiple: true,
        example: 'battery',
        hint: 'Batterie im eingebauten Zustand inkl. Niederhalter/Halterung.',
        tip: 'Eine lose Batterie ist ein sofortiger Sicherheitsmangel. Zeige die Verschraubung im Bild.',
      },
      {
        key: 'power.mainFuse',
        label: 'Hauptsicherung mit Maßstab',
        shown: BOTH,
        required: BOTH,
        points: 10,
        multiple: true,
        example: 'fuseRuler',
        hint: 'Sicherung + Zollstock/Maßband bis zum Batterie-Pluspol im selben Bild.',
        tip: 'Richter können keine Entfernungen raten. Lege einen Zollstock ins Bild und fotografiere so, dass Sicherung UND Batteriepol sichtbar sind. Die Sicherung muss innerhalb von 40 cm zum Pol und/oder vor der ersten Blechdurchführung sitzen – sonst gibt es 0 von 10 Punkten.',
      },
      {
        key: 'power.secondBattery',
        label: 'Zweitbatterie / Powercap',
        shown: BOTH,
        required: [],
        points: 3,
        multiple: true,
        example: 'battery',
        hint: 'Nur nötig, wenn verbaut – inkl. eigener Absicherung.',
        tip: 'Jede zusätzliche Stromquelle braucht eine eigene Sicherung innerhalb von 40 cm.',
      },
    ],
  },
  {
    step: 'power',
    key: 'sec.power.cabling',
    title: 'Kabelverlegung & Schutz',
    intro: 'Jede Blechdurchführung und jede Klemmstelle will belegt sein.',
    slots: [
      {
        key: 'power.routing',
        label: 'Kabelverlegung Motorraum',
        shown: BOTH,
        required: BOTH,
        points: 6,
        multiple: true,
        example: 'routing',
        hint: 'Verlauf des Pluskabels von der Batterie bis zur Spritzwand.',
        tip: 'Kabel dürfen nicht auf scharfen Kanten oder heißen Teilen (Krümmer) aufliegen.',
      },
      {
        key: 'power.grommet',
        label: 'Blechdurchführung / Gummitülle',
        shown: BOTH,
        required: BOTH,
        points: 8,
        multiple: true,
        example: 'grommet',
        hint: 'Nahaufnahme der Durchführung durch die Spritzwand.',
        tip: 'Kabel durch Blech müssen durch Tüllen oder Gummis geschützt sein, mechanisch belastete Kabel (Türdurchführung, Nähe Keilriemen) brauchen einen Schutzschlauch. Pro ungeschütztem Kabel wird 1 Punkt abgezogen.',
      },
      {
        key: 'power.terminals',
        label: 'Terminierung / Crimpungen',
        shown: BOTH,
        required: BOTH,
        points: 8,
        multiple: true,
        example: 'crimp',
        hint: 'Kabelschuhe, Crimpungen, Schrumpfschlauch – am besten offen und montiert.',
        tip: 'Das Regelwerk lässt für "Cables properly terminated / secured" und "Cable terminations protected" ausdrücklich den Foto-Log als Nachweis zu – ohne Bild bleibt nur die Sichtprüfung. Ein Bild "offen gecrimpt" + "fertig geschrumpft" wirkt Wunder.',
      },
      {
        key: 'power.underCarpet',
        label: 'Terminierung unter dem Teppich',
        shown: MASTER_ONLY,
        required: MASTER_ONLY,
        points: 6,
        multiple: true,
        example: 'crimp',
        hint: 'Verbindungen, die im fertigen Zustand nicht mehr sichtbar sind.',
        tip: 'Ab Kategorie SQ M verlangt das Regelwerk ausdrücklich einen Foto-Log nicht zugänglicher Verbindungen und Komponenten – pro fehlendem Element 1 Punkt Abzug.',
      },
      {
        key: 'power.distribution',
        label: 'Verteiler & Sicherungshalter',
        shown: BOTH,
        required: BOTH,
        points: 6,
        multiple: true,
        example: 'distribution',
        hint: 'Verteilerblock mit allen Abgängen und deren Absicherung.',
        tip: 'Jeder Abgang mit kleinerem Querschnitt braucht eine eigene Sicherung.',
      },
      {
        key: 'power.ground',
        label: 'Massepunkt',
        shown: BOTH,
        required: BOTH,
        points: 8,
        multiple: true,
        example: 'ground',
        hint: 'Blank geschliffene Stelle, Schraube, Kabelschuh.',
        tip: 'Zeige das blank geschliffene Blech. Kurze Masse im gleichen Querschnitt wie Plus ist gute Praxis – das Regelwerk schreibt dafür allerdings keinen Wert vor.',
      },
    ],
  },

  // ------------------------------------------------------------- Hardware
  {
    step: 'hardware',
    key: 'sec.hardware.mount',
    title: 'Hardware-Montage',
    intro: 'Jede Komponente muss sicher und nachvollziehbar befestigt sein.',
    slots: [
      {
        key: 'hardware.amps',
        label: 'Endstufen inkl. Verschraubung',
        shown: BOTH,
        required: BOTH,
        points: 7,
        multiple: true,
        example: 'mount',
        hint: 'Einbaulage + Nahaufnahme der Befestigungspunkte.',
        tip: 'Die Richter prüfen jede Komponente per Handprobe auf festen Sitz (2 Punkte Abzug pro loser Komponente). Zeige Schrauben oder Gewindeeinsätze.',
      },
      {
        key: 'hardware.dsp',
        label: 'DSP / Signalprozessor',
        shown: BOTH,
        required: BOTH,
        points: 5,
        multiple: true,
        example: 'mount',
        hint: 'Gerät im eingebauten Zustand, Anschlüsse erkennbar.',
        tip: 'Wenn der DSP versteckt sitzt, ist dieses Foto der einzige Beweis für saubere Arbeit.',
      },
      {
        key: 'hardware.speakersFront',
        label: 'Lautsprecher vorne',
        shown: BOTH,
        required: BOTH,
        points: 6,
        multiple: true,
        example: 'speaker',
        hint: 'Tief-/Mitteltöner und Hochtöner in Einbaulage.',
        tip: 'Adapterringe und Verschraubung mitfotografieren. Denk an das Kriterium "Protection of Speakers": Lautsprecher in Fronttüren und Fußraum brauchen einen starren Schutz, wenn man die Membran mit einem 3-cm-Zylinder berühren kann.',
      },
      {
        key: 'hardware.speakersRear',
        label: 'Lautsprecher hinten',
        shown: BOTH,
        required: [],
        points: 2,
        multiple: true,
        example: 'speaker',
        hint: 'Nur wenn verbaut.',
        tip: '',
      },
      {
        key: 'hardware.sub',
        label: 'Subwoofer & Gehäuse',
        shown: BOTH,
        required: BOTH,
        points: 6,
        multiple: true,
        example: 'sub',
        hint: 'Gehäuse inkl. Befestigung im Fahrzeug.',
        tip: 'Ein ungesichertes Gehäuse ist ein Sicherheitsmangel – zeige Spanngurte, Winkel oder Verschraubung.',
      },
      {
        key: 'hardware.signalRouting',
        label: 'Signalkabel-Verlegung (Cinch)',
        shown: MASTER_ONLY,
        required: MASTER_ONLY,
        points: 5,
        multiple: true,
        example: 'routing',
        hint: 'Trennung von Strom- und Signalkabeln sichtbar machen.',
        tip: 'Getrennte Verlegung von Strom und Signal ist gute Praxis und zahlt in den Craftsmanship-Block (Kabelführung) ein. Eine eigene Regel dafür gibt es im Rulebook nicht.',
      },
      {
        key: 'hardware.overview',
        label: 'Gesamtansicht Einbau',
        shown: BOTH,
        required: BOTH,
        points: 4,
        multiple: true,
        example: 'overview',
        hint: 'Kofferraum / Ausbau im fertigen Zustand.',
        tip: '',
      },
    ],
  },

  // ------------------------------------------------- Handwerk & Akustik (Master)
  {
    step: 'craft',
    key: 'sec.craft.damping',
    title: 'Dämmung & Türaufbau',
    intro: 'Der Bauprozess Schicht für Schicht – hier holst du die Handwerkspunkte.',
    slots: [
      {
        key: 'craft.doorOuter',
        label: 'Tür: Außenblech gedämmt',
        shown: MASTER_ONLY,
        required: MASTER_ONLY,
        points: 5,
        multiple: true,
        example: 'damping',
        hint: 'Bitumen/Alubutyl auf dem Außenblech.',
        tip: 'Ohne Zwischenschritt-Foto sieht der Richter am Ende nur eine verkleidete Tür.',
      },
      {
        key: 'craft.doorInner',
        label: 'Tür: Innenblech / Schallwand',
        shown: MASTER_ONLY,
        required: MASTER_ONLY,
        points: 5,
        multiple: true,
        example: 'damping',
        hint: 'Verschlossenes Innenblech, Kabeldurchführungen abgedichtet.',
        tip: '',
      },
      {
        key: 'craft.doorTrim',
        label: 'Tür: Verkleidung (TVK)',
        shown: MASTER_ONLY,
        required: [],
        points: 3,
        multiple: true,
        example: 'damping',
        hint: 'Entdröhnte Türverkleidung von innen.',
        tip: '',
      },
      {
        key: 'craft.floor',
        label: 'Boden / Kofferraum gedämmt',
        shown: MASTER_ONLY,
        required: [],
        points: 3,
        multiple: true,
        example: 'damping',
        hint: '',
        tip: '',
      },
    ],
  },
  {
    step: 'craft',
    key: 'sec.craft.custom',
    title: 'Custom-Parts & Messung',
    intro: 'Alles, was du selbst gebaut oder gemessen hast.',
    slots: [
      {
        key: 'craft.customParts',
        label: '3D-Druck / GFK / Custom-Teile',
        shown: MASTER_ONLY,
        required: [],
        points: 5,
        multiple: true,
        example: 'custom',
        hint: 'CAD-Screenshot, Rohteil, fertig verbautes Teil.',
        tip: 'Der Dreiklang CAD → Druck → Einbau ist die stärkste Story in jeder Mappe.',
      },
      {
        key: 'craft.baffles',
        label: 'Adapterringe / Schallwände',
        shown: MASTER_ONLY,
        required: [],
        points: 4,
        multiple: true,
        example: 'custom',
        hint: '',
        tip: '',
      },
      {
        key: 'craft.measurement',
        label: 'Messung (REW o. ä.)',
        shown: MASTER_ONLY,
        required: MASTER_ONLY,
        points: 5,
        multiple: true,
        example: 'measurement',
        hint: 'Screenshot des Frequenzgangs, gerne vorher/nachher.',
        tip: 'Screenshot vom Handy abfotografieren geht auch – Hauptsache Achsenbeschriftung lesbar.',
      },
      {
        key: 'craft.finish',
        label: 'Finish / Endergebnis',
        shown: MASTER_ONLY,
        required: [],
        points: 3,
        multiple: true,
        example: 'overview',
        hint: '',
        tip: '',
      },
    ],
  },
]

export function sectionsForStep(step, mode) {
  return SECTIONS.filter((s) => s.step === step)
    .map((s) => ({ ...s, slots: s.slots.filter((slot) => !mode || slot.shown.includes(mode)) }))
    .filter((s) => s.slots.length)
}

export function allSlots(mode) {
  return SECTIONS.flatMap((s) =>
    s.slots.filter((slot) => !mode || slot.shown.includes(mode)).map((slot) => ({ ...slot, section: s })),
  )
}

export function requiredSlots(mode) {
  return allSlots(mode).filter((slot) => slot.required.includes(mode))
}

export function findSlot(key) {
  for (const section of SECTIONS) {
    const slot = section.slots.find((s) => s.key === key)
    if (slot) return { ...slot, section }
  }
  return null
}
