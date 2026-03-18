import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="footer-credits">
          un progetto di{' '}
          <a href="https://cor.nuovadot.com" target="_blank" rel="noopener noreferrer">CóR</a>
          {' '}×{' '}
          <a href="https://nuovadot.com" target="_blank" rel="noopener noreferrer">NuovaDot</a>
        </span>
        <nav className="footer-links">
          <a href="/info.html">Info</a>
          <a href="/privacy.html">Privacy</a>
        </nav>
      </div>
    </footer>
  )
}
