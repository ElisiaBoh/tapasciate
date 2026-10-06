import { useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import { formatDate, formatLongDate } from '../../utils/formatDate'
import { applyEventSeo, applyNoIndex } from '../../utils/eventSeo'
import { eventIcsFilename, eventIcsHref, eventMapsUrl, shareEvent } from '../../utils/eventActions'
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

function Poster({ event }: { event: Event }) {
  const pages = event.posterPages
  if (pages.length > 0) {
    return (
      <>
        {pages.map((page, i) => (
          <img
            key={page.url}
            src={page.url}
            width={page.width}
            height={page.height}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            alt={pages.length > 1 ? `Locandina ${event.title}, pagina ${i + 1} di ${pages.length}` : `Locandina ${event.title}`}
          />
        ))}
      </>
    )
  }

  return (
    <div className="ev-poster-placeholder">
      <strong>Locandina</strong>
      <span>non disponibile</span>
    </div>
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
  const [viewerOpen, setViewerOpen] = useState(false)
  useEffect(() => setViewerOpen(false), [event?.id])
  const index = event ? sameDayEvents.findIndex(e => e.id === event.id) : -1
  const prev = index > 0 ? sameDayEvents[index - 1] : undefined
  const next = index >= 0 && index < sameDayEvents.length - 1 ? sameDayEvents[index + 1] : undefined

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
      if (e.key === 'ArrowLeft' && prev) onSelect(prev)
      if (e.key === 'ArrowRight' && next) onSelect(next)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [prev, next, onSelect])

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

          <div className="ev-actions">
            <a className="ev-action" href={eventIcsHref(event)} download={eventIcsFilename(event)}>
              <Icon name="calendar" />
              <span>Calendario</span>
            </a>
            <a className="ev-action" href={eventMapsUrl(event)} target="_blank" rel="noopener noreferrer">
              <Icon name="pin" />
              <span>Mappa</span>
            </a>
            <ShareButton event={event} />
          </div>
        </div>

        {event.posterPages.length > 0 ? (
          <figure className="ev-poster">
            <button type="button" className="ev-poster-open" aria-label="Apri la locandina a schermo intero"
              onClick={() => setViewerOpen(true)}>
              <Poster event={event} />
              <span className="ev-poster-hint" aria-hidden="true">tocca per ingrandire</span>
            </button>
          </figure>
        ) : (
          <figure className="ev-poster">
            <Poster event={event} />
          </figure>
        )}
      </section>
      {viewerOpen && <PosterViewer event={event} onClose={() => setViewerOpen(false)} />}
    </main>
  )
}
