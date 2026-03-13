import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <img src={process.env.PUBLIC_URL + '/header.svg'} alt="Logo Tapasciate" className="logo" />
      </div>
    </header>
  )
}
