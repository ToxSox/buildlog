# EMMA Build Log Creator

Geführter Assistent zur Erstellung von Car-HiFi-Einbaudokumentationen („Build Logs“)
nach EMMA-Regelwerk. Die App läuft **zu 100 % clientseitig**: kein Backend, kein Konto,
keine Uploads. Alle Daten bleiben im Browser des Nutzers und lassen sich als ZIP
sichern. Am Ende steht ein druckfertiges **DIN-A4-Querformat-Dokument**, das der
Browser selbst als PDF rendert.

> **Unabhängiges Hilfsmittel.** Dieses Projekt steht in keiner Verbindung zu EMMA,
> ist von dort weder autorisiert noch geprüft. Die abgetippten Werte und die
> Punkteschätzung sind eine Arbeitshilfe – maßgeblich ist immer das offizielle
> Regelwerk und die Bewertung der Juroren vor Ort.

## Schnellstart

```bash
npm install
npm run dev          # Entwicklungsserver
npm run build        # Produktions-Build nach dist/
npm run preview      # Build lokal testen

npm run lint         # ESLint
npm run format       # Prettier
npm test             # Regeln, Matrix, Datenbasis und Sprachkataloge (ohne Browser)
npm run build && npm run test:e2e   # End-to-End gegen den echten Build
```

Der Build ist relativ verlinkt (`base: './'`) und kann aus jedem statischen
Verzeichnis heraus ausgeliefert werden.

## Tech-Stack

| Baustein        | Einsatz                                                 |
| --------------- | ------------------------------------------------------- |
| Vue 3 + Vite    | Composition API, `<script setup>`, Lazy-geladene Routen |
| Pinia           | Globale Datenhaltung im RAM                             |
| Tailwind CSS v4 | UI und Druck-Layout                                     |
| LocalForage     | Autosave in die IndexedDB (State + Bilder getrennt)     |
| Compressor.js   | Lokale Bildkomprimierung vor dem Speichern              |
| JSZip           | Projekt-Export/-Import als `.zip`                       |
| mermaid.js      | Automatisch generierte Block- und Stromlaufdiagramme    |

## Die zwei Pfade

- **Quick Rescue** – nur sicherheitsrelevante Pflichtangaben, für den Fall
  „Show ist morgen, Mappe ist leer“.
- **SQ Masterclass** – zusätzlich Türdämmung Schicht für Schicht, Terminierung
  unter dem Teppich, Custom-Parts (3D-Druck, GFK) und REW-Messungen.

Der Modus ist jederzeit im Schritt „Fahrzeug & Klasse“ umschaltbar, ohne dass
Eingaben verloren gehen.

## Aufbau

```
src/
  data/schema.js      Datenstruktur der Mappe + Migration
  data/sections.js    Manifest aller Foto-Slots (Wizard, Score, Druck)
  data/emmaRules.js   Regel-Engine inkl. Sicherungs-/Querschnitt-Tabelle
  data/examples.js    Ghost-Overlays (Beispielfotos als Inline-SVG)
  data/steps.js       Reihenfolge des Assistenten je Kategorie
  data/matrix.js      Installation Matrix (Kriterien und Punkte je Kategorie)
  data/assessment.js  Punkteschätzung: abgeleitet + Selbsteinschätzung
  i18n/               Sprachkern und Kataloge (de/en)
  utils/storage.js    Persistenz-Anfrage, Quota-Behandlung, Speicherstand
  composables/useModal.js  Escape, Fokus-Trap und Fokus-Rückgabe für Dialoge
  stores/project.js   Pinia-State + debounced Autosave
  stores/media.js     Bild-Blobs in eigener IndexedDB-Tabelle
  utils/image.js      Komprimieren, Drehen, Dimensionen lesen
  utils/archive.js    ZIP-Export / -Import
  utils/mermaid.js    Diagramm-Definitionen aus dem Systemaufbau
  print/print.css     DIN-A4-quer Print-Engine
  views/              Wizard-Schritte + Druckansicht
```

### Datenhaltung

Der Projekt-State wird bei jeder Änderung debounced (400 ms) als JSON in die
IndexedDB geschrieben und beim Neuladen automatisch wiederhergestellt. Bilder
liegen **nicht** im JSON, sondern als Blob in einer eigenen IndexedDB-Tabelle –
der State hält nur Metadaten und eine Object-URL. Das hält den Autosave klein
und verhindert RAM-Probleme bei vielen Fotos.

