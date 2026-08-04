import { translateInline } from '../i18n/index.js'

/**
 * "Ghost-Overlays": schematische Beispielbilder, die zeigen, WIE ein Foto
 * aufgebaut sein muss, damit der Richter es werten kann.
 * Bewusst als Inline-SVG – so bleibt die App ohne externe Assets lauffähig.
 */

/** Beschriftungen in den Schemazeichnungen. */
const SVG_LABELS = {
  '150 A': '150 A',
  'Achsen (Hz / dB) müssen lesbar sein': 'axes (Hz / dB) must be readable',
  'Alubutyl / Dämmmatte': 'alubutyl / damping mat',
  'Batterie': 'Battery',
  'CAD': 'CAD',
  'Chassis + Ring + Schrauben in einem Bild': 'driver + ring + screws in one shot',
  'Eingang links, abgesicherte Abgänge rechts': 'input left, fused branches right',
  'Gummitülle schützt das Kabel gegen die Blechkante': 'grommet protects the cable from the metal edge',
  'Halterung + verschraubte Klemmung im Bild': 'bracket and bolted clamp in frame',
  'Hauptsicherung': 'Main fuse',
  'Hochtöner links und rechts im selben Bild': 'tweeters left and right in one shot',
  'Karosserieblech': 'chassis metal',
  'Presshülse und Schrumpfschlauch erkennbar': 'ferrule and heat shrink recognisable',
  'Prozess in drei Bildern erzählen': 'tell the process in three photos',
  'Rohteil': 'raw part',
  'Spanngurte / Verschraubung deutlich sichtbar': 'straps / bolts clearly visible',
  'Verkleidung': 'trim panel',
  'Zollstock: Abstand nachweisbar &lt; 40 cm': 'folding rule: distance provably &lt; 40 cm',
  'blank geschliffener Bereich rund um die Schraube': 'bare sanded area around the bolt',
  'ganzer Kofferraum, gleichmäßiges Licht': 'whole trunk, even light',
  'jede Schicht einzeln fotografieren': 'photograph every layer separately',
  'komplettes Fahrzeug, schräg von vorne': 'complete vehicle, three-quarter front',
  'rot = Strom, blau = Signal, getrennt verlegt': 'red = power, blue = signal, routed separately',
  'verbaut': 'installed',
  'vier sichtbare Verschraubungspunkte': 'four visible mounting points',
}

const L = (de) => translateInline({ de, en: SVG_LABELS[de] ?? de })

const wrap = (inner) =>
  `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
     <rect width="320" height="200" rx="8" fill="#f8fafc"/>${inner}</svg>`

const label = (x, y, text, anchor = 'middle') =>
  `<text x="${x}" y="${y}" font-size="10" font-family="Inter, sans-serif" fill="#334155" text-anchor="${anchor}">${text}</text>`

