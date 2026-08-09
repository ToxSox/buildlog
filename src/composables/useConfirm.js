import { ref } from 'vue'

/**
 * Rückfrage vor unwiderruflichen Schritten.
 *
 * Ersetzt `window.confirm`: Das ist unstilisiert, seine Knopfbeschriftungen
 * lassen sich nicht übersetzen, es blockiert den Hauptstrang und erscheint auf
 * iOS als System-Blatt außerhalb der Bildsprache der App.
 *
 * Bewusst ein modulweiter Zustand mit einem einzigen Dialog in `App.vue`, nicht
 * eine Komponente je Aufrufstelle: `ImageCard` und `ItemList` stehen dutzendfach
 * auf einer Seite – das wären dutzende Dialoge im Baum, nur damit einer davon
 * irgendwann aufgeht. So bleibt jede Aufrufstelle eine Zeile, und dass immer
 * höchstens eine Rückfrage offen ist, ergibt sich von selbst. Denselben Weg
 * geht `i18n/index.js` bereits mit der Sprache.
 */
const request = ref(null)
let resolver = null

function settle(answer) {
  request.value = null
  const resolve = resolver
  resolver = null
  resolve?.(answer)
}

/**
 * @param {{ title?: string, message: string, confirmLabel?: string }} options
 * @returns {Promise<boolean>} true, wenn bestätigt wurde
 */
export function confirmAction(options) {
  // Eine noch offene Rückfrage gilt als abgelehnt – sonst bliebe ihr Aufrufer
  // für immer im `await` hängen.
  if (resolver) settle(false)
  return new Promise((resolve) => {
    resolver = resolve
    request.value = options
  })
}

export function useConfirm() {
  return { confirm: confirmAction }
}

/** Nur für den einen Dialog in `App.vue`. */
export function useConfirmHost() {
  return {
    request,
    accept: () => settle(true),
    cancel: () => settle(false),
  }
}
