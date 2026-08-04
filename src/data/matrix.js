/**
 * Installation Matrix
 * ===================
 * Abgetippt aus dem EMMA competition manual, edition 2026, Kapitel 10
 * („Judging Matrix“ – Installation Matrix) und den Kriterienlisten in Kapitel 3.
 *
 * Maximalpunkte je Kategorie: E 69 · S 115 · M 161 · X 231 · X Unlimited 325.
 * Die Summen werden in tests/matrix.test.mjs gegengerechnet.
 *
 * `assess` steuert, wie die App ein Kriterium bewertet:
 *   'auto'  – die App leitet das Ergebnis aus den Eingaben/Fotos ab
 *   'self'  – der Teilnehmer schätzt sich selbst ein (Ja / teilweise / Nein)
 */

/** Interne Kategorie-Schlüssel – Spalten der Matrix. */
export const MATRIX_COLUMNS = ['E', 'S', 'M', 'X', 'XUNL']

export const COLUMN_LABELS = {
  E: 'SQ E – Entry',
  S: 'SQ S – Skilled',
  M: 'SQ M – Master',
  X: 'SQ X – Expert Limited',
  XUNL: 'SQ X – Expert Unlimited',
}

/**
 * Zuordnung der EMMA-Klassen auf die Matrix-Spalte, nach der bewertet wird.
 * ESPL/ESQL/Tuning nutzen eigene, an S bzw. X angelehnte Kriterienlisten –
 * für die Dokumentationsplanung ist die Zuordnung unten die brauchbare Näherung.
 */
export const CLASS_TO_COLUMN = {
  'esql-inside': 'E',
  'sq-e': 'E',
  'sq-s': 'S',
  'sq-m': 'M',
  'sq-x-limited': 'X',
  'sq-x-unlimited': 'XUNL',
  mm: 'M',
  'espl-trunk': 'S',
  'espl-br': 'S',
  'espl-wall': 'S',
  'espl-expert': 'X',
  'esql-limited': 'S',
  'esql-unlimited': 'X',
  'tuning-stock': 'S',
  'tuning-custom-trunk': 'X',
  'tuning-custom-unlimited': 'XUNL',
}

const P = (E, S, M, X, XUNL) => ({ E, S, M, X, XUNL })

