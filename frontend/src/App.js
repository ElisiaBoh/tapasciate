import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/events.json')
      .then(response => response.json())
      .then(data => {
        setEvents(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Errore nel caricare gli eventi:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="loading">Caricamento eventi...</div>
  }

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.jpg" alt="Logo Tapasciate.it" className="logo" />
      </header>

      <main className="events-container">
        {events.length > 0 ? (
          <div className="events-grid">
            {events.map((event, index) => (
              <EventCard key={index} event={event} />
            ))}
          </div>
        ) : (
          <div className="no-events">
            <p>Nessun evento trovato.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Aggiornato ogni mercoledì</p>
      </footer>
    </div>
  )
}

function EventCard({ event }) {
  // Funzione per formattare la data
  const formatDate = (dateString) => {
    // dateString è in formato "10/08/2025" (DD/MM/YYYY)
    const [day, month, year] = dateString.split('/');
    const date = new Date(year, month - 1, day); // month - 1 perché i mesi partono da 0
    
    const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    const dayName = giorni[date.getDay()];
    const dayNumber = parseInt(day);
    const monthName = mesi[parseInt(month) - 1];
    
    return `${dayName} ${dayNumber} ${monthName}`;
  };

  return (
    <div className="event-card">
      <div className="event-content">
        <h3 className="event-title">{event.title}</h3>
        
        <div className="event-details">
          <p className="event-date">📅 {formatDate(event.date)}</p>
          <p className="event-location">
            📍 {event.location.city} ({event.location.province})
          </p>
          
          {event.distances && event.distances.length > 0 && (
            <div className="event-distances">
              🏃 {event.distances.join(', ')}
            </div>
          )}
          
          <p className="event-source">🏛️ {event.source}</p>
        </div>

        {event.poster && (
          <button 
            className="poster-button"
            onClick={() => window.open(event.poster, '_blank')}
          >
            🖼️ Vedi Poster
          </button>
        )}
      </div>
    </div>
  )
}

export default App