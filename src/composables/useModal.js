import { watch, nextTick, onScopeDispose } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Barrierefreie Modale: Escape schließt, der Fokus bleibt im Dialog gefangen
 * und wandert beim Schließen dorthin zurück, wo er herkam.
 *
 * @param {import('vue').Ref<boolean>} isOpen
 * @param {import('vue').Ref<HTMLElement|null>} panelRef
 * @param {() => void} onClose
 */
export function useModal(isOpen, panelRef, onClose) {
  let lastActive = null

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panelRef.value) return

    const items = [...panelRef.value.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
    if (!items.length) return

    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  watch(
    isOpen,
    async (open) => {
      if (open) {
        lastActive = document.activeElement
        document.addEventListener('keydown', onKeydown, true)
        await nextTick()
        const target = panelRef.value?.querySelector(FOCUSABLE)
        target?.focus()
      } else {
        document.removeEventListener('keydown', onKeydown, true)
        if (lastActive instanceof HTMLElement) lastActive.focus()
        lastActive = null
      }
    },
    { immediate: true },
  )

  // Wird die Komponente mit offenem Dialog entfernt (z. B. Seitenwechsel),
  // bliebe der Listener sonst am Dokument hängen.
  onScopeDispose(() => {
    document.removeEventListener('keydown', onKeydown, true)
  })
}
