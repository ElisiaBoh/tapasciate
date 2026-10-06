import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'

const FOCUSABLE = 'a[href], button:not(:disabled)'

export function useModal(onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    containerRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    // Keeps arrow keys from reaching the event detail underneath
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation()
    if (e.key !== 'Tab' || !containerRef.current) return
    const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === containerRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return { containerRef, onKeyDown }
}
