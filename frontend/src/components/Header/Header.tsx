import { linkClickHandler } from '../../hooks/useRoute'
import './Header.css'

interface Props {
  scrolled?: boolean
  // Dove porta il logo: la zona ricordata dell'utente, o "/" (tutta Italia)
  homePath?: string
}

// L'h1 della pagina è il titolo della lista o dell'evento: il logo è solo un link
export default function Header({ scrolled = false, homePath = '/' }: Props) {
  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="header-content">
        <a href={homePath} className="logo-link" onClick={linkClickHandler(homePath)} aria-label="Tapasciate.it, home">
          <img src={process.env.PUBLIC_URL + '/header.svg'} alt="Tapasciate" className="logo" />
        </a>
      </div>
    </header>
  )
}
