import Icon, { type IconName } from '../Icon/Icon'
import './Tile.css'

interface Props {
  icon: IconName
  disabled?: boolean
}

export default function Tile({ icon, disabled = false }: Props) {
  return (
    <span className={`tile${disabled ? ' tile--disabled' : ''}`} aria-hidden="true">
      <Icon name={icon} />
    </span>
  )
}
