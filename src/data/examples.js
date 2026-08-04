/**
 * "Ghost-Overlays": schematische Beispielbilder, die zeigen, WIE ein Foto
 * aufgebaut sein muss, damit der Richter es werten kann.
 * Bewusst als Inline-SVG – so bleibt die App ohne externe Assets lauffähig.
 */

const wrap = (inner) =>
  `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
     <rect width="320" height="200" rx="8" fill="#f8fafc"/>${inner}</svg>`

const label = (x, y, text, anchor = 'middle') =>
  `<text x="${x}" y="${y}" font-size="10" font-family="Inter, sans-serif" fill="#334155" text-anchor="${anchor}">${text}</text>`

export const EXAMPLES = {
  vehicle: {
    title: 'Fahrzeug Außenansicht',
    caption: 'Dreiviertel-Ansicht, komplettes Auto im Bild, gleichmäßiges Licht.',
    tips: [
      'Kein angeschnittenes Fahrzeug – der Richter will es wiedererkennen.',
      'Kennzeichen entweder lesbar lassen oder bewusst abkleben.',
    ],
    svg: wrap(`
      <path d="M40 130 L60 100 L130 92 L190 100 L265 118 L272 138 L40 138 Z" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
      <path d="M70 104 L128 98 L128 118 L64 118 Z" fill="#e2e8f0" stroke="#94a3b8"/>
      <path d="M136 98 L185 104 L212 118 L136 118 Z" fill="#e2e8f0" stroke="#94a3b8"/>
      <circle cx="95" cy="140" r="16" fill="#334155"/><circle cx="95" cy="140" r="6" fill="#94a3b8"/>
      <circle cx="228" cy="140" r="16" fill="#334155"/><circle cx="228" cy="140" r="6" fill="#94a3b8"/>
      ${label(160, 175, 'komplettes Fahrzeug, schräg von vorne')}
    `),
  },

  interior: {
    title: 'Innenraum / Hörplatz',
    caption: 'Vom Fahrersitz Richtung Armaturenbrett – Einbaulage der Hochtöner sichtbar.',
    tips: ['Sitz in normaler Hörposition lassen.', 'A-Säulen komplett mit im Bild.'],
    svg: wrap(`
      <rect x="30" y="60" width="260" height="90" rx="10" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="95" cy="110" r="26" fill="none" stroke="#64748b" stroke-width="4"/>
      <rect x="150" y="88" width="70" height="40" rx="4" fill="#cbd5e1" stroke="#64748b"/>
      <circle cx="52" cy="72" r="8" fill="#38bdf8" stroke="#0284c7"/>
      <circle cx="268" cy="72" r="8" fill="#38bdf8" stroke="#0284c7"/>
      ${label(160, 175, 'Hochtöner links und rechts im selben Bild')}
    `),
  },

  battery: {
    title: 'Batterie & Befestigung',
    caption: 'Batterie im eingebauten Zustand, Niederhalter/Halterung deutlich sichtbar.',
    tips: [
      'Die Verschraubung muss erkennbar sein – eine lose Batterie kostet sofort Punkte.',
      'Polabdeckung mit fotografieren.',
    ],
    svg: wrap(`
      <rect x="90" y="70" width="140" height="80" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <rect x="104" y="58" width="18" height="14" rx="3" fill="#ef4444"/>
      <rect x="198" y="58" width="18" height="14" rx="3" fill="#1e293b"/>
      <rect x="80" y="60" width="160" height="10" rx="3" fill="#94a3b8" stroke="#475569"/>
      <line x1="88" y1="60" x2="88" y2="150" stroke="#475569" stroke-width="4"/>
      <line x1="232" y1="60" x2="232" y2="150" stroke="#475569" stroke-width="4"/>
      ${label(160, 175, 'Halterung + verschraubte Klemmung im Bild')}
    `),
  },

  fuseRuler: {
    title: 'Hauptsicherung mit Maßstab',
    caption: 'Zollstock vom Pluspol bis zur Sicherung – beides im selben Bild.',
    tips: [
      'Richter können keine Entfernungen raten. Lege einen Zollstock ins Bild!',
      'Sicherungswert muss auf dem Foto lesbar sein.',
      'Regelwerk: innerhalb von 40 cm zum Pluspol und/oder vor der ersten Blechdurchführung.',
    ],
    svg: wrap(`
      <rect x="24" y="72" width="80" height="60" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <rect x="36" y="62" width="16" height="12" rx="3" fill="#ef4444"/>
      ${label(64, 148, 'Batterie')}
      <path d="M50 62 C 110 30, 180 30, 226 66" stroke="#dc2626" stroke-width="5" fill="none"/>
      <rect x="220" y="66" width="66" height="40" rx="5" fill="#fecaca" stroke="#b91c1c" stroke-width="2"/>
      ${label(253, 92, '150 A')}
      ${label(253, 122, 'Hauptsicherung')}
      <rect x="40" y="158" width="230" height="14" rx="3" fill="#fde68a" stroke="#b45309"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7]
        .map((i) => `<line x1="${40 + i * 29}" y1="158" x2="${40 + i * 29}" y2="172" stroke="#b45309"/>`)
        .join('')}
      ${label(155, 190, 'Zollstock: Abstand nachweisbar &lt; 40 cm')}
    `),
  },

  routing: {
    title: 'Kabelverlegung',
    caption: 'Verlauf der Leitung über eine größere Strecke, Befestigungspunkte sichtbar.',
    tips: [
      'Strom- und Signalkabel möglichst auf getrennten Fahrzeugseiten.',
      'Keine Auflage auf heißen oder beweglichen Teilen.',
    ],
    svg: wrap(`
      <rect x="24" y="40" width="272" height="120" rx="8" fill="#e2e8f0" stroke="#94a3b8"/>
      <path d="M40 70 H 150 Q 170 70 170 90 V 130 H 280" stroke="#dc2626" stroke-width="6" fill="none"/>
      <path d="M40 100 H 120 Q 140 100 140 120 V 145 H 280" stroke="#0ea5e9" stroke-width="4" fill="none"/>
      ${[70, 110, 210, 250].map((x) => `<rect x="${x}" y="62" width="8" height="16" rx="2" fill="#334155"/>`).join('')}
      ${label(160, 182, 'rot = Strom, blau = Signal, getrennt verlegt')}
    `),
  },

  grommet: {
    title: 'Blechdurchführung',
    caption: 'Nahaufnahme der Spritzwand-Durchführung mit Gummitülle.',
    tips: [
      'Pro ungeschütztem Kabel zieht der Richter 1 Punkt ab (Kriterium "Cables protected from damage").',
      'Ein Bild von beiden Seiten der Wand wirkt besonders überzeugend.',
    ],
    svg: wrap(`
      <rect x="24" y="30" width="272" height="140" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
      <ellipse cx="160" cy="100" rx="46" ry="34" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
      <ellipse cx="160" cy="100" rx="34" ry="24" fill="#1f2937"/>
      <ellipse cx="160" cy="100" rx="46" ry="34" fill="none" stroke="#111827" stroke-width="7" opacity="0.65"/>
      <path d="M20 100 H 126" stroke="#dc2626" stroke-width="8"/>
      <path d="M194 100 H 300" stroke="#dc2626" stroke-width="8"/>
      ${label(160, 182, 'Gummitülle schützt das Kabel gegen die Blechkante')}
    `),
  },

  crimp: {
    title: 'Terminierung / Crimpung',
    caption: 'Kabelschuh, Presshülse und Schrumpfschlauch aus der Nähe.',
    tips: [
      'Der Foto-Log ist hier ein offiziell zugelassener Nachweis – nutze ihn für alles, was später verdeckt ist.',
      'Am besten zwei Bilder: offen gecrimpt und fertig geschrumpft.',
    ],
    svg: wrap(`
      <rect x="30" y="86" width="130" height="28" rx="6" fill="#dc2626"/>
      <rect x="150" y="80" width="60" height="40" rx="6" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      ${[162, 176, 190].map((x) => `<line x1="${x}" y1="80" x2="${x}" y2="120" stroke="#475569" stroke-width="3"/>`).join('')}
      <path d="M210 84 h44 a16 16 0 1 1 0 32 h-44 z" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
      <circle cx="256" cy="100" r="9" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
      ${label(160, 160, 'Presshülse und Schrumpfschlauch erkennbar')}
    `),
  },

  distribution: {
    title: 'Verteiler & Sicherungshalter',
    caption: 'Verteilerblock mit allen Abgängen, Sicherungswerte lesbar.',
    tips: [
      'Jeder Abgang mit kleinerem Querschnitt braucht eine eigene Sicherung.',
      'Die Fuse Size Matrix gilt ausdrücklich auch für Verteilerblöcke und Busbars.',
    ],
    svg: wrap(`
      <rect x="110" y="55" width="100" height="90" rx="8" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <path d="M20 100 H 110" stroke="#dc2626" stroke-width="8"/>
      ${[72, 100, 128].map((y, i) => `<path d="M210 ${y} H 300" stroke="#dc2626" stroke-width="5"/>
        <rect x="228" y="${y - 10}" width="34" height="20" rx="3" fill="#fecaca" stroke="#b91c1c"/>
        ${label(245, y + 4, `${[60, 40, 30][i]}A`)}`).join('')}
      ${label(160, 175, 'Eingang links, abgesicherte Abgänge rechts')}
    `),
  },

  ground: {
    title: 'Massepunkt',
    caption: 'Blank geschliffene Karosseriestelle, Kabelschuh verschraubt.',
    tips: [
      'Das blanke Blech muss sichtbar sein.',
      'Kurze Masse im Plus-Querschnitt ist gute Praxis – im Rulebook steht dazu kein Wert.',
    ],
    svg: wrap(`
      <rect x="24" y="40" width="272" height="120" rx="6" fill="#cbd5e1" stroke="#64748b"/>
      <circle cx="170" cy="100" r="40" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="5 4"/>
      <circle cx="170" cy="100" r="14" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <path d="M30 100 h 100" stroke="#0f172a" stroke-width="8"/>
      <path d="M130 88 h40 v24 h-40 z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      ${label(170, 160, 'blank geschliffener Bereich rund um die Schraube')}
    `),
  },

  mount: {
    title: 'Gerätebefestigung',
    caption: 'Endstufe/DSP inklusive der Schrauben, mit denen sie gehalten wird.',
    tips: ['Klettband gilt nicht als Befestigung.', 'Detailfoto einer Schraube macht es eindeutig.'],
    svg: wrap(`
      <rect x="60" y="60" width="200" height="80" rx="8" fill="#334155"/>
      <rect x="76" y="76" width="168" height="48" rx="4" fill="#475569"/>
      ${[74, 246].flatMap((x) => [70, 130].map((y) => `<circle cx="${x}" cy="${y}" r="7" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>`)).join('')}
      ${label(160, 168, 'vier sichtbare Verschraubungspunkte')}
    `),
  },

  speaker: {
    title: 'Lautsprecher in Einbaulage',
    caption: 'Chassis auf dem Adapterring, Verschraubung sichtbar.',
    tips: ['Adapterring und Abdichtung mitfotografieren – das ist Handwerk.'],
    svg: wrap(`
      <circle cx="160" cy="100" r="62" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>
      <circle cx="160" cy="100" r="48" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
      <circle cx="160" cy="100" r="20" fill="#334155"/>
      ${[0, 90, 180, 270]
        .map((deg) => {
          const r = (deg * Math.PI) / 180
          return `<circle cx="${(160 + Math.cos(r) * 55).toFixed(1)}" cy="${(100 + Math.sin(r) * 55).toFixed(1)}" r="6" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>`
        })
        .join('')}
      ${label(160, 182, 'Chassis + Ring + Schrauben in einem Bild')}
    `),
  },

  sub: {
    title: 'Subwoofer & Gehäuse',
    caption: 'Gehäuse im Fahrzeug, Befestigung gegen Verrutschen sichtbar.',
    tips: ['Spanngurte, Winkel oder Verschraubung müssen erkennbar sein.'],
    svg: wrap(`
      <rect x="60" y="55" width="200" height="100" rx="6" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <circle cx="130" cy="105" r="34" fill="#334155" stroke="#0f172a" stroke-width="3"/>
      <circle cx="130" cy="105" r="12" fill="#64748b"/>
      <rect x="196" y="88" width="44" height="34" rx="4" fill="#1f2937"/>
      <path d="M60 75 H 260 M60 135 H 260" stroke="#0ea5e9" stroke-width="6"/>
      ${label(160, 176, 'Spanngurte / Verschraubung deutlich sichtbar')}
    `),
  },

  overview: {
    title: 'Gesamtansicht',
    caption: 'Der fertige Ausbau als Übersicht, sauber ausgeleuchtet.',
    tips: ['Aufgeräumt fotografieren – Werkzeug und Kabelreste raus aus dem Bild.'],
    svg: wrap(`
      <rect x="24" y="45" width="272" height="110" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
      <rect x="46" y="70" width="80" height="60" rx="5" fill="#cbd5e1" stroke="#64748b"/>
      <rect x="140" y="82" width="60" height="48" rx="5" fill="#334155"/>
      <circle cx="248" cy="100" r="30" fill="#475569" stroke="#0f172a" stroke-width="2"/>
      ${label(160, 176, 'ganzer Kofferraum, gleichmäßiges Licht')}
    `),
  },

  damping: {
    title: 'Dämmung Schicht für Schicht',
    caption: 'Zwischenschritt-Foto: Blech, Dämmmatte, Abdeckung.',
    tips: [
      'Nur Zwischenschritte belegen die Arbeit – am Ende sieht man nur die Verkleidung.',
      'Anpressen/Anrollen der Matte lässt sich gut mit einem Detailfoto zeigen.',
    ],
    svg: wrap(`
      <rect x="40" y="120" width="240" height="30" fill="#94a3b8" stroke="#475569"/>
      ${label(160, 140, 'Karosserieblech')}
      <rect x="55" y="86" width="210" height="30" fill="#facc15" stroke="#a16207"/>
      ${label(160, 106, 'Alubutyl / Dämmmatte')}
      <rect x="70" y="52" width="180" height="30" fill="#cbd5e1" stroke="#475569"/>
      ${label(160, 72, 'Verkleidung')}
      ${label(160, 180, 'jede Schicht einzeln fotografieren')}
    `),
  },

  custom: {
    title: 'Custom-Part',
    caption: 'CAD-Ansicht, Rohteil und verbautes Teil – am besten drei Bilder.',
    tips: ['Der Dreiklang CAD → Fertigung → Einbau ist die stärkste Story in jeder Mappe.'],
    svg: wrap(`
      <rect x="26" y="60" width="80" height="80" rx="6" fill="#ede9fe" stroke="#7c3aed"/>
      ${label(66, 105, 'CAD')}
      <rect x="120" y="60" width="80" height="80" rx="6" fill="#fef3c7" stroke="#d97706"/>
      ${label(160, 105, 'Rohteil')}
      <rect x="214" y="60" width="80" height="80" rx="6" fill="#dcfce7" stroke="#16a34a"/>
      ${label(254, 105, 'verbaut')}
      <path d="M108 100 h10 M202 100 h10" stroke="#475569" stroke-width="3"/>
      ${label(160, 172, 'Prozess in drei Bildern erzählen')}
    `),
  },

  measurement: {
    title: 'Messung (REW)',
    caption: 'Screenshot des Frequenzgangs mit lesbarer Achsenbeschriftung.',
    tips: ['Vorher/Nachher nebeneinander ist besonders aussagekräftig.'],
    svg: wrap(`
      <rect x="30" y="35" width="260" height="120" rx="6" fill="#0f172a"/>
      <path d="M45 130 H 275 M45 130 V 48" stroke="#64748b" stroke-width="2"/>
      <path d="M50 100 C 90 60, 120 118, 150 92 S 220 76, 270 96" stroke="#38bdf8" stroke-width="3" fill="none"/>
      <text x="160" y="170" font-size="10" font-family="Inter, sans-serif" fill="#334155" text-anchor="middle">
        Achsen (Hz / dB) müssen lesbar sein
      </text>
    `),
  },
}

export function exampleFor(key) {
  return EXAMPLES[key] || null
}