export const CRITERIA = [
  {
    id: 'presentation',
    label: { de: 'Präsentation gegenüber dem Publikum', en: 'Presentation to the public' },
    points: P(10, 10, 10, 10, 10),
    assess: 'self',
    help: {
      de: 'Fahrzeug und Anlage während der Eventzeit zeigen, Zuhören ermöglichen. Wird mehrfach täglich geprüft.',
      en: 'Show off the vehicle and installation during event time, allow spectators to listen. Checked several times a day.',
    },
  },
  {
    id: 'presentationBonus',
    label: { de: 'Bonus: Präsentation im dedizierten Zeitfenster', en: 'Bonus presentation to the public' },
    points: P(0, 0, 5, 5, 5),
    assess: 'self',
    help: {
      de: 'Zusätzliche Punkte für die Präsentation während des dafür vorgesehenen Zeitraums.',
      en: 'Extra points for presenting during the dedicated period.',
    },
  },
  {
    id: 'cleanliness',
    label: { de: 'Sauberkeit', en: 'Cleanliness' },
    points: P(6, 6, 6, 6, 6),
    assess: 'self',
    help: {
      de: 'Außen waschanlagensauber, Innenraum gesaugt, Komponenten in Motorraum und Kofferraum sauber. 2 Punkte Abzug je Bereich.',
      en: 'Exterior car-wash-clean, interior vacuumed, components in engine bay and trunk clean. Deduct 2 points per area.',
    },
  },
  {
    id: 'diagram',
    label: { de: 'System-/Verkabelungsdiagramm vorhanden', en: 'System / wiring diagram present' },
    points: P(4, 4, 0, 0, 0),
    assess: 'auto',
    help: {
      de: '2 Punkte je vorhandenem Diagramm. Die App erzeugt beide automatisch aus deinem Systemaufbau.',
      en: '2 points per diagram present. The app generates both automatically from your system setup.',
    },
  },
  {
    id: 'sysDoc',
    label: { de: 'Systemdokumentation', en: 'System documentation' },
    points: P(0, 0, 10, 10, 10),
    assess: 'auto',
    help: {
      de: 'Signal-Flowchart, Kabel-/Sicherungsdiagramm und Foto-Log nicht zugänglicher Verbindungen. 1 Punkt Abzug je fehlendem Element.',
      en: 'Signal flow-chart, cable/fuse diagram and photo-log of not accessible connections. Deduct 1 point per missing element.',
    },
  },
  {
    id: 'explanation',
    label: { de: 'Erklärung der Anlage an die Richter', en: 'Explanation of system to the judges' },
    points: P(0, 0, 5, 10, 10),
    assess: 'self',
    help: {
      de: 'Bis zu 7 Minuten (X Unlimited: 15), vorgetragen vom Fahrzeughalter. Je 30 Sekunden Überzug 1 Punkt Abzug.',
      en: 'Up to 7 minutes (X Unlimited: 15), presented by the vehicle owner. 1 point deducted per 30 seconds over time.',
    },
  },
  {
    id: 'mainFuse',
    label: { de: 'Hauptsicherung vorhanden', en: 'Main fuse(s) present' },
    points: P(10, 10, 10, 10, 10),
    assess: 'auto',
    help: {
      de: 'Innerhalb von 40 cm zu jedem Pluspol und/oder vor jeder Blechdurchführung. Alles-oder-nichts-Kriterium.',
      en: 'Within 40 cm of any positive battery post and/or before passing any metal panel. All-or-nothing.',
    },
  },
  {
    id: 'allFused',
    label: { de: 'Alle Komponentenleitungen abgesichert', en: 'Are all cables to the components fused?' },
    points: P(0, 15, 15, 15, 15),
    assess: 'auto',
    help: {
      de: 'Jede Leitung zu jeder Komponente braucht eine Sicherung; alle zusammen müssen in drei Minuten auffindbar sein.',
      en: 'Every cable to every component needs a fuse; all of them must be visible within three minutes in total.',
    },
  },
  {
    id: 'fuseValue',
    label: { de: 'Sicherungswert passend zum Querschnitt', en: 'Is the fuse value appropriate to the cable circuit?' },
    points: P(0, 20, 20, 20, 20),
    assess: 'auto',
    help: {
      de: 'Nach der Fuse Size Matrix, auch für Verteiler und Busbars. 2 Punkte Abzug je unpassender Sicherung.',
      en: 'According to the Fuse Size Matrix, including distribution blocks and busbars. Deduct 2 points per inappropriate fuse.',
    },
  },
  {
    id: 'interiorCables',
    label: { de: 'Keine Kabel vom Fahrersitz aus sichtbar', en: 'Any interior cables visible?' },
    points: P(0, 5, 5, 5, 5),
    assess: 'self',
    help: {
      de: 'Geprüft vom Fahrersitz aus, bei geschlossenen und geöffneten Türen. 2 Punkte Abzug je sichtbarem Kabel.',
      en: 'Checked from the driver seat with doors closed and open. Deduct 2 points per visible cable.',
    },
  },
  {
    id: 'terminated',
    label: { de: 'Kabel sauber terminiert / gesichert', en: 'Cables properly terminated / secured?' },
    points: P(0, 0, 5, 5, 5),
    assess: 'auto',
    help: {
      de: 'Nachweis per Sichtprüfung ODER Foto-Log. 1 Punkt Abzug je unsauberer Stelle.',
      en: 'Proven by physical inspection OR photo log. Deduct 1 point per improperly terminated cable.',
    },
  },
  {
    id: 'terminationsProtected',
    label: { de: 'Terminierungen gegen Kurzschluss geschützt', en: 'Cable terminations protected' },
    points: P(0, 0, 10, 10, 10),
    assess: 'auto',
    help: {
      de: 'Im Fahrzustand nicht berührbar bzw. mit nicht leitendem Material abgedeckt, in Türen zusätzlich feuchtigkeitsgeschützt.',
      en: 'Not touchable in driving condition or covered with non-conductive material; moisture protection where exposed.',
    },
  },
  {
    id: 'cablesProtected',
    label: { de: 'Kabel gegen Beschädigung geschützt', en: 'Cables protected from damage' },
    points: P(0, 0, 5, 5, 5),
    assess: 'auto',
    help: {
      de: 'Tüllen an Blechdurchführungen, Schutzschlauch bei mechanischer Belastung oder Nähe zu beweglichen Teilen.',
      en: 'Grommets where cables pass metal, protective sleeving where mechanically stressed or near moving parts.',
    },
  },
  {
    id: 'mounted',
    label: { de: 'Alle Komponenten fest montiert', en: 'Are all components securely mounted?' },
    points: P(24, 24, 24, 24, 24),
    assess: 'auto',
    help: {
      de: 'Handprüfung von Headunit, Geräten, Endstufen und Lautsprechern. 2 Punkte Abzug je loser Komponente.',
      en: 'Physical inspection of head unit, devices, amplifiers and speakers. Deduct 2 points per unfixed component.',
    },
  },
  {
    id: 'speakerProtection',
    label: { de: 'Lautsprecherschutz', en: 'Protection of speakers' },
    points: P(5, 5, 5, 5, 0),
    assess: 'self',
    help: {
      de: 'Lautsprecher in Fronttüren und Fußraum brauchen starren Schutz, wenn die Membran mit einem 3-cm-Zylinder berührbar ist. In X Unlimited nicht gefordert.',
      en: 'Speakers in front doors and foot room need rigid protection if the membrane can be touched with a 3 cm cylinder. Not required in X Unlimited.',
    },
  },
  {
    id: 'normalUse',
    label: { de: 'Fahrzeug normal nutzbar', en: 'Does the vehicle allow a normal use?' },
    points: P(0, 6, 6, 6, 0),
    assess: 'self',
    help: {
      de: 'Fahrer und Beifahrer sitzen bequem, Bedienelemente frei erreichbar, Fußraum nicht kleiner als original.',
      en: 'Driver and passenger sit comfortably, controls unobstructed, foot room not smaller than OEM.',
    },
  },
  {
    id: 'firstOptic',
    label: { de: 'Erster optischer Eindruck', en: 'First optic impression' },
    points: P(10, 10, 10, 10, 10),
    assess: 'self',
    help: {
      de: '„Fertige Installation“ statt „im Bau“. 1 Punkt Abzug je unfertig wirkender Komponente.',
      en: '"Finished installation" rather than "under construction". Deduct 1 point per component looking unfinished.',
    },
  },
  {
    id: 'craftsmanship',
    label: { de: 'Handwerkliche Ausführung', en: 'Craftsmanship' },
    points: P(0, 0, 10, 50, 50),
    assess: 'self',
    help: {
      de: 'Kabelführung, Terminierungen, Einbau der Komponenten und Verkleidungen, Oberflächen, gleichmäßige Spaltmaße. 2 Punkte Abzug je Element ohne erkennbaren Aufwand.',
      en: 'Cable routing, terminations, component and panel installation, surface finishes, equal gaps. Deduct 2 points per element with no effort.',
    },
  },
  {
    id: 'designInterior',
    label: { de: 'Designidee Innenraum', en: 'Design of interior' },
    points: P(0, 0, 0, 5, 10),
    assess: 'self',
    help: {
      de: 'Alle im Innenraum verbauten Komponenten folgen einer erkennbaren Designidee.',
      en: 'Components installed in the interior follow a clear design idea.',
    },
  },
  {
    id: 'designTrunk',
    label: { de: 'Designidee Kofferraum', en: 'Design of trunk' },
    points: P(0, 0, 0, 5, 10),
    assess: 'self',
    help: {
      de: 'Alle im Kofferraum verbauten Komponenten folgen einer erkennbaren Designidee.',
      en: 'Components installed in the trunk follow a clear design idea.',
    },
  },
  {
    id: 'overallDesign',
    label: { de: 'Gesamtdesign des Fahrzeugs', en: 'Overall design of the vehicle' },
    points: P(0, 0, 0, 0, 10),
    assess: 'self',
    help: {
      de: 'Ein durchgängiges Designthema innen, außen und im Kofferraum – erkennbar als von Anfang an geplantes Projekt.',
      en: 'A design theme followed throughout the car — inside, outside and trunk — clearly planned as a project from the start.',
    },
  },
  {
    id: 'bonus',
    label: { de: 'Bonuspunkte', en: 'Bonus points' },
    points: P(0, 0, 0, 15, 100),
    assess: 'auto',
    help: {
      de: 'Bis zu 50 selbst eingereichte Anträge, je bis zu 3 Punkte (1 für die Idee, 1 bei durchschnittlicher, 2 bei guter Umsetzung). Muss mit der Präsentation eingereicht werden.',
      en: 'Up to 50 self-submitted requests, up to 3 points each (1 for the idea, 1 for average, 2 for good realisation). Must be submitted with the presentation.',
    },
  },
]

export const MAX_BONUS_REQUESTS = 50
export const BONUS_POINTS_PER_REQUEST = 3

export function columnForClass(classId) {
  return CLASS_TO_COLUMN[classId] || null
}

/** Kriterien, die in dieser Spalte überhaupt Punkte bringen. */
export function criteriaForColumn(column) {
  if (!column) return []
  return CRITERIA.filter((c) => (c.points[column] || 0) > 0)
}

export function maxPointsForColumn(column) {
  return criteriaForColumn(column).reduce((sum, c) => sum + c.points[column], 0)
}

export function findCriterion(id) {
  return CRITERIA.find((c) => c.id === id) || null
}
