import DetailsButton from '../DetailsButton/DetailsButton'
import Divider from '../Divider/Divider'
import EventInfo from '../EventInfo/EventInfo'
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
            <EventInfo event={event} layout="inline" />
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
