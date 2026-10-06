import Icon, { type IconName } from '../Icon/Icon'
import './Tile.css'

interface Props {
  icon: IconName
  // Spenta (grigia): azione non disponibile
  off?: boolean
}

// Quadrato giallo con icona: l'elemento cliccabile è sempre il link/pulsante che lo contiene
export default function Tile({ icon, off = false }: Props) {
  return (
    <span className={`tile${off ? ' tile--off' : ''}`} aria-hidden="true">
      <Icon name={icon} />
    </span>
  )
}
