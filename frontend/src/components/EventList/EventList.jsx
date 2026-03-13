import { formatDate } from '../../utils/formatDate'
import EventCard from '../EventCard/EventCard'
import './EventList.css'

function SkeletonList() {
  return (
    <>
      {[0, 1, 2].map(i => (
        <div key={i} className="date-section">
          <div className="date-header">
            <div className="date-header-content">
              <div className="skeleton skeleton-date-title" />
              <div className="skeleton skeleton-date-count" />
            </div>
          </div>
          <div className="events-grid">
            {[0, 1].map(j => (
              <div key={j}>
                <div className="event-card">
                  <div className="event-content">
                    <div className="skeleton skeleton-event-title" />
                    <div className="event-details">
                      <div className="skeleton skeleton-event-line" />
                      <div className="skeleton skeleton-event-line skeleton-event-line--short" />
                    </div>
                  </div>
                </div>
                <div className="event-divider" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default function EventList({ status, sortedDates, groupedEvents }) {
  if (status === 'loading') {
    return (
      <main className="events-container">
        <SkeletonList />
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="events-container">
        <div className="no-events">
          <p>Errore nel caricamento degli eventi. Riprova più tardi.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="events-container">
      {sortedDates.length > 0 ? (
        sortedDates.map((date, index) => (
          <div key={date} className={`date-section pattern-${index % 3}`}>
            <div className="date-header">
              <div className="date-header-content">
                <h2 className="date-title">{formatDate(date)}</h2>
                <span className="date-count">{groupedEvents[date].length} tapasciate</span>
              </div>
            </div>
            <div className="events-grid">
              {groupedEvents[date].map((event, i) => (
                <EventCard key={i} event={event} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="no-events">
          <p>Nessun evento trovato per questa provincia.</p>
        </div>
      )}
    </main>
  )
}
