import { useEffect, useRef, useState } from 'react'
import type { RefObject, TouchEvent } from 'react'
import { formatDate, formatLongDate } from '../../utils/formatDate'
import { posterAlt } from '../../utils/poster'
import { applyEventSeo, applyNoIndex } from '../../utils/eventSeo'
import { shareEvent } from '../../utils/eventActions'
import type { Event, Status } from '../../types'
import DateHeader from '../DateHeader/DateHeader'
import Icon from '../Icon/Icon'
import PosterViewer from '../PosterViewer/PosterViewer'
import Skeleton from '../Skeleton/Skeleton'
import StatusMessage from '../StatusMessage/StatusMessage'
import Tile from '../Tile/Tile'
import './EventDetail.css'

interface Props {
  status: Status
  event: Event | undefined
  sameDayEvents: Event[]
  zoneName: string
  onSelect: (event: Event) => void
}

const SWIPE_THRESHOLD = 60

interface PosterProps {
  event: Event
  figureRef: RefObject<HTMLElement | null>
  onOpen: (index: number) => void
}

function Poster({ event, figureRef, onOpen }: PosterProps) {
  const pages = event.posterPages
  if (pages.length === 0) {
    return (
      <figure className="ev-poster">
        <div className="ev-poster-placeholder">
          <strong>Locandina</strong>
          <span>non disponibile</span>
        </div>
      </figure>
    )
  }

  return (
    <figure className="ev-poster" ref={figureRef}>
      {pages.map((page, i) => (
        <button key={page.url} type="button" className="ev-poster-open" onClick={() => onOpen(i)}
          aria-label={pages.length > 1 ? `Apri la locandina a schermo intero, pagina ${i + 1} di ${pages.length}` : 'Apri la locandina a schermo intero'}>
          <img
            src={page.url}
            width={page.width}
            height={page.height}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            alt={posterAlt(event.title, i, pages.length)}
          />
        </button>
      ))}
    </figure>
  )
}

function ShareButton({ event }: { event: Event }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const onClick = async () => {
    if (await shareEvent(event) === 'copied') setCopied(true)
  }

  return (
    <button type="button" className="ev-action" onClick={onClick}>
      <Icon name="share" />
      <span aria-live="polite">{copied ? 'Link copiato' : 'Condividi'}</span>
    </button>
  )
}

export default function EventDetail({ status, event, sameDayEvents, zoneName, onSelect }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const viewerOpen = viewerIndex !== null
  const posterRef = useRef<HTMLElement>(null)
  useEffect(() => setViewerIndex(null), [event?.id])
  const index = event ? sameDayEvents.findIndex(e => e.id === event.id) : -1
  const prev = index > 0 ? sameDayEvents[index - 1] : undefined
  const next = index >= 0 && index < sameDayEvents.length - 1 ? sameDayEvents[index + 1] : undefined

  useEffect(() => {
    if (viewerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
      if (e.key === 'ArrowLeft' && prev) onSelect(prev)
      if (e.key === 'ArrowRight' && next) onSelect(next)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [prev, next, onSelect, viewerOpen])

  useEffect(() => {
    if (event) return applyEventSeo(event)
    if (status === 'success') return applyNoIndex()
  }, [event, status])

  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -SWIPE_THRESHOLD && next) onSelect(next)
    if (dx > SWIPE_THRESHOLD && prev) onSelect(prev)
  }

  if (status === 'loading') {
    return (
      <main className="ev-page">
        <DateHeader loading />
        <div className="ev-switcher">
          <Skeleton className="ev-skeleton-title" />
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="ev-page">
        <StatusMessage>Errore nel caricamento dell'evento. Riprova più tardi.</StatusMessage>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="ev-page">
        <StatusMessage>Tapasciata non trovata: potrebbe essere già passata o non più in calendario.</StatusMessage>
      </main>
    )
  }

  const distances = event.distances.join(' - ')

  return (
    <main className="ev-page" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <DateHeader
        titleAs="span"
        title={formatDate(event.date)}
        count={index >= 0 ? `${zoneName} · ${index + 1} di ${sameDayEvents.length}` : undefined}
      />

      <section className="ev-switcher" aria-label={`Scorri le tapasciate di questa data (${zoneName})`}>
        <button type="button" className="ev-arrow" aria-label="Tapasciata precedente"
          disabled={!prev} onClick={() => prev && onSelect(prev)}>
          <Tile icon="chevron-left" disabled={!prev} />
        </button>
        <h1 className="ev-title" aria-live="polite">{event.title}</h1>
        <button type="button" className="ev-arrow" aria-label="Tapasciata successiva"
          disabled={!next} onClick={() => next && onSelect(next)}>
          <Tile icon="chevron-right" disabled={!next} />
        </button>
      </section>

      <section className="ev-body">
        <div className="ev-side">
          <div className="ev-info">
            <div className="ev-group">
              <span className="ev-label">Dove</span>
              <p className="ev-location">{event.location.city} ({event.location.province})</p>
            </div>
            <div className="ev-group">
              <span className="ev-label">Quando</span>
              <p>{formatLongDate(event.date)}</p>
            </div>
            {distances && (
              <div className="ev-group">
                <span className="ev-label">Percorsi</span>
                <p>{distances} km</p>
              </div>
            )}
          </div>

          <ShareButton event={event} />
        </div>

        <Poster event={event} figureRef={posterRef} onOpen={setViewerIndex} />
      </section>
      {viewerIndex !== null && (
        <PosterViewer key={`${event.id}-${viewerIndex}`} event={event} index={viewerIndex} thumbnails={posterRef}
          onClose={() => setViewerIndex(null)} />
      )}
    </main>
  )
}
