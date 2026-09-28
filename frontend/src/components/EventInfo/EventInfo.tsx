import { formatDate } from '../../utils/formatDate'
import type { Event } from '../../types'
import './EventInfo.css'

interface Props {
  event: Event
  // stacked: etichetta sopra il valore (dettaglio); inline: etichetta accanto al valore (card della lista)
  layout: 'stacked' | 'inline'
}

export default function EventInfo({ event, layout }: Props) {
  const distances = event.distances.join(' - ')
  return (
    <dl className={`event-info event-info--${layout}`}>
      <div className="event-info-item">
        <dt className="event-info-label">Dove</dt>
        <dd className="event-info-value event-info-value--strong">
          {event.location.city} ({event.location.province})
        </dd>
      </div>
      <div className="event-info-item">
        <dt className="event-info-label">Quando</dt>
        <dd className="event-info-value">{formatDate(event.date)}</dd>
      </div>
      {distances && (
        <div className="event-info-item">
          <dt className="event-info-label">Percorso</dt>
          <dd className="event-info-value">km: {distances}</dd>
        </div>
      )}
    </dl>
  )
}
