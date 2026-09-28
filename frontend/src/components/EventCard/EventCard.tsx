import { formatDate } from '../../utils/formatDate'
import DetailsButton from '../DetailsButton/DetailsButton'
import Divider from '../Divider/Divider'
import type { Event } from '../../types'
import './EventCard.css'

interface Props {
  event: Event
}

export default function EventCard({ event }: Props) {
  return (
    <>
      <div className="event-card">
        <div className="event-content">
          <h3 className="event-title">{event.title}</h3>

          <div className="event-details">
            <p className="event-location">
              {event.location.city} ({event.location.province})
            </p>
            <p className="event-date">
              {formatDate(event.date)}
            </p>
            {event.distances.length > 0 && (
              <p className="event-distances">
                km: {event.distances.join(' - ')}
              </p>
            )}
          </div>

          <div className="event-actions">
            <DetailsButton event={event} />
          </div>
        </div>
      </div>
      <Divider />
    </>
  )
}
