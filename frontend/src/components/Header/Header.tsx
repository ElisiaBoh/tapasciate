import { linkClickHandler } from '../../hooks/useRoute'
import './Header.css'

interface Props {
  scrolled?: boolean
  // Nella home il logo è l'h1 della pagina; nel dettaglio l'h1 è il titolo dell'evento
  isHome?: boolean
}

export default function Header({ scrolled = false, isHome = true }: Props) {
  const TitleTag = isHome ? 'h1' : 'div'
  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="header-content">
        <TitleTag className="site-title">
          <a href="/" className="logo-link" onClick={linkClickHandler('/')}>
            <img src={process.env.PUBLIC_URL + '/header.svg'} alt="Tapasciate" className="logo" />
          </a>
        </TitleTag>
      </div>
    </header>
  )
}
