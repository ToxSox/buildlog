# Arbeitsweise in diesem Projekt

## Ausliefern

Ist der CI-Lauf eines Pull Requests grün, wird er ohne Rückfrage nach `main`
gemerged. Das ist eine stehende Freigabe des Projektinhabers, keine Annahme.

- Merge-Methode **rebase**: `main` bleibt linear, die ausführliche
  Commit-Nachricht bleibt erhalten. Merge-Commits gibt es hier nicht.
- Grün heißt: **alle** Check-Runs des Head-Commits stehen auf `success`.
  Ein einzelner ausstehender Lauf ist kein grüner Stand.
- Ist ein Lauf rot, wird er behoben und gepusht – nicht gemeldet und liegen
  gelassen.
- Nach dem Merge auf `main` läuft der Deploy nach GitHub Pages. Auch der wird
  nachgesehen; ein roter Deploy ist ein kaputtes Release, kein Randfall.
- Ein gemergter PR ist erledigt. Folgearbeit setzt den Arbeitsbranch neu auf
  `main` auf (`git checkout -B <branch> origin/main`) und bekommt einen neuen
  PR – niemals neue Commits auf bereits gemergter Historie.

## Versionsnummer

`package.json` (`version`) wird in den Build injiziert und steht im Seitenfuß,
auf dem Deckblatt des Ausdrucks und in der LIESMICH des ZIP-Archivs. Jeder
Stand, der nach `main` und damit auf Pages geht, braucht deshalb eine eigene
Nummer – zwei ausgelieferte Stände mit derselben Nummer sind für niemanden
mehr auseinanderzuhalten.

Der Bump gehört in den Commit, der den Stand ausmacht (so wie
`Version 0.6.0`, `Version 0.7.0`), nicht in einen eigenen „bump"-Commit.

Im `package-lock.json` sind dabei **nur** die beiden Projekt-Einträge am Kopf
zu ändern (Wurzel und `packages[""]`). Ein Suchen-und-Ersetzen über die ganze
Datei trifft auch Abhängigkeiten, die zufällig dieselbe Version tragen, und
hinterlässt deren `resolved`/`integrity` auf der alten Version. Danach
`npm install` laufen lassen, das bestätigt die Datei als konsistent.

## Prüfen vor dem Push

`npm run lint`, `npm run format:check`, `npm test` und – bei allem, was die
Oberfläche, den Ausdruck oder die Bild-Pipeline berührt – `npm run build &&
npm run test:e2e`. Die E2E-Suite braucht einen Chromium; der Pfad lässt sich
über `CHROMIUM_PATH` setzen, falls der von Playwright erwartete Build fehlt.

Ein behobener Fehler bekommt eine Prüfung, die ihn festnagelt. Die bestehenden
Tests sind so gebaut: Der Kommentar darüber nennt den Fehler, den sie
verhindern.

## Sprache

Commit-Nachrichten, Kommentare und Oberflächentexte sind deutsch. Die
Commit-Nachricht erklärt **warum**, nicht was – das Was steht im Diff.
Oberflächentexte gehören in beide Sprachkataloge (`src/i18n/de.js`, `en.js`),
`npm test` prüft sie auf Deckungsgleichheit.

## EMMA

Der Produktname ist **Build Log Creator**, ohne „EMMA" – das Werkzeug ist
unabhängig und soll nicht nach einem offiziellen Angebot des Verbands
aussehen. Verweise auf das **Regelwerk** dagegen bleiben ausdrücklich stehen
(„EMMA-Klasse", „Fuse Size Matrix des EMMA-Regelwerks", die Herkunftsangaben
in `matrix.js`/`schema.js`, der Trademark-Hinweis in der README). Sie benennen,
wogegen geprüft wird, und tragen die Nachprüfbarkeit der abgetippten Zahlen.

Die internen Bezeichner (`emmaRules.js`, `EMMA_CLASSES`, `meta.emmaClass`) und
vor allem die IndexedDB-Namen `emma-buildlog` sowie der Sprach-Key
`emma-buildlog-lang` bleiben unangetastet: Ein Rename dort wäre für Nutzer
unsichtbar, würde aber jede bereits gespeicherte Mappe unerreichbar machen.
