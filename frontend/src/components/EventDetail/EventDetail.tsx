import { useEffect, useRef } from 'react'
import type { TouchEvent } from 'react'
import { formatDate } from '../../utils/formatDate'
import type { Event, Status } from '../../types'
import DateHeader from '../DateHeader/DateHeader'
import Divider from '../Divider/Divider'
import Skeleton from '../Skeleton/Skeleton'
import StatusMessage from '../StatusMessage/StatusMessage'
import './EventDetail.css'

interface Props {
  status: Status
  event: Event | undefined
  // Eventi futuri filtrati per provincia, nell'ordine della lista: le frecce scorrono questi
  events: Event[]
  selectedProvince: string
  onSelect: (event: Event) => void
}

const SWIPE_THRESHOLD = 60

function ArrowIcon({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"
      strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d={direction === 'prev' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} />
    </svg>
  )
}

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

  // Ripiego per le locandine non ancora convertite in immagini dallo scraper
  if (event.poster) {
    return (
      <object data={event.poster} type="application/pdf" aria-label={`Locandina ${event.title}`}>
        <div className="ev-poster-placeholder">
          <strong>Locandina</strong>
          <span>non visualizzabile su questo dispositivo</span>
        </div>
      </object>
    )
  }

  return (
    <div className="ev-poster-placeholder">
      <strong>Locandina</strong>
      <span>non disponibile</span>
    </div>
  )
}

export default function EventDetail({ status, event, events, selectedProvince, onSelect }: Props) {
  const index = event ? events.findIndex(e => e.id === event.id) : -1
  const prev = index > 0 ? events[index - 1] : undefined
  const next = index >= 0 && index < events.length - 1 ? events[index + 1] : undefined

  // Cambiando provincia, se l'evento corrente non è tra i risultati si passa al primo disponibile
  const prevProvinceRef = useRef(selectedProvince)
  useEffect(() => {
    if (prevProvinceRef.current === selectedProvince) return
    prevProvinceRef.current = selectedProvince
    if (index === -1 && events.length > 0) onSelect(events[0])
  }, [selectedProvince, index, events, onSelect])

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
    if (!event) return
    const previousTitle = document.title
    document.title = `${event.title} — Tapasciate.it`
    return () => { document.title = previousTitle }
  }, [event])

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

  if (index === -1 && selectedProvince && events.length === 0) {
    return (
      <main className="ev-page">
        <StatusMessage>Nessuna tapasciata in questa provincia.</StatusMessage>
      </main>
    )
  }

  const distances = event.distances.join(' - ')

  return (
    <main className="ev-page" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <DateHeader
        titleAs="span"
        title={formatDate(event.date)}
        count={index >= 0 ? `${index + 1} / ${events.length}` : undefined}
      />

      <section className="ev-switcher" aria-label="Scorri le tapasciate">
        <button className="ev-arrow" aria-label="Tapasciata precedente"
          disabled={!prev} onClick={() => prev && onSelect(prev)}>
          <ArrowIcon direction="prev" />
        </button>
        <h1 className="ev-title" aria-live="polite">{event.title}</h1>
        <button className="ev-arrow" aria-label="Tapasciata successiva"
          disabled={!next} onClick={() => next && onSelect(next)}>
          <ArrowIcon direction="next" />
        </button>
      </section>
      <Divider />

      <section className="ev-body">
        <div className="ev-info">
          <div className="ev-group">
            <span className="ev-label">Dove</span>
            <p className="ev-location">{event.location.city} ({event.location.province})</p>
          </div>
          <div className="ev-group">
            <span className="ev-label">Quando</span>
            <p>{formatDate(event.date)}</p>
          </div>
          {distances && (
            <div className="ev-group">
              <span className="ev-label">Percorso</span>
              <p>km: {distances}</p>
            </div>
          )}
        </div>

        <figure className="ev-poster">
          <Poster event={event} />
        </figure>
      </section>
    </main>
  )
}