export const EXAMPLES = {
  vehicle: {
    title: { de: 'Fahrzeug Außenansicht', en: 'Vehicle exterior' },
    caption: { de: 'Dreiviertel-Ansicht, komplettes Auto im Bild, gleichmäßiges Licht.', en: 'Three-quarter view, the whole car in frame, even light.' },
    tips: [
      { de: 'Kein angeschnittenes Fahrzeug – der Richter will es wiedererkennen.', en: 'Do not crop the vehicle – the judge wants to recognise it.' },
      { de: 'Kennzeichen entweder lesbar lassen oder bewusst abkleben.', en: 'Either leave the plate readable or cover it deliberately.' },
    ],
    svg: () => wrap(`
      <path d="M40 130 L60 100 L130 92 L190 100 L265 118 L272 138 L40 138 Z" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
      <path d="M70 104 L128 98 L128 118 L64 118 Z" fill="#e2e8f0" stroke="#94a3b8"/>
      <path d="M136 98 L185 104 L212 118 L136 118 Z" fill="#e2e8f0" stroke="#94a3b8"/>
      <circle cx="95" cy="140" r="16" fill="#334155"/><circle cx="95" cy="140" r="6" fill="#94a3b8"/>
      <circle cx="228" cy="140" r="16" fill="#334155"/><circle cx="228" cy="140" r="6" fill="#94a3b8"/>
      ${label(160, 175, L('komplettes Fahrzeug, schräg von vorne'))}
    `),
  },

  interior: {
    title: { de: 'Innenraum / Hörplatz', en: 'Interior / listening position' },
    caption: { de: 'Vom Fahrersitz Richtung Armaturenbrett – Einbaulage der Hochtöner sichtbar.', en: 'From the driver seat towards the dashboard – tweeter positions visible.' },
    tips: [{ de: 'Sitz in normaler Hörposition lassen.', en: 'Leave the seat in its normal listening position.' }, { de: 'A-Säulen komplett mit im Bild.', en: 'Include the A-pillars completely.' }],
    svg: () => wrap(`
      <rect x="30" y="60" width="260" height="90" rx="10" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="95" cy="110" r="26" fill="none" stroke="#64748b" stroke-width="4"/>
      <rect x="150" y="88" width="70" height="40" rx="4" fill="#cbd5e1" stroke="#64748b"/>
      <circle cx="52" cy="72" r="8" fill="#38bdf8" stroke="#0284c7"/>
      <circle cx="268" cy="72" r="8" fill="#38bdf8" stroke="#0284c7"/>
      ${label(160, 175, L('Hochtöner links und rechts im selben Bild'))}
    `),
  },

  battery: {
    title: { de: 'Batterie & Befestigung', en: 'Battery & mounting' },
    caption: { de: 'Batterie im eingebauten Zustand, Niederhalter/Halterung deutlich sichtbar.', en: 'Battery as installed, hold-down or bracket clearly visible.' },
    tips: [
      { de: 'Die Verschraubung muss erkennbar sein – eine lose Batterie kostet sofort Punkte.', en: 'The bolted fixing must be visible – a loose battery costs points immediately.' },
      { de: 'Polabdeckung mit fotografieren.', en: 'Photograph the terminal cover as well.' },
    ],
    svg: () => wrap(`
      <rect x="90" y="70" width="140" height="80" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <rect x="104" y="58" width="18" height="14" rx="3" fill="#ef4444"/>
      <rect x="198" y="58" width="18" height="14" rx="3" fill="#1e293b"/>
      <rect x="80" y="60" width="160" height="10" rx="3" fill="#94a3b8" stroke="#475569"/>
      <line x1="88" y1="60" x2="88" y2="150" stroke="#475569" stroke-width="4"/>
      <line x1="232" y1="60" x2="232" y2="150" stroke="#475569" stroke-width="4"/>
      ${label(160, 175, L('Halterung + verschraubte Klemmung im Bild'))}
    `),
  },

  fuseRuler: {
    title: { de: 'Hauptsicherung mit Maßstab', en: 'Main fuse with a ruler' },
    caption: { de: 'Zollstock vom Pluspol bis zur Sicherung – beides im selben Bild.', en: 'Folding rule from the positive post to the fuse – both in the same shot.' },
    tips: [
      { de: 'Richter können keine Entfernungen raten. Lege einen Zollstock ins Bild!', en: 'Judges cannot guess distances. Put a folding rule in the shot!' },
      { de: 'Sicherungswert muss auf dem Foto lesbar sein.', en: 'The fuse rating must be readable in the photo.' },
      { de: 'Regelwerk: innerhalb von 40 cm zum Pluspol und/oder vor der ersten Blechdurchführung.', en: 'Rulebook: within 40 cm of the positive post and/or before the first metal pass-through.' },
    ],
    svg: () => wrap(`
      <rect x="24" y="72" width="80" height="60" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <rect x="36" y="62" width="16" height="12" rx="3" fill="#ef4444"/>
      ${label(64, 148, L('Batterie'))}
      <path d="M50 62 C 110 30, 180 30, 226 66" stroke="#dc2626" stroke-width="5" fill="none"/>
      <rect x="220" y="66" width="66" height="40" rx="5" fill="#fecaca" stroke="#b91c1c" stroke-width="2"/>
      ${label(253, 92, L('150 A'))}
      ${label(253, 122, L('Hauptsicherung'))}
      <rect x="40" y="158" width="230" height="14" rx="3" fill="#fde68a" stroke="#b45309"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7]
        .map((i) => `<line x1="${40 + i * 29}" y1="158" x2="${40 + i * 29}" y2="172" stroke="#b45309"/>`)
        .join('')}
      ${label(155, 190, L('Zollstock: Abstand nachweisbar &lt; 40 cm'))}
    `),
  },

  routing: {
    title: { de: 'Kabelverlegung', en: 'Cable routing' },
    caption: { de: 'Verlauf der Leitung über eine größere Strecke, Befestigungspunkte sichtbar.', en: 'The cable run over a longer distance, fixing points visible.' },
    tips: [
      { de: 'Strom- und Signalkabel möglichst auf getrennten Fahrzeugseiten.', en: 'Route power and signal cables on opposite sides of the vehicle where possible.' },
      { de: 'Keine Auflage auf heißen oder beweglichen Teilen.', en: 'No contact with hot or moving parts.' },
    ],
    svg: () => wrap(`
      <rect x="24" y="40" width="272" height="120" rx="8" fill="#e2e8f0" stroke="#94a3b8"/>
      <path d="M40 70 H 150 Q 170 70 170 90 V 130 H 280" stroke="#dc2626" stroke-width="6" fill="none"/>
      <path d="M40 100 H 120 Q 140 100 140 120 V 145 H 280" stroke="#0ea5e9" stroke-width="4" fill="none"/>
      ${[70, 110, 210, 250].map((x) => `<rect x="${x}" y="62" width="8" height="16" rx="2" fill="#334155"/>`).join('')}
      ${label(160, 182, L('rot = Strom, blau = Signal, getrennt verlegt'))}
    `),
  },

  grommet: {
    title: { de: 'Blechdurchführung', en: 'Metal pass-through' },
    caption: { de: 'Nahaufnahme der Spritzwand-Durchführung mit Gummitülle.', en: 'Close-up of the firewall pass-through with its grommet.' },
    tips: [
      { de: 'Pro ungeschütztem Kabel zieht der Richter 1 Punkt ab (Kriterium "Cables protected from damage").', en: 'The judge deducts 1 point per unprotected cable (criterion "Cables protected from damage").' },
      { de: 'Ein Bild von beiden Seiten der Wand wirkt besonders überzeugend.', en: 'A shot from both sides of the panel is especially convincing.' },
    ],
    svg: () => wrap(`
      <rect x="24" y="30" width="272" height="140" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
      <ellipse cx="160" cy="100" rx="46" ry="34" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
      <ellipse cx="160" cy="100" rx="34" ry="24" fill="#1f2937"/>
      <ellipse cx="160" cy="100" rx="46" ry="34" fill="none" stroke="#111827" stroke-width="7" opacity="0.65"/>
      <path d="M20 100 H 126" stroke="#dc2626" stroke-width="8"/>
      <path d="M194 100 H 300" stroke="#dc2626" stroke-width="8"/>
      ${label(160, 182, L('Gummitülle schützt das Kabel gegen die Blechkante'))}
    `),
  },

  crimp: {
    title: { de: 'Terminierung / Crimpung', en: 'Termination / crimp' },
    caption: { de: 'Kabelschuh, Presshülse und Schrumpfschlauch aus der Nähe.', en: 'Cable lug, ferrule and heat shrink up close.' },
    tips: [
      { de: 'Der Foto-Log ist hier ein offiziell zugelassener Nachweis – nutze ihn für alles, was später verdeckt ist.', en: 'The photo log is an officially accepted proof here – use it for everything that ends up hidden.' },
      { de: 'Am besten zwei Bilder: offen gecrimpt und fertig geschrumpft.', en: 'Ideally two shots: crimped open and finished with heat shrink.' },
    ],
    svg: () => wrap(`
      <rect x="30" y="86" width="130" height="28" rx="6" fill="#dc2626"/>
      <rect x="150" y="80" width="60" height="40" rx="6" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      ${[162, 176, 190].map((x) => `<line x1="${x}" y1="80" x2="${x}" y2="120" stroke="#475569" stroke-width="3"/>`).join('')}
      <path d="M210 84 h44 a16 16 0 1 1 0 32 h-44 z" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
      <circle cx="256" cy="100" r="9" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
      ${label(160, 160, L('Presshülse und Schrumpfschlauch erkennbar'))}
    `),
  },

  distribution: {
    title: { de: 'Verteiler & Sicherungshalter', en: 'Distribution block & fuse holders' },
    caption: { de: 'Verteilerblock mit allen Abgängen, Sicherungswerte lesbar.', en: 'Distribution block with all branches, fuse ratings readable.' },
    tips: [
      { de: 'Jeder Abgang mit kleinerem Querschnitt braucht eine eigene Sicherung.', en: 'Every branch with a smaller cross-section needs its own fuse.' },
      { de: 'Die Fuse Size Matrix gilt ausdrücklich auch für Verteilerblöcke und Busbars.', en: 'The Fuse Size Matrix explicitly covers distribution blocks and busbars too.' },
    ],
    svg: () => wrap(`
      <rect x="110" y="55" width="100" height="90" rx="8" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <path d="M20 100 H 110" stroke="#dc2626" stroke-width="8"/>
      ${[72, 100, 128].map((y, i) => `<path d="M210 ${y} H 300" stroke="#dc2626" stroke-width="5"/>
        <rect x="228" y="${y - 10}" width="34" height="20" rx="3" fill="#fecaca" stroke="#b91c1c"/>
        ${label(245, y + 4, `${[60, 40, 30][i]}A`)}`).join('')}
      ${label(160, 175, L('Eingang links, abgesicherte Abgänge rechts'))}
    `),
  },

  ground: {
    title: { de: 'Massepunkt', en: 'Ground point' },
    caption: { de: 'Blank geschliffene Karosseriestelle, Kabelschuh verschraubt.', en: 'Bare sanded chassis spot, cable lug bolted down.' },
    tips: [
      { de: 'Das blanke Blech muss sichtbar sein.', en: 'The bare metal must be visible.' },
      { de: 'Kurze Masse im Plus-Querschnitt ist gute Praxis – im Rulebook steht dazu kein Wert.', en: 'A short ground in the positive cross-section is good practice – the rulebook gives no value for it.' },
    ],
    svg: () => wrap(`
      <rect x="24" y="40" width="272" height="120" rx="6" fill="#cbd5e1" stroke="#64748b"/>
      <circle cx="170" cy="100" r="40" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="5 4"/>
      <circle cx="170" cy="100" r="14" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <path d="M30 100 h 100" stroke="#0f172a" stroke-width="8"/>
      <path d="M130 88 h40 v24 h-40 z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      ${label(170, 160, L('blank geschliffener Bereich rund um die Schraube'))}
    `),
  },

  mount: {
    title: { de: 'Gerätebefestigung', en: 'Device mounting' },
    caption: { de: 'Endstufe/DSP inklusive der Schrauben, mit denen sie gehalten wird.', en: 'Amplifier or DSP including the screws holding it.' },
    tips: [{ de: 'Klettband gilt nicht als Befestigung.', en: 'Hook-and-loop tape does not count as mounting.' }, { de: 'Detailfoto einer Schraube macht es eindeutig.', en: 'A close-up of one screw makes it unambiguous.' }],
    svg: () => wrap(`
      <rect x="60" y="60" width="200" height="80" rx="8" fill="#334155"/>
      <rect x="76" y="76" width="168" height="48" rx="4" fill="#475569"/>
      ${[74, 246].flatMap((x) => [70, 130].map((y) => `<circle cx="${x}" cy="${y}" r="7" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>`)).join('')}
      ${label(160, 168, L('vier sichtbare Verschraubungspunkte'))}
    `),
  },

  speaker: {
    title: { de: 'Lautsprecher in Einbaulage', en: 'Speaker in its installed position' },
    caption: { de: 'Chassis auf dem Adapterring, Verschraubung sichtbar.', en: 'Driver on the adapter ring, fixings visible.' },
    tips: [{ de: 'Adapterring und Abdichtung mitfotografieren – das ist Handwerk.', en: 'Photograph the adapter ring and sealing too – that is craftsmanship.' }],
    svg: () => wrap(`
      <circle cx="160" cy="100" r="62" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>
      <circle cx="160" cy="100" r="48" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
      <circle cx="160" cy="100" r="20" fill="#334155"/>
      ${[0, 90, 180, 270]
        .map((deg) => {
          const r = (deg * Math.PI) / 180
          return `<circle cx="${(160 + Math.cos(r) * 55).toFixed(1)}" cy="${(100 + Math.sin(r) * 55).toFixed(1)}" r="6" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>`
        })
        .join('')}
      ${label(160, 182, L('Chassis + Ring + Schrauben in einem Bild'))}
    `),
  },

  sub: {
    title: { de: 'Subwoofer & Gehäuse', en: 'Subwoofer & enclosure' },
    caption: { de: 'Gehäuse im Fahrzeug, Befestigung gegen Verrutschen sichtbar.', en: 'Enclosure in the vehicle, securing against movement visible.' },
    tips: [{ de: 'Spanngurte, Winkel oder Verschraubung müssen erkennbar sein.', en: 'Straps, brackets or bolts must be recognisable.' }],
    svg: () => wrap(`
      <rect x="60" y="55" width="200" height="100" rx="6" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <circle cx="130" cy="105" r="34" fill="#334155" stroke="#0f172a" stroke-width="3"/>
      <circle cx="130" cy="105" r="12" fill="#64748b"/>
      <rect x="196" y="88" width="44" height="34" rx="4" fill="#1f2937"/>
      <path d="M60 75 H 260 M60 135 H 260" stroke="#0ea5e9" stroke-width="6"/>
      ${label(160, 176, L('Spanngurte / Verschraubung deutlich sichtbar'))}
    `),
  },

  overview: {
    title: { de: 'Gesamtansicht', en: 'Overall view' },
    caption: { de: 'Der fertige Ausbau als Übersicht, sauber ausgeleuchtet.', en: 'The finished build as an overview, cleanly lit.' },
    tips: [{ de: 'Aufgeräumt fotografieren – Werkzeug und Kabelreste raus aus dem Bild.', en: 'Shoot it tidy – get tools and cable offcuts out of the frame.' }],
    svg: () => wrap(`
      <rect x="24" y="45" width="272" height="110" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
      <rect x="46" y="70" width="80" height="60" rx="5" fill="#cbd5e1" stroke="#64748b"/>
      <rect x="140" y="82" width="60" height="48" rx="5" fill="#334155"/>
      <circle cx="248" cy="100" r="30" fill="#475569" stroke="#0f172a" stroke-width="2"/>
      ${label(160, 176, L('ganzer Kofferraum, gleichmäßiges Licht'))}
    `),
  },

  damping: {
    title: { de: 'Dämmung Schicht für Schicht', en: 'Damping layer by layer' },
    caption: { de: 'Zwischenschritt-Foto: Blech, Dämmmatte, Abdeckung.', en: 'Intermediate photo: metal, damping mat, cover.' },
    tips: [
      { de: 'Nur Zwischenschritte belegen die Arbeit – am Ende sieht man nur die Verkleidung.', en: 'Only intermediate steps prove the work – in the end all you see is the trim.' },
      { de: 'Anpressen/Anrollen der Matte lässt sich gut mit einem Detailfoto zeigen.', en: 'Rolling the mat down is easy to show with a close-up.' },
    ],
    svg: () => wrap(`
      <rect x="40" y="120" width="240" height="30" fill="#94a3b8" stroke="#475569"/>
      ${label(160, 140, L('Karosserieblech'))}
      <rect x="55" y="86" width="210" height="30" fill="#facc15" stroke="#a16207"/>
      ${label(160, 106, L('Alubutyl / Dämmmatte'))}
      <rect x="70" y="52" width="180" height="30" fill="#cbd5e1" stroke="#475569"/>
      ${label(160, 72, L('Verkleidung'))}
      ${label(160, 180, L('jede Schicht einzeln fotografieren'))}
    `),
  },

  custom: {
    title: { de: 'Custom-Part', en: 'Custom part' },
    caption: { de: 'CAD-Ansicht, Rohteil und verbautes Teil – am besten drei Bilder.', en: 'CAD view, raw part and installed part – ideally three photos.' },
    tips: [{ de: 'Der Dreiklang CAD → Fertigung → Einbau ist die stärkste Story in jeder Mappe.', en: 'The trio CAD → fabrication → installation is the strongest story in any build log.' }],
    svg: () => wrap(`
      <rect x="26" y="60" width="80" height="80" rx="6" fill="#ede9fe" stroke="#7c3aed"/>
      ${label(66, 105, L('CAD'))}
      <rect x="120" y="60" width="80" height="80" rx="6" fill="#fef3c7" stroke="#d97706"/>
      ${label(160, 105, L('Rohteil'))}
      <rect x="214" y="60" width="80" height="80" rx="6" fill="#dcfce7" stroke="#16a34a"/>
      ${label(254, 105, L('verbaut'))}
      <path d="M108 100 h10 M202 100 h10" stroke="#475569" stroke-width="3"/>
      ${label(160, 172, L('Prozess in drei Bildern erzählen'))}
    `),
  },

  measurement: {
    title: { de: 'Messung (REW)', en: 'Measurement (REW)' },
    caption: { de: 'Screenshot des Frequenzgangs mit lesbarer Achsenbeschriftung.', en: 'Screenshot of the frequency response with readable axis labels.' },
    tips: [{ de: 'Vorher/Nachher nebeneinander ist besonders aussagekräftig.', en: 'Before and after side by side is especially telling.' }],
    svg: () => wrap(`
      <rect x="30" y="35" width="260" height="120" rx="6" fill="#0f172a"/>
      <path d="M45 130 H 275 M45 130 V 48" stroke="#64748b" stroke-width="2"/>
      <path d="M50 100 C 90 60, 120 118, 150 92 S 220 76, 270 96" stroke="#38bdf8" stroke-width="3" fill="none"/>
      <text x="160" y="170" font-size="10" font-family="Inter, sans-serif" fill="#334155" text-anchor="middle">${L('Achsen (Hz / dB) müssen lesbar sein')}</text>
    `),
  },
}

export function exampleFor(key) {
  return EXAMPLES[key] || null
}
