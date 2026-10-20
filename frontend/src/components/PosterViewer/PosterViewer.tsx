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

export default function PosterViewer({ event, onClose }: Props) {
  const { containerRef, onKeyDown } = useModal(onClose)
  const pages = event.posterPages

  return (
    // Keeps swipes and arrow keys from reaching the event detail underneath
    <div className="pv" role="dialog" aria-modal="true" aria-label={`Locandina ${event.title}`}
      tabIndex={-1} ref={containerRef} onKeyDown={onKeyDown} onTouchStart={stop} onTouchEnd={stop}>
      <button type="button" className="pv-close" aria-label="Chiudi la locandina" onClick={onClose}>
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
