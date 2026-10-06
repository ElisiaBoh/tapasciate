import { formatDate } from '../../utils/formatDate'
import EventCard from '../EventCard/EventCard'
import DateHeader from '../DateHeader/DateHeader'
import Skeleton from '../Skeleton/Skeleton'
import StatusMessage from '../StatusMessage/StatusMessage'
import type { Event, Status } from '../../types'
import './EventList.css'

interface Props {
  status: Status
  sortedDates: string[]
  groupedEvents: Record<string, Event[]>
  listPath: string
  emptyMessage: string
}

export function countLabel(count: number): string {
  return count === 1 ? '1 tapasciata' : `${count} tapasciate`
}

function SkeletonList() {
  return (
    <>
      {[0, 1, 2].map(i => (
        <section key={i} className="date-section">
          <DateHeader loading />
          <div className="events-grid">
            {[0, 1].map(j => (
              <div key={j} className="event-card">
                <div className="event-card-body">
                  <Skeleton className="skeleton-event-title" />
                  <Skeleton className="skeleton-event-line" />
                  <Skeleton className="skeleton-event-line skeleton-event-line--short" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export default function EventList({ status, sortedDates, groupedEvents, listPath, emptyMessage }: Props) {
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
        sortedDates.map(date => (
          <section key={date} className="date-section">
            <DateHeader title={formatDate(date)} count={countLabel(groupedEvents[date].length)} />
            <div className="events-grid">
              {groupedEvents[date].map(event => (
                <EventCard key={event.id} event={event} listPath={listPath} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className="events-empty">{emptyMessage}</p>
      )}
    </main>
  )
}
