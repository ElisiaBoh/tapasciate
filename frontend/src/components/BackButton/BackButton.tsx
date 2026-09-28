import type { MouseEvent } from 'react'
import { navigate, type RouteState } from '../../hooks/useRoute'
import './BackButton.css'

export default function BackButton() {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    // Se si arriva dalla lista si torna indietro nella history, così il browser ripristina lo scroll
    if ((window.history.state as RouteState | null)?.fromList) window.history.back()
    else navigate('/')
  }

  return (
    <a className="back-button" href="/" onClick={onClick}>
      ← lista
    </a>
  )
}
