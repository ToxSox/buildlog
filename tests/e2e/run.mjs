/**
 * End-to-End-Tests gegen den Produktions-Build.
 *
 * Startet selbst einen Preview-Server, fährt die wichtigsten Wege durch und
 * prüft dabei genau die Dinge, die beim Bauen schon einmal kaputt waren:
 * Kategorie-Steuerung, Regel-Engine, Bild-Pipeline, ZIP-Roundtrip,
 * Sprachumschaltung und die A4-Quer-Ausgabe.
 *
 *   npm run build && npm run test:e2e
 */
import { chromium, devices } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import zlib from 'node:zlib'

const PORT = Number(process.env.E2E_PORT || 4183)
const BASE = `http://127.0.0.1:${PORT}/`
const WORK = mkdtempSync(join(tmpdir(), 'emma-e2e-'))

let failures = 0
const check = (name, condition, detail = '') => {
  const ok = Boolean(condition)
  if (!ok) failures += 1
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${name}${detail ? ` – ${detail}` : ''}`)
}

/** Erzeugt ein gültiges Test-PNG ohne externe Abhängigkeit. */
function makeTestPng(path, w = 640, h = 480) {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  let o = 0
  for (let y = 0; y < h; y++) {
    raw[o++] = 0
    for (let x = 0; x < w; x++) {
      raw[o++] = (x * 255) / w
      raw[o++] = (y * 255) / h
      raw[o++] = 160
    }
  }
  const table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  const crc32 = (buf) => {
    let c = 0xffffffff
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(td))
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  )
  return path
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      /* Server noch nicht da */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Preview-Server unter ${url} nicht erreichbar`)
}

const img = makeTestPng(join(WORK, 'test.png'))
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], {
  stdio: 'ignore',
  detached: false,
})

