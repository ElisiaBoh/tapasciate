import { formatDate } from '../../utils/formatDate'
import './EventCard.css'

export default function EventCard({ event }) {
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
            {event.distances && event.distances.length > 0 && (
              <p className="event-distances">
                km: {event.distances.join(' - ')}
              </p>
            )}
          </div>

          <div className="event-actions">
            {event.poster && (
              <button
                className="poster-button"
                onClick={() => window.open(event.poster, '_blank')}
              >
                poster
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="event-divider" />
    </>
  )
}
