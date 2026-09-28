import { formatDate } from '../../utils/formatDate'
import EventCard from '../EventCard/EventCard'
import DateHeader from '../DateHeader/DateHeader'
import Divider from '../Divider/Divider'
import Skeleton from '../Skeleton/Skeleton'
import StatusMessage from '../StatusMessage/StatusMessage'
import type { Event, Status } from '../../types'
import './EventList.css'

interface Props {
  status: Status
  sortedDates: string[]
  groupedEvents: Record<string, Event[]>
}

function SkeletonList() {
  return (
    <>
      {[0, 1, 2].map(i => (
        <div key={i} className="date-section">
          <DateHeader loading />
          <div className="events-grid">
            {[0, 1].map(j => (
              <div key={j}>
                <div className="event-card">
                  <div className="event-content">
                    <Skeleton className="skeleton-event-title" />
                    <div className="event-details">
                      <Skeleton className="skeleton-event-line" />
                      <Skeleton className="skeleton-event-line skeleton-event-line--short" />
                    </div>
                  </div>
                </div>
                <Divider />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default function EventList({ status, sortedDates, groupedEvents }: Props) {
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
        <StatusMessage>Errore nel caricamento degli eventi. Riprova più tardi.</StatusMessage>
      </main>
    )
  }

  return (
    <main className="events-container">
      {sortedDates.length > 0 ? (
        sortedDates.map((date, index) => (
          <div key={date} className={`date-section pattern-${index % 3}`}>
            <DateHeader title={formatDate(date)} count={`${groupedEvents[date].length} tapasciate`} />
            <div className="events-grid">
              {groupedEvents[date].map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <StatusMessage>Nessun evento trovato per questa provincia.</StatusMessage>
      )}
    </main>
  )
}
