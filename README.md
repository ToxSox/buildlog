# EMMA Build Log Creator

Geführter Assistent zur Erstellung von Car-HiFi-Einbaudokumentationen („Build Logs“)
nach EMMA-Regelwerk. Die App läuft **zu 100 % clientseitig**: kein Backend, kein Konto,
keine Uploads. Alle Daten bleiben im Browser des Nutzers und lassen sich als ZIP
sichern. Am Ende steht ein druckfertiges **DIN-A4-Querformat-Dokument**, das der
Browser selbst als PDF rendert.

## Schnellstart

```bash
npm install
npm run dev        # Entwicklungsserver
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal testen
```

Der Build ist relativ verlinkt (`base: './'`) und kann aus jedem statischen
Verzeichnis heraus ausgeliefert werden.

## Tech-Stack

| Baustein          | Einsatz                                                      |
| ----------------- | ------------------------------------------------------------ |
| Vue 3 + Vite      | Composition API, `<script setup>`, Lazy-geladene Routen       |
| Pinia             | Globale Datenhaltung im RAM                                   |
| Tailwind CSS v4   | UI und Druck-Layout                                           |
| LocalForage       | Autosave in die IndexedDB (State + Bilder getrennt)           |
| Compressor.js     | Lokale Bildkomprimierung vor dem Speichern                    |
| JSZip             | Projekt-Export/-Import als `.zip`                             |
| mermaid.js        | Automatisch generierte Block- und Stromlaufdiagramme          |

## Die zwei Pfade

* **Quick Rescue** – nur sicherheitsrelevante Pflichtangaben, für den Fall
  „Show ist morgen, Mappe ist leer“.
* **SQ Masterclass** – zusätzlich Türdämmung Schicht für Schicht, Terminierung
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
  data/steps.js       Reihenfolge des Assistenten je Modus
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

`src/data/emmaRules.js` prüft die Eingaben live, u. a.:

* Hauptsicherung gegen Kabelquerschnitt (Tabelle `FUSE_LIMITS`)
* max. 40 cm zwischen Batterie-Pluspol und Hauptsicherung
* eigene Absicherung der Zweitbatterie und des Ladekabels
* Masse-Querschnitt ≥ Plus-Querschnitt, Masselänge
* Absicherung jedes Verteiler-Abgangs

Befunde haben die Schweregrade `error` (Disqualifikationsgefahr), `warn`, `info`
und `ok` und erscheinen im jeweiligen Wizard-Schritt, in der Prüfansicht und
zusammengefasst auf dem Deckblatt des Ausdrucks.

> **Hinweis zu den Zahlenwerten:** Die Grenzwerte sind bewusst in Tabellen am
> Kopf von `emmaRules.js` ausgelagert, damit sie bei einer neuen Regelwerk-Version
> an einer Stelle nachgezogen werden können. Maßgeblich ist immer das aktuelle
> offizielle EMMA-Rulebook.

### Bilder

Jedes Foto wird vor dem Speichern lokal auf max. 1920 px Kantenlänge und
JPEG-Qualität 0.82 heruntergerechnet; die EXIF-Orientierung wird dabei
begradigt. Der Button „↻ 90°“ dreht das Bild **physisch** über ein Canvas –
so stimmt die Ausrichtung auch im Ausdruck und im ZIP-Export.

Am Smartphone öffnet „📷 Foto aufnehmen“ über
`<input type="file" accept="image/*" capture="environment">` direkt die Kamera.

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
