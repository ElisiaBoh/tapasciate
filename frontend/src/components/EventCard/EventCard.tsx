import { eventPath } from '../../utils/eventPath'
import { linkClickHandler } from '../../hooks/useRoute'
import Tile from '../Tile/Tile'
import type { Event } from '../../types'
import './EventCard.css'

interface Props {
  event: Event
  listPath: string
}

export default function EventCard({ event, listPath }: Props) {
  const path = eventPath(event)
  return (
    <a className="event-card" href={path}
      onClick={linkClickHandler(path, { state: { fromList: true, listPath } })}>
      <span className="event-card-body">
        <h3 className="event-title">{event.title}</h3>
        <span className="event-location">{event.location.city} ({event.location.province})</span>
        {event.distances.length > 0 && (
          <span className="event-distances">{event.distances.join(' - ')} km</span>
        )}
      </span>
      <Tile icon="chevron-right" />
    </a>
  )
}
