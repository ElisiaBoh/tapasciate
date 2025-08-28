import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState('') // Filtro provincia

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

  // Filtra gli eventi per provincia
  const filteredEvents = selectedProvince 
    ? events.filter(event => event.location.province === selectedProvince)
    : events;

  // Ottieni tutte le province uniche per il dropdown
  const provinces = [...new Set(events.map(event => event.location.province))].sort();

  if (loading) {
    return <div className="loading">Caricamento eventi...</div>
  }

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.jpg" alt="Logo Eventi di Corsa" className="logo" />
      </header>

      {/* Filtro provincia */}
      <div className="filters">
        <select 
          value={selectedProvince} 
          onChange={(e) => setSelectedProvince(e.target.value)}
          className="province-filter"
        >
          <option value="">🌍 Tutte le province</option>
          {provinces.map(province => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
        
        {/* Mostra il numero di eventi */}
        <span className="events-count">
          {filteredEvents.length} eventi trovati
        </span>
      </div>

      <main className="events-container">
        {filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map((event, index) => (
              <EventCard key={index} event={event} />
            ))}
          </div>
        ) : (
          <div className="no-events">
            <p>Nessun evento trovato per questa provincia.</p>
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