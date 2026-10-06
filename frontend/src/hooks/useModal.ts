import { useEffect, useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'

// Comportamento comune delle finestre modali: focus iniziale (restituito a chi ha aperto alla
// chiusura), pagina sotto bloccata, Esc per chiudere e Tab che resta dentro la finestra.
export function useModal(initialFocusRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    initialFocusRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [initialFocusRef])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    // Le frecce non devono arrivare alla pagina sotto (nel dettaglio cambierebbero evento)
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation()
    if (e.key !== 'Tab' || !containerRef.current) return
    const focusable = containerRef.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return { containerRef, onKeyDown }
}
