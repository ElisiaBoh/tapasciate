import './Header.css'

interface Props {
  scrolled?: boolean
}

export default function Header({ scrolled = false }: Props) {
  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="header-content">
        <img src={process.env.PUBLIC_URL + '/header.svg'} alt="Logo Tapasciate" className="logo" />
      </div>
    </header>
  )
}
