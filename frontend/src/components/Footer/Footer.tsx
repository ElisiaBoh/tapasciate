import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-branding">
          <img
            src={process.env.PUBLIC_URL + '/footer-logo.svg'}
            alt="Tapasciate Logo"
            className="footer-logo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="footer-partners">
            <a href="https://cor.nuovadot.com" target="_blank" rel="noopener noreferrer" className="footer-partner-cor">
              <img src={process.env.PUBLIC_URL + '/cor-logo.svg'} alt="CóR" className="footer-cor-logo" />
            </a>
            <a href="https://nuovadot.com" target="_blank" rel="noopener noreferrer" className="footer-partner-nuovadot">nuovadot</a>
          </div>
        </div>

        <div className="footer-info">
          <p>Tapasciate.it è un progetto di CóR e NuovaDOt</p>
          <p>Nuova DOT srl<br />04444540169<br />via per Grumello 61<br />24127 Bergamo</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-sources">
          Dati raccolti da{' '}
          <a href="https://www.csibergamo.it" target="_blank" rel="noopener noreferrer">CSI Bergamo</a>
          {' '}e{' '}
          <a href="https://servizi.fiaspitalia.it/www_eventi.php" target="_blank" rel="noopener noreferrer">FIASP Italia</a>.
          Tutti i diritti sui dati appartengono ai rispettivi siti.
        </p>
        <a href="/privacy.html" className="footer-privacy">Privacy Policy</a>
      </div>
    </footer>
  )
}
