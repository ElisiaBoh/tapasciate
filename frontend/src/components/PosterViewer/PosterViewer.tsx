import { useRef } from 'react'
import type { SyntheticEvent } from 'react'
import { useModal } from '../../hooks/useModal'
import Tile from '../Tile/Tile'
import type { Event } from '../../types'
import './PosterViewer.css'

interface Props {
  event: Event
  onClose: () => void
}

const stop = (e: SyntheticEvent) => e.stopPropagation()

// Locandina a schermo intero: pagine a larghezza piena, scorrevoli e ingrandibili con le dita
export default function PosterViewer({ event, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const { containerRef, onKeyDown } = useModal(closeRef, onClose)
  const pages = event.posterPages

  return (
    // Swipe e tasti restano qui: nel dettaglio sotto cambierebbero evento
    <div className="pv" role="dialog" aria-modal="true" aria-label={`Locandina ${event.title}`}
      ref={containerRef} onKeyDown={onKeyDown} onTouchStart={stop} onTouchEnd={stop}>
      <button type="button" className="pv-close" aria-label="Chiudi la locandina" ref={closeRef} onClick={onClose}>
        <Tile icon="close" />
      </button>
      <div className="pv-pages">
        {pages.map((page, i) => (
          <img key={page.url} src={page.url} width={page.width} height={page.height} decoding="async"
            alt={pages.length > 1 ? `Locandina ${event.title}, pagina ${i + 1} di ${pages.length}` : `Locandina ${event.title}`} />
        ))}
      </div>
    </div>
  )
}
