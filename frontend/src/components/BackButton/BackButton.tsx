import type { MouseEvent } from 'react'
import { navigate, type RouteState } from '../../hooks/useRoute'
import Tile from '../Tile/Tile'
import './BackButton.css'

interface Props {
  href: string
  label: string
}

export default function BackButton({ href, label }: Props) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    // Coming from the list, going back in history lets the browser restore the scroll position
    if ((window.history.state as RouteState | null)?.fromList) window.history.back()
    else navigate(href)
  }

  return (
    <nav className="back-bar" aria-label="Navigazione">
      <div className="back-bar-content">
        <a className="back-button" href={href} onClick={onClick}>
          <Tile icon="chevron-left" />
          <span>Torna a {label}</span>
        </a>
      </div>
    </nav>
  )
}
