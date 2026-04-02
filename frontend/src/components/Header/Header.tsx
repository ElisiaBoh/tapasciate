import './Header.css'

interface Props {
  scrolled?: boolean
}

export default function Header({ scrolled = false }: Props) {
  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="header-content">
        <h1 className="site-title">
          <img src={process.env.PUBLIC_URL + '/header.svg'} alt="Tapasciate" className="logo" />
        </h1>
      </div>
    </header>
  )
}
