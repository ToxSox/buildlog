# EMMA Build Log Creator

Geführter Assistent zur Erstellung von Car-HiFi-Einbaudokumentationen („Build Logs“)
nach EMMA-Regelwerk. Die App läuft **zu 100 % clientseitig**: kein Backend, kein Konto,
keine Uploads. Alle Daten bleiben im Browser des Nutzers und lassen sich als ZIP
sichern. Am Ende steht ein druckfertiges **DIN-A4-Querformat-Dokument**, das der
Browser selbst als PDF rendert.

## Schnellstart

```bash
npm install
npm run dev          # Entwicklungsserver
npm run build        # Produktions-Build nach dist/
npm run preview      # Build lokal testen

npm run lint         # ESLint
npm run format       # Prettier
npm test             # Regel- und Matrix-Tests (Node, ohne Browser)
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
> `EMMA_CLASSES` in `schema.js` gegen Kapitel 2 abgleichen. Maßgeblich ist immer
> das aktuelle offizielle Rulebook.

### Kategorien und Dokumentationspflicht

`EMMA_CLASSES` in `schema.js` bildet die Kategorien aus Kapitel 2 des Rulebooks ab
(ESQL Inside, SQ E/S/M/X Limited/Unlimited, MM, ESPL, ESQL, EMMA Tuning).

Die Rubrik **System documentation** (Signal-Flowchart, Cable/Fuse-Diagramm,
Foto-Log nicht zugänglicher Verbindungen, 10 Punkte) gibt es erst ab **SQ M**.
In E und S werden stattdessen 4 Punkte für „System/Wiring Diagram present"
vergeben, und Dokumentation ist nur für verdeckte Komponenten nötig. Genau
darauf zielen die beiden Modi der App: Quick Rescue deckt E/S ab, SQ Masterclass
die Anforderungen ab M aufwärts.

### Punkte-Check

Die App rechnet gegen die **Installation Matrix** der gewählten Kategorie
(`src/data/matrix.js`, gegengerechnet in `tests/matrix.test.mjs`). Kriterien mit
`assess: 'auto'` leitet sie aus Eingaben und Fotos ab, alle übrigen schätzt der
Teilnehmer selbst ein. Das Ergebnis ist ausdrücklich eine Schätzung, keine
Wertung – und wird im Ausdruck auch so bezeichnet.

Eigene Schritte gibt es für die **Erklärung an die Richter** (7 bzw. 15 Minuten,
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

- `npm test` – Regel-Engine gegen die Fuse Size Matrix und die Matrix-Summen
  gegen die Sollwerte des Rulebooks (Node, kein Browser nötig).
- `npm run test:e2e` – fährt den Produktions-Build in Chromium durch: Kategorie-
  Steuerung, Regelverstöße, Bild-Pipeline inklusive Drehen, mermaid,
  Sprachwechsel, ZIP-Roundtrip und eine Regression auf die PDF-Seitengröße
  (297 × 210 mm). Braucht einen Chromium; ein eigener Pfad lässt sich über
  `CHROMIUM_PATH` setzen.

`.github/workflows/ci.yml` führt Lint, Formatprüfung, Tests, Build und E2E aus.
