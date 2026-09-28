import { eventPath } from '../../utils/eventPath'
import { linkClickHandler } from '../../hooks/useRoute'
import type { Event } from '../../types'
import './DetailsButton.css'

interface Props {
  event: Event
}

export default function DetailsButton({ event }: Props) {
  const path = eventPath(event)
  return (
    <a className="details-button" href={path} onClick={linkClickHandler(path, { state: { fromList: true } })}>
      dettagli
    </a>
  )
}