let browser
try {
  await waitForServer(BASE)
  browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  )
  // locale erzwingen: die App übernimmt sonst die Browsersprache (gewolltes Verhalten)
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    acceptDownloads: true,
    locale: 'de-DE',
  })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
  page.on('dialog', (d) => d.accept())

  // ---------------------------------------------------------- Wizard-Grundlauf
  await page.goto(BASE, { waitUntil: 'networkidle' })
  check('Startseite lädt', (await page.title()).includes('EMMA'))

  await page.getByRole('button', { name: /SQ Masterclass/ }).click()
  await page.waitForURL('**/#/wizard/fahrzeug')
  await page.fill('#participant', 'Max Mustermann')
  await page.fill('#make', 'Audi')
  await page.fill('#model', 'A3')
  await page.fill('#plate', 'M-AB 1234')

  // ------------------------------------------------------ Autosave kommt zur Ruhe
  // Regression: save() schrieb updatedAt in den beobachteten State und stieß damit
  // den nächsten Autosave an – eine Endlosschleife, die die Statusanzeige oben
  // rechts dauerhaft flackern ließ und ohne Unterlass in IndexedDB schrieb.
  // Die Verbindung wird sofort wieder geschlossen: eine offene Verbindung
  // blockiert sonst das Anlegen weiterer localforage-Tabellen (z. B. „media“).
  const readUpdatedAt = () =>
    page.evaluate(
      () =>
        new Promise((resolve) => {
          const req = globalThis.indexedDB.open('emma-buildlog')
          req.onerror = () => resolve('')
          req.onblocked = () => resolve('')
          req.onsuccess = () => {
            const db = req.result
            const done = (value) => {
              db.close()
              resolve(value)
            }
            try {
              const all = db.transaction('state', 'readonly').objectStore('state').getAll()
              all.onerror = () => done('')
              all.onsuccess = () => done(all.result.find((v) => v?.updatedAt)?.updatedAt || '')
            } catch {
              done('')
            }
          }
        }),
    )

  await page.waitForTimeout(1200)
  const stampBefore = await readUpdatedAt()
  const statusLabels = new Set()
  for (let i = 0; i < 10; i++) {
    statusLabels.add((await page.locator('[data-testid=save-status]').textContent()).trim())
    await page.waitForTimeout(200)
  }
  const stampAfter = await readUpdatedAt()
  check(
    'Autosave stoppt nach der Eingabe',
    Boolean(stampBefore) && stampBefore === stampAfter,
    `${stampBefore} → ${stampAfter}`,
  )
  check('Statusanzeige flackert im Leerlauf nicht', statusLabels.size === 1, [...statusLabels].join(' | '))

  // ------------------------------------------------- Kategorie steuert den Umfang
  await page.getByRole('button', { name: 'SQ E – Entry', exact: true }).click()
  await page.waitForTimeout(400)
  const stepsE = await page.locator('nav ol li').count()
  const maxE = (await page.locator('header .tabular-nums').first().innerText()).split('/')[1]
  check('Kategorie E: reduzierte Schrittzahl', stepsE === 6, `${stepsE} Schritte`)
  check('Kategorie E: Maximum 69 Punkte', maxE === '69', `Maximum ${maxE}`)

  await page.getByRole('button', { name: 'SQ X – Expert Unlimited', exact: true }).click()
  await page.waitForTimeout(400)
  const stepsX = await page.locator('nav ol li').count()
  const maxX = (await page.locator('header .tabular-nums').first().innerText()).split('/')[1]
  check('Kategorie X Unlimited: alle Schritte', stepsX === 8, `${stepsX} Schritte`)
  check('Kategorie X Unlimited: Maximum 325 Punkte', maxX === '325', `Maximum ${maxX}`)

  // ------------------------------------------------------------- Bild-Pipeline
  await page.locator('input[type=file]').first().setInputFiles(img)
  await page.waitForTimeout(1800)
  check('Foto hochgeladen und angezeigt', (await page.locator('figure img').count()) === 1)
  await page.getByRole('button', { name: '↻ 90°' }).first().click()
  await page.waitForTimeout(1500)
  const intact = await page
    .locator('figure img')
    .evaluateAll((els) => els.filter((e) => e.complete && e.naturalWidth > 0).length)
  check('Foto nach dem Drehen weiterhin gültig', intact === 1)

  // Kamerafotos sind grosse JPEGs mit EXIF-Orientierung (iPhone: "image.jpg") –
  // genau daran scheiterte die Pipeline im Feld. Der Testfall stellt sie nach.
  const jpegDataUrl = await page.evaluate(() => {
    const c = globalThis.document.createElement('canvas')
    c.width = 3200
    c.height = 2400
    const g = c.getContext('2d')
    g.fillStyle = '#328'
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = '#fa0'
    g.fillRect(0, 0, 800, 2400)
    return c.toDataURL('image/jpeg', 0.9)
  })
  const plainJpeg = Buffer.from(jpegDataUrl.split(',')[1], 'base64')
  const exifTiff = Buffer.concat([
    Buffer.from('49492a00', 'hex'), // TIFF-Header, little endian
    Buffer.from([8, 0, 0, 0]),
    Buffer.from([1, 0]),
    Buffer.from('120103000100000006000000', 'hex'), // Orientation = 6 (90° CW)
    Buffer.from([0, 0, 0, 0]),
  ])
  const app1data = Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), exifTiff])
  const app1 = Buffer.concat([
    Buffer.from([0xff, 0xe1, (app1data.length + 2) >> 8, (app1data.length + 2) & 0xff]),
    app1data,
  ])
  const cameraJpg = join(WORK, 'image.jpg')
  writeFileSync(cameraJpg, Buffer.concat([plainJpeg.subarray(0, 2), app1, plainJpeg.subarray(2)]))
  await page.locator('input[type=file]').first().setInputFiles(cameraJpg)
  await page.waitForTimeout(2500)
  check('Kamera-JPEG mit EXIF wird verarbeitet', (await page.locator('figure img').count()) === 2)
  // Wieder entfernen, damit die Folge-Checks denselben Stand sehen wie bisher.
  await page.locator('figure').last().getByRole('button', { name: 'Löschen' }).click()
  await page.waitForTimeout(600)
  check('Kamera-JPEG wieder entfernt', (await page.locator('figure img').count()) === 1)

  // ------------------------------------------------------------- Regel-Engine
  await page.goto(`${BASE}#/wizard/strom`)
  await page.waitForTimeout(600)
  await page.selectOption('#mainSection', '10')
  await page.fill('#mainFuse', '150')
  await page.fill('#fuseDist', '55')
  await page.getByRole('button', { name: 'Nein', exact: true }).click()
  await page.waitForTimeout(600)
  const errorBanners = await page.locator('.border-rose-300').count()
  check('Regelverstöße werden erkannt', errorBanners >= 3, `${errorBanners} Fehlerbanner`)
  check(
    'Fuse Size Matrix greift (10 mm² erlaubt nur 60 A)',
    await page.getByText('Hauptsicherung zu groß für den Querschnitt').first().isVisible(),
  )
  check(
    '100-A-Grenze bei OEM-Masse greift',
    await page
      .getByText(/maximal 100 A erlaubt/)
      .first()
      .isVisible(),
  )

  await page.fill('#mainFuse', '60')
  await page.fill('#fuseDist', '25')
  await page.getByRole('button', { name: 'Ja, vor dem ersten Blech' }).click()
  await page.waitForTimeout(600)
  check('nach Korrektur keine Fehler mehr', (await page.locator('.border-rose-300').count()) === 0)

  // Beschreibung des Massepunkts – landet später als Detail im Stromlaufplan-Knoten.
  await page.fill('#gndPoint', 'Sitzschiene hinten links')
  await page.waitForTimeout(600)

  // ------------------------------------------------------------------ Diagramme
  await page.goto(`${BASE}#/wizard/diagramme`)
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /\+ Signalquelle/ }).click()
  await page.getByRole('button', { name: /\+ Endstufe/ }).click()
  await page.getByRole('button', { name: '+ Verbindung' }).first().click()
  await page.waitForTimeout(300)
  await page.locator('select').nth(0).selectOption({ index: 1 })
  await page.locator('select').nth(1).selectOption({ index: 2 })
  await page.waitForTimeout(2500)
  check('mermaid rendert beide Diagramme', (await page.locator('.mermaid-host svg').count()) === 2)

  // Masse gehört in den Stromlaufplan: erst der Hinweis, dann der Rückweg.
  await page.getByRole('button', { name: '+ Verbindung' }).last().click()
  await page.waitForTimeout(300)
  await page.locator('select').nth(2).selectOption({ index: 1 }) // von: Signalquelle
  await page.locator('select').nth(3).selectOption({ index: 2 }) // nach: Endstufe
  await page.waitForTimeout(400)
  check(
    'fehlende Masse wird angemahnt',
    await page.getByText(/Stromlaufplan hat noch keine Masse/).isVisible(),
  )
  await page.getByRole('button', { name: /\+ Massepunkt/ }).click()
  await page.getByRole('button', { name: '+ Verbindung' }).last().click()
  await page.waitForTimeout(300)
  await page.locator('select').nth(5).selectOption({ index: 2 }) // von: Endstufe
  await page.locator('select').nth(6).selectOption({ index: 3 }) // nach: Massepunkt
  await page.waitForTimeout(2500)
  const powerDiagram = await page.locator('.mermaid-host').last().innerText()
  check(
    'Massepunkt erscheint im Stromlaufplan',
    powerDiagram.includes('Massepunkt'),
    powerDiagram.slice(0, 80),
  )
  check(
    'Massepunkt erbt die Beschreibung aus Strom & Sicherheit',
    powerDiagram.includes('Sitzschiene hinten links'),
    powerDiagram.slice(0, 120),
  )
  check(
    'Masse-Hinweis verschwindet',
    !(await page.getByText(/Stromlaufplan hat noch keine Masse/).isVisible()),
  )

  // Remote-Leitung: als REM markierte Signalverbindung erscheint im Diagramm.
  await page.getByRole('button', { name: '+ Verbindung' }).first().click()
  await page.waitForTimeout(300)
  // Neue Signal-Selects liegen vor den Strom-Selects: Indizes 2 und 3.
  await page.locator('select').nth(2).selectOption({ index: 1 }) // von: Signalquelle
  await page.locator('select').nth(3).selectOption({ index: 2 }) // nach: Endstufe
  await page
    .getByLabel(/Remote-Leitung/)
    .last()
    .check()
  await page.waitForTimeout(2500)
  const signalDiagram = await page.locator('.mermaid-host').first().innerText()
  check(
    'Remote-Leitung erscheint als REM im Signalweg',
    signalDiagram.includes('REM'),
    signalDiagram.slice(0, 80),
  )

  // ------------------------------------------------------------ Sprachwechsel
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await page.waitForTimeout(600)
  const navEn = await page.locator('nav ol li button').first().innerText()
  check('Sprachwechsel greift in der Navigation', navEn.includes('Vehicle'), navEn.replace(/\n/g, ' '))
  // Die Bewertungsstufe im Kopf war fest auf Deutsch verdrahtet, obwohl beide Kataloge sie führen.
  const headEn = await page.locator('header').innerText()
  check(
    'Bewertungsstufe folgt der Sprache',
    /criteria not assessed/i.test(headEn) && !/Kriterien/.test(headEn),
    headEn.replace(/\n/g, ' ').slice(0, 120),
  )
  await page.getByRole('button', { name: 'DE', exact: true }).click()
  await page.waitForTimeout(400)

  // ------------------------------------------------------------- ZIP-Roundtrip
  await page.goto(`${BASE}#/wizard/pruefen`)
  await page.waitForTimeout(700)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /ZIP herunterladen/ }).click(),
  ])
  const zipPath = join(WORK, 'export.zip')
  await download.saveAs(zipPath)
  check('ZIP-Export erzeugt eine Datei', statSync(zipPath).size > 1000, `${statSync(zipPath).size} Bytes`)

  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'de-DE' })
  const page2 = await ctx2.newPage()
  page2.on('pageerror', (e) => consoleErrors.push(`import: ${e.message}`))
  await page2.goto(BASE, { waitUntil: 'networkidle' })
  await page2.locator('input[type=file][accept*="zip"]').setInputFiles(zipPath)
  await page2.waitForTimeout(3000)
  check(
    'Import stellt die Stammdaten wieder her',
    (await page2.inputValue('#participant')) === 'Max Mustermann',
  )
  check('Import stellt die Fotos wieder her', (await page2.locator('figure img').count()) === 1)

  // Zweiter Import derselben ZIP: Früher behielt der Import die alten Bild-IDs und
  // überschrieb damit die Fotos der bereits importierten Mappe.
  await page2.goto(`${BASE}#/`)
  await page2.waitForTimeout(600)
  await page2.locator('input[type=file][accept*="zip"]').setInputFiles(zipPath)
  await page2.waitForTimeout(3000)
  const mediaIdSets = await page2.evaluate(
    () =>
      new Promise((resolve) => {
        const req = globalThis.indexedDB.open('emma-buildlog')
        req.onerror = () => resolve([])
        req.onblocked = () => resolve([])
        req.onsuccess = () => {
          const db = req.result
          const done = (value) => {
            db.close()
            resolve(value)
          }
          try {
            const store = db.transaction('state', 'readonly').objectStore('state')
            const keys = store.getAllKeys()
            const values = store.getAll()
            values.onerror = () => done([])
            values.onsuccess = () =>
              done(
                values.result
                  .filter((_, i) => String(keys.result[i]).startsWith('project:'))
                  .map((prj) =>
                    Object.values(prj.media || {}).flatMap((list) => (list || []).map((m) => m.id)),
                  ),
              )
          } catch {
            done([])
          }
        }
      }),
  )
  const allIds = mediaIdSets.flat()
  check(
    'Import vergibt eigene Bild-IDs je Mappe',
    mediaIdSets.length === 2 && allIds.length === 2 && new Set(allIds).size === 2,
    JSON.stringify(mediaIdSets),
  )
  check('Zweiter Import zeigt sein eigenes Foto', (await page2.locator('figure img').count()) === 1)
  await ctx2.close()

  // --------------------------------------------- Vortrag & leere Zahlenfelder
  // Nur „story“ gefüllt: Diese Seite fiel früher komplett aus dem Druck.
  await page.goto(`${BASE}#/wizard/praesentation`)
  await page.waitForTimeout(600)
  await page.fill('#story', 'Zum Schluss zeige ich die Messungen am Hörplatz.')
  // Leeres Zahlenfeld: der Ausdruck zeigte dafür eine Zeile mit nacktem „cm“.
  await page.goto(`${BASE}#/wizard/strom`)
  await page.waitForTimeout(600)
  await page.fill('#fuseDist', '')
  await page.waitForTimeout(600)

  // --------------------------------------------------------------- Druckausgabe
  await page.goto(`${BASE}#/druck`)
  await page.waitForTimeout(3000)
  const printPages = await page.locator('.print-page').count()
  check('Druckansicht baut Seiten auf', printPages >= 4, `${printPages} Seiten`)

  const printTitles = await page.locator('.print-head__title').allInnerTexts()
  check(
    'Vortragsseite erscheint auch nur mit Abschluss-Text',
    printTitles.some((tt) => tt.includes('Erklärung an die Juroren')),
    printTitles.join(' | ').slice(0, 160),
  )

  const cover = await page.locator('.print-page').first().innerText()
  check(
    'Deckblatt nennt den Modus lesbar',
    cover.includes('SQ Masterclass') && !cover.includes('SQMasterclass'),
    (cover.split('\n').find((l) => l.includes('Dokumentation')) || '').slice(0, 80),
  )

  const orphanUnits = await page
    .locator('.print-table td')
    .evaluateAll((els) => els.map((e) => e.textContent.trim()).filter((v) => /^(cm|mm²|A)$/.test(v)))
  check('kein leeres Zahlenfeld im Ausdruck', orphanUnits.length === 0, orphanUnits.join(', '))

  check(
    'normale Mappe passt auf ihre Blätter',
    (await page.locator('[data-testid=print-overflow]').count()) === 0,
    await page
      .locator('[data-testid=print-overflow]')
      .first()
      .innerText()
      .catch(() => ''),
  )

  // Zu langer Abschnitt: Der Rest landet beim Drucken auf einem Zusatzblatt ohne
  // Kopfzeile, die Seitenzahlen stimmen dann nicht mehr – das muss die Vorschau sagen.
  await page.goto(`${BASE}#/wizard/handwerk`)
  await page.waitForTimeout(600)
  await page.fill('#tuning', Array.from({ length: 60 }, (_, i) => `Abstimmschritt ${i + 1}`).join('\n'))
  await page.waitForTimeout(700)
  await page.goto(`${BASE}#/druck`)
  await page.waitForTimeout(3000)
  check(
    'Vorschau warnt vor überlangen Abschnitten',
    (await page.locator('[data-testid=print-overflow]').count()) === 1,
    (
      await page
        .locator('[data-testid=print-overflow]')
        .first()
        .innerText()
        .catch(() => '')
    ).slice(0, 90),
  )

  const pdfPath = join(WORK, 'out.pdf')
  await page.emulateMedia({ media: 'print' })
  await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true })
  await page.emulateMedia({ media: 'screen' })
  const pdf = readFileSync(pdfPath)
  const boxes = [...new Set(pdf.toString('latin1').match(/\/MediaBox\s*\[[^\]]*\]/g) || [])]
  const a4Landscape = boxes.every((b) => /841\.9|842/.test(b) && /594\.9|595/.test(b))
  check('PDF ist DIN A4 quer', boxes.length === 1 && a4Landscape, boxes.join(' '))

  // Ohne diese Prüfung faellt nicht auf, wenn die Fotos zwar in der Vorschau
  // stehen, im gedruckten Dokument aber fehlen – dort zaehlen sie am meisten.
  // Achtung: Auch die gerasterten Diagramme sind Bildobjekte, deshalb wird
  // gegen Fotos + Diagramme der Vorschau gerechnet statt gegen "mindestens eins".
  const embeddedImages = (pdf.toString('latin1').match(/\/Subtype\s*\/Image/g) || []).length
  const previewFigures = await page.locator('.print-figure img').count()
  const previewDiagrams = await page.locator('.print-diagram svg').count()
  check(
    'jedes Foto steckt im PDF',
    previewFigures > 0 && embeddedImages >= previewFigures + previewDiagrams,
    `${embeddedImages} Bildobjekte, erwartet ≥ ${previewFigures} Fotos + ${previewDiagrams} Diagramme`,
  )

  // ------------------------------------------------------------ Handy-Layout
  // Fotografiert wird am Auto, also auf dem Telefon. Lange deutsche Komposita
  // und lange Eingaben schoben die Seite dort seitlich aus dem Bild.
  const ctx3 = await browser.newContext({ ...devices['Pixel 5'], locale: 'de-DE' })
  const phone = await ctx3.newPage()
  phone.on('pageerror', (e) => consoleErrors.push(`mobil: ${e.message}`))
  phone.on('console', (m) => m.type() === 'error' && consoleErrors.push(`mobil: ${m.text()}`))
  const sideways = () =>
    phone.evaluate(() => {
      const el = globalThis.document.documentElement
      return el.scrollWidth > el.clientWidth + 1 ? `${el.scrollWidth} > ${el.clientWidth}` : ''
    })

  await phone.goto(BASE, { waitUntil: 'networkidle' })
  const wideStart = await sideways()
  await phone.locator('button.card').first().click()
  await phone.waitForURL('**/#/wizard/fahrzeug')
  await phone.waitForTimeout(500)
  await phone.fill('#participant', 'Maximilian Mustermann-Sonnenschein')
  await phone.fill('#model', 'Kompressor-Sondermodell-Langstreckenausfuehrung')
  await phone.getByRole('button', { name: 'SQ M – Master', exact: true }).click()
  await phone.waitForTimeout(700)

  const wideSteps = []
  for (const step of ['fahrzeug', 'diagramme', 'strom', 'hardware', 'handwerk', 'punkte', 'pruefen']) {
    await phone.goto(`${BASE}#/wizard/${step}`)
    await phone.waitForTimeout(700)
    const wide = await sideways()
    if (wide) wideSteps.push(`${step} (${wide})`)
  }
  // Am Auto tippt man und wechselt sofort die App. Ohne sofortiges Schreiben
  // beendet das Betriebssystem die Seite womoeglich vor Ablauf der 400 ms.
  await phone.goto(`${BASE}#/wizard/fahrzeug`)
  await phone.waitForTimeout(700)
  await phone.fill('#plate', 'B-XY 9876')
  await phone.evaluate(() => {
    const doc = globalThis.document
    Object.defineProperty(doc, 'visibilityState', { value: 'hidden', configurable: true })
    doc.dispatchEvent(new Event('visibilitychange'))
  })
  await phone.waitForTimeout(150)
  const savedPlate = await phone.evaluate(
    () =>
      new Promise((resolve) => {
        const req = globalThis.indexedDB.open('emma-buildlog')
        req.onerror = () => resolve('')
        req.onblocked = () => resolve('')
        req.onsuccess = () => {
          const db = req.result
          const done = (value) => {
            db.close()
            resolve(value)
          }
          try {
            const all = db.transaction('state', 'readonly').objectStore('state').getAll()
            all.onerror = () => done('')
            all.onsuccess = () => done(all.result.find((v) => v?.meta)?.meta?.plate || '')
          } catch {
            done('')
          }
        }
      }),
  )
  check('Eingabe ist beim App-Wechsel sofort gesichert', savedPlate === 'B-XY 9876', savedPlate)

  await ctx3.close()
  check(
    'Handy: keine Seite scrollt seitlich',
    !wideStart && wideSteps.length === 0,
    [wideStart && `Start (${wideStart})`, ...wideSteps].filter(Boolean).join(', '),
  )

  // ------------------------------------------------- Beschriftung der Felder
  // Felder in Listen (Komponenten, Endstufen, Bonusantraege) hatten Beschriftungen
  // ohne Bezug zum Eingabefeld – Screenreader lasen sie deshalb nicht vor.
  const ctx4 = await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'de-DE' })
  const a11y = await ctx4.newPage()
  a11y.on('pageerror', (e) => consoleErrors.push(`a11y: ${e.message}`))
  await a11y.goto(BASE, { waitUntil: 'networkidle' })
  await a11y.locator('button.card').nth(1).click()
  await a11y.waitForURL('**/#/wizard/fahrzeug')
  await a11y.getByRole('button', { name: 'SQ X – Expert Unlimited', exact: true }).click()
  await a11y.waitForTimeout(500)

  const nameless = []
  for (const step of ['fahrzeug', 'diagramme', 'strom', 'hardware', 'handwerk', 'praesentation', 'punkte']) {
    await a11y.goto(`${BASE}#/wizard/${step}`)
    await a11y.waitForTimeout(600)
    // je einen Listeneintrag anlegen, damit auch dessen Felder geprüft werden
    const adders = a11y.locator('.card-header button, .card-body > .flex-wrap > button')
    const count = Math.min(await adders.count(), 8)
    for (let i = 0; i < count; i++)
      await adders
        .nth(i)
        .click({ timeout: 2000 })
        .catch(() => {})
    await a11y.waitForTimeout(500)
    nameless.push(
      ...(await a11y.evaluate((where) => {
        const doc = globalThis.document
        return [...doc.querySelectorAll('input, select, textarea')]
          .filter((el) => el.type !== 'hidden' && el.offsetParent !== null)
          .filter(
            (el) =>
              !el.labels?.length &&
              !el.getAttribute('aria-label') &&
              !el.getAttribute('aria-labelledby') &&
              !el.closest('label'),
          )
          .map((el) => `${where}: <${el.tagName.toLowerCase()} placeholder="${el.placeholder || ''}">`)
      }, step)),
    )
  }
  await ctx4.close()
  check('jedes Eingabefeld hat eine Beschriftung', nameless.length === 0, nameless.slice(0, 5).join(' | '))

  // --------------------------------------------------------- Betrieb ohne Netz
  // Am Showplatz gibt es oft kein Netz – genau dort wird die Mappe gebraucht.
  // Der Service Worker muss alles vorhalten, auch den nachgeladenen mermaid-Chunk.
  const ctx5 = await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'de-DE' })
  const offline = await ctx5.newPage()
  offline.on('pageerror', (e) => consoleErrors.push(`offline: ${e.message}`))
  offline.on('console', (m) => m.type() === 'error' && consoleErrors.push(`offline: ${m.text()}`))

  await offline.goto(BASE, { waitUntil: 'networkidle' })
  await offline.locator('button.card').nth(1).click()
  await offline.waitForURL('**/#/wizard/fahrzeug')
  await offline.fill('#make', 'Opel')
  await offline.fill('#model', 'Astra')
  await offline.getByRole('button', { name: 'SQ M – Master', exact: true }).click()
  await offline.waitForTimeout(800)
  const swActive = await offline.evaluate(() =>
    navigator.serviceWorker.ready.then((r) => Boolean(r.active)).catch(() => false),
  )
  await offline.waitForTimeout(2500) // Precache abwarten

  await ctx5.setOffline(true)
  await offline.reload({ waitUntil: 'load' }).catch(() => {})
  await offline.waitForTimeout(2500)
  const startsOffline = await offline
    .locator('header')
    .isVisible()
    .catch(() => false)
  const keepsProject = await offline
    .locator('header')
    .innerText()
    .then((text) => text.includes('Opel Astra'))
    .catch(() => false)

  await offline.goto(`${BASE}#/wizard/diagramme`)
  await offline.waitForTimeout(1000)
  await offline
    .getByRole('button', { name: /Signalquelle/ })
    .first()
    .click()
  await offline
    .getByRole('button', { name: /Endstufe/ })
    .first()
    .click()
  await offline.waitForTimeout(3000)
  const diagramsOffline = await offline.locator('.mermaid-host svg').count()

  await offline.goto(`${BASE}#/druck`)
  await offline.waitForTimeout(3000)
  const printOffline = await offline.locator('.print-page').count()
  await ctx5.close()

  check('Service Worker übernimmt', swActive)
  check('App startet ohne Netz und behält die Mappe', startsOffline && keepsProject)
  check('Diagramme rendern ohne Netz', diagramsOffline === 2, `${diagramsOffline} Diagramme`)
  check('Druckansicht baut ohne Netz auf', printOffline >= 3, `${printOffline} Seiten`)

  check('keine Konsolenfehler', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}

console.log(failures ? `\n${failures} E2E-Prüfung(en) fehlgeschlagen.` : '\nAlle E2E-Prüfungen bestanden.')
process.exit(failures ? 1 : 0)
