import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Per ora leggiamo il JSON statico
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
        <h1>🏃‍♂️ Eventi di Corsa</h1>
        <p>Trova la tua prossima gara!</p>
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
  return (
    <div className="event-card">
      {/* Poster dell'evento */}
      {event.poster && (
        <div className="event-poster">
          <img src={event.poster} alt={event.title} />
        </div>
      )}
      
      <div className="event-content">
        <h3 className="event-title">{event.title}</h3>
        
        <div className="event-details">
          <p className="event-date">📅 {event.date}</p>
          <p className="event-location">
            📍 {event.location.city} ({event.location.province})
          </p>
          
          {/* Distanze disponibili */}
          {event.distances && event.distances.length > 0 && (
            <div className="event-distances">
              🏃 {event.distances.join(', ')}
            </div>
          )}
          
          {/* Fonte */}
          <p className="event-source">🏛️ {event.source}</p>
        </div>
      </div>
    </div>
  )
}

export default App