### Regel-Engine

`src/data/emmaRules.js` prüft die Eingaben live. Die Werte sind gegen das
**EMMA competition manual, edition 2026** verifiziert (Kapitel 3 „EMMA rules –
Installation Quality"). Geprüft wird u. a.:

- **Fuse Size Matrix** – Sicherungswert gegen Kabelquerschnitt, exakt nach der
  Tabelle des Rulebooks (Grundlage: VW75212, Rechenspannung U = 12 V).
  Die Matrix gilt ausdrücklich auch für Verteilerblöcke und Busbars.
- **Hauptsicherung** innerhalb von 40 cm zu jedem Batterie-Pluspol
  **und/oder** vor jeder Blechdurchführung.
- **100-A-Deckel**: Ist die OEM-Masseleitung nicht verstärkt, ist die
  Hauptsicherung (bzw. die Summe mehrerer Hauptsicherungen) auf 100 A begrenzt –
  außer der Teilnehmer legt eine Berechnung nach der Judge-Book-Formel bei.
- **Mehrbatterie-Systeme**: Jeder Leiter muss die Summe aller einspeisenden
  Quellen tragen; jede Quelle am Verteiler braucht eine eigene Absicherung.
- Absicherung jeder Komponentenleitung, Kabelschutz, feste Montage.

Jeder Befund trägt ein `source`-Feld und wird in der UI entsprechend gekennzeichnet:

| `source`   | Bedeutung                                                       |
| ---------- | --------------------------------------------------------------- |
| `rulebook` | steht so (oder sinngemäß) im offiziellen Regelwerk              |
| `praxis`   | gute Einbaupraxis, **keine** EMMA-Vorgabe – kostet keine Punkte |

Als `praxis` markiert sind bewusst: Masse-Querschnitt ≥ Plus-Querschnitt,
empfohlene Masselänge und die Beschreibung des Massepunkts. Das Rulebook macht
dazu keine Vorgabe.

Schweregrade: `error` (Punktverlust), `warn`, `info`, `ok`. Befunde erscheinen im
jeweiligen Wizard-Schritt, in der Prüfansicht und zusammengefasst auf dem
Deckblatt des Ausdrucks.

`npm test` prüft die Matrix und die Kernregeln gegen die aus dem Rulebook
abgetippten Sollwerte (`tests/emmaRules.test.mjs`).

> **Bei einer neuen Rulebook-Edition:** `FUSE_LIMITS`, `MAX_FUSE_DISTANCE_CM`,
> `OEM_GROUND_MAX_MAIN_FUSE_A` und `RULEBOOK_EDITION` am Kopf von `emmaRules.js`
> nachziehen, die Sollwerte in `tests/emmaRules.test.mjs` anpassen und
> `EMMA_CLASSES` sowie `EMMA_SUBCLASSES` in `schema.js` gegen Kapitel 2
> abgleichen. Maßgeblich ist immer das aktuelle offizielle Rulebook.

#### Woher die Zahlen stammen

| Datei                        | Quelle                                    | Abgesichert durch          |
| ---------------------------- | ----------------------------------------- | -------------------------- |
| `emmaRules.js` (Grenzwerte)  | Manual 2026, Kapitel 3 + Fuse Size Matrix | `tests/emmaRules.test.mjs` |
| `matrix.js` (Punkte)         | Manual 2026, Kapitel 10                   | `tests/matrix.test.mjs`    |
| `schema.js` (`EMMA_CLASSES`) | Manual 2026, Kapitel 2                    | –                          |

Die Tests rechnen die abgetippten Werte gegen die Sollwerte des Regelwerks
(Fuse Size Matrix Zeile für Zeile, Spaltensummen E 69 · S 115 · M 161 · X 231 ·
X Unlimited 325). Sie sichern damit ab, dass die Werte nicht unbemerkt
verrutschen – ob sie inhaltlich zur jeweils gültigen Edition passen, kann nur
ein Abgleich mit dem offiziellen Dokument beantworten.

Die App prüft ausschließlich, was in diesen Dateien steht: Installationsregeln
zu Strom, Absicherung, Befestigung und Dokumentation. Kategorie-spezifische
Sonderregeln, Klassen-Limits und die eigentliche Klangbewertung sind **nicht**
abgebildet. Die Punktanzeige ist eine Selbsteinschätzung, keine Wertung – das
letzte Wort hat der Juror am Fahrzeug.

### Kategorien und Dokumentationspflicht

`EMMA_CLASSES` in `schema.js` bildet die Kategorien aus Kapitel 2 des Rulebooks ab
(ESQL Inside, SQ E/S/M/X Limited/Unlimited, MM, ESPL, ESQL, EMMA Tuning).
Zur Kategorie lässt sich die **Unterklasse** (Budget-/OEM-Variante, z. B.
„Master OEM Unlimited") erfassen – per Schnellauswahl (`EMMA_SUBCLASSES`) oder
Freitext. Sie steht in der Kopfzeile jeder gedruckten Seite.

Die Rubrik **System documentation** (Signal-Flowchart, Cable/Fuse-Diagramm,
Foto-Log nicht zugänglicher Verbindungen, 10 Punkte) gibt es erst ab **SQ M**.
In E und S werden stattdessen 4 Punkte für „System/Wiring Diagram present"
vergeben, und Dokumentation ist nur für verdeckte Komponenten nötig. Genau
darauf zielen die beiden Modi der App: Quick Rescue deckt E/S ab, SQ Masterclass
die Anforderungen ab M aufwärts.

Zwei Markierungen halten die Nachweispflicht realistisch: **Werksseitig
verbaute Komponenten** (z. B. OEM-Headunit) und **OEM-Verkabelung** lassen sich
im Diagramm-Schritt kennzeichnen – für Originalteile gilt die Dimensionierung
des Herstellers als akzeptiert, die App verlangt dafür keinen
Absicherungs-Nachweis und schreibt „OEM" ins Diagramm. Und weil Fotos nur für
Verdecktes Pflicht sind, kann jedes Pflichtfoto als **„sichtbar verbaut"**
markiert werden: Der Juror prüft es direkt am Fahrzeug, die Mappe zählt den
Punkt trotzdem als belegt.

### Punkte-Check

Die App rechnet gegen die **Installation Matrix** der gewählten Kategorie
(`src/data/matrix.js`, gegengerechnet in `tests/matrix.test.mjs`). Kriterien mit
`assess: 'auto'` leitet sie aus Eingaben und Fotos ab, alle übrigen schätzt der
Teilnehmer selbst ein. Das Ergebnis ist ausdrücklich eine Schätzung, keine
Wertung – und wird im Ausdruck auch so bezeichnet.

Eigene Schritte gibt es für die **Erklärung an die Juroren** (7 bzw. 15 Minuten,
mit aus den Daten generiertem Leitfaden) und für die **Bonuspunkte-Anträge**
(bis zu 50 Stück; in X Unlimited 100 von 325 Punkten).

### Offline und Speicher

Ein Service Worker legt alle Build-Assets in den Precache, damit die App auf dem
Showplatz auch ohne Netz startet. Beim ersten Start fordert sie
`navigator.storage.persist()` an, damit der Browser die Mappen nicht bei
Platzmangel wegräumt; ist der Speicher voll, meldet sie das mit
Handlungsanweisung statt still zu scheitern. Der aktuelle Stand steht in der
Prüfansicht.

### Bilder

Jedes Foto wird vor dem Speichern lokal auf max. 1920 px Kantenlänge und
JPEG-Qualität 0.82 heruntergerechnet; die EXIF-Orientierung wird dabei
begradigt. Der Button „↻ 90°“ dreht das Bild **physisch** über ein Canvas –
so stimmt die Ausrichtung auch im Ausdruck und im ZIP-Export.

Am Smartphone öffnet „📷 Foto aufnehmen“ über
`<input type="file" accept="image/*" capture="environment">` direkt die Kamera.

Da die Bilder über ein Canvas neu kodiert werden, verlieren sie dabei ihre
EXIF-Daten – **inklusive GPS-Koordinaten**. Die Fotos verraten also nicht, wo
das Fahrzeug steht.

### Druck

`src/print/print.css` setzt `@page { size: A4 landscape; margin: 10mm }`. Die
Druckansicht (`/#/druck`) baut die Seiten selbst auf – Deckblatt, Diagramme,
Technikdaten, Foto-Raster (1er, 2er oder 3er Reihen je nach Bildanzahl) – und
setzt auf jede Seite Kopfzeile (Name, Klasse, Kennzeichen, Fahrzeug) und
Fußzeile mit Seitennummer. „PDF generieren / Drucken“ ruft schlicht
`window.print()` auf; der Browser erzeugt das PDF nativ, auch mobil.

### Projekt-Archiv

„Projekt lokal sichern“ packt `project.json`, alle Bilder unter `bilder/` und
einen Index in eine ZIP. Dieselbe Datei lässt sich auf der Startseite per
Drag & Drop wieder einlesen – so kann man am Handy fotografieren und am PC
weiterschreiben.

## Tests

- `npm test` – vier Prüfungen ohne Browser:
  - `tests/emmaRules.test.mjs` – Regel-Engine gegen die Fuse Size Matrix, dazu
    die Bewertung der Hauptsicherung (ein geleertes Feld darf keine Punkte geben).
  - `tests/matrix.test.mjs` – Matrix-Summen gegen die Sollwerte des Rulebooks.
  - `tests/sections.test.mjs` – Zusammenhalt der Datenbasis: eindeutige
    Schlüssel, bekannte Kriterien und Beispielbilder, kein Pflichtfoto ohne
    sichtbares Feld.
  - `tests/i18n.test.mjs` – beide Sprachkataloge deckungsgleich, gleiche
    Platzhalter, jeder im Code benutzte Schlüssel übersetzt.
- `npm run test:e2e` – fährt den Produktions-Build in Chromium durch: Kategorie-
  Steuerung, Regelverstöße, Bild-Pipeline inklusive Drehen, mermaid,
  Sprachwechsel, ZIP-Roundtrip (auch zweimal derselbe Import), Autosave ohne
  Endlosschleife, Seitenumbruch und Inhalt des Ausdrucks, die PDF-Seitengröße
  (297 × 210 mm), das Layout im Telefonformat und die Beschriftung aller
  Eingabefelder. Braucht einen Chromium; ein eigener Pfad lässt sich über
  `CHROMIUM_PATH` setzen.

`.github/workflows/ci.yml` führt Lint, Formatprüfung, Tests, Build und E2E aus.

## Online stellen

Die App braucht keinen Server, nur einen Ort, der statische Dateien ausliefert.
`dist/` nach dem Build irgendwohin kopieren genügt.

### GitHub Pages (eingerichtet)

`.github/workflows/deploy.yml` baut bei jedem Push auf `main` und veröffentlicht
das Ergebnis auf GitHub Pages. Einmalig im Repository nötig:

1. **Settings → Pages → Build and deployment → Source:** `GitHub Actions` wählen.
2. Den Stand nach `main` mergen (oder den Workflow unter **Actions → Deploy →
   Run workflow** manuell starten).

Danach liegt die App unter `https://<user>.github.io/<repo>/`. Der Unterpfad ist
unkritisch: der Build ist relativ verlinkt (`base: './'`) und der Router nutzt
Hash-URLs (`/#/wizard`), es braucht also keine Server-Rewrites.

### Andere Hoster

Überall dasselbe Muster – Build-Befehl `npm run build`, Ausgabeverzeichnis
`dist`:

- **Netlify / Vercel / Cloudflare Pages:** Repo verbinden, die beiden Werte
  eintragen, fertig. Ohne Repo tut es auch ein Drag & Drop des `dist`-Ordners.
- **Eigener Webspace:** `dist/` per FTP/rsync in ein beliebiges Verzeichnis
  legen.

Für den Service Worker (Offline-Betrieb) und die Kamera-Aufnahme muss die Seite
über **HTTPS** laufen; alle genannten Hoster liefern das Zertifikat mit.

## Lizenz

[MIT](LICENSE) – Nutzung, Änderung und Weitergabe sind erlaubt, solange der
Copyright- und Lizenzhinweis erhalten bleibt. Die Software kommt ohne Gewähr.

Der Name EMMA sowie das Regelwerk gehören ihren jeweiligen Rechteinhabern; die
Lizenz dieses Projekts erstreckt sich ausschließlich auf den hier enthaltenen
Quelltext.
