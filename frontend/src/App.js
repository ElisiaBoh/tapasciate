import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState('')

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

  // Funzione per formattare la data per i titoli delle sezioni
  const formatSectionDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    const date = new Date(year, month - 1, day);
    
    const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    const dayName = giorni[date.getDay()];
    const dayNumber = parseInt(day);
    const monthName = mesi[parseInt(month) - 1];
    
    return `${dayName} ${dayNumber} ${monthName}`;
  };

  const filteredEvents = selectedProvince 
    ? events.filter(event => event.location.province === selectedProvince)
    : events;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const groupedEvents = filteredEvents
  .filter(event => {
    const [day, month, year] = event.date.split("/").map(Number);
    const eventDate = new Date(year, month - 1, day);
    return eventDate >= today;
  })
  .reduce((groups, event) => {
    const date = event.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA - dateB;
  });

  const provinces = [...new Set(events.map(event => event.location.province))].sort();

  if (loading) {
    return <div className="loading">Caricamento eventi...</div>
  }

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.svg" alt="Logo Eventi di Corsa" className="logo" />
      </header>

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
        
        <span className="events-count">
          {filteredEvents.length} eventi trovati
        </span>
      </div>

      <main className="events-container">
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <div key={date} className="date-section">
              {/* Header della sezione con data */}
              <div className="date-header">
                <h2 className="date-title">
                  📅 {formatSectionDate(date)}
                </h2>
                <span className="date-count">
                  {groupedEvents[date].length} eventi
                </span>
              </div>

              {/* Griglia degli eventi per questa data */}
              <div className="events-grid">
                {groupedEvents[date].map((event, index) => (
                  <EventCard key={index} event={event} />
                ))}
              </div>
            </div>
          ))
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