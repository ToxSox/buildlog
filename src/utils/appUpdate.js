import { ref } from 'vue'

/**
 * Brücke zwischen Service-Worker-Registrierung (main.js, außerhalb von Vue) und
 * der Oberfläche.
 *
 * Ohne sie merkte niemand, dass eine neue Version bereitsteht: Der Browser
 * fragt von sich aus nur beim Navigieren nach einem neuen Worker, und bis der
 * die Kontrolle übernimmt, liefert er weiter die alten Dateien aus. Auf dem
 * Showplatz hieß das: mehrmals neu laden und hoffen.
 */

/** true, sobald ein neuer Service Worker installiert ist und wartet. */
export const updateReady = ref(false)

let applyFn = null

export function setUpdater(fn) {
  applyFn = fn
}

/** Übernimmt die wartende Version und lädt die Seite neu. */
export function applyUpdate() {
  if (applyFn) applyFn(true)
}
