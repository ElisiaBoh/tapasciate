import { linkClickHandler } from '../../hooks/useRoute'
import './Header.css'

interface Props {
  scrolled?: boolean
  homePath?: string
}

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
