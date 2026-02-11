import { useState, useEffect } from 'react'
import './App.css'
import { fetchEvents } from './services/eventsService'

function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState('')

  useEffect(() => {
    fetchEvents()
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
    const mesi = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 
                  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    
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
        <div className="header-content">
          <img src={process.env.PUBLIC_URL + "/header.svg"} alt="Logo Tapasciate" className="logo" />
        </div>
      </header>

      <div className="filters">
        <div className="filters-content">
          <select 
            value={selectedProvince} 
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="province-filter"
          >
            <option value="">Tutte le province</option>
            {provinces.map(province => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
      </div>

      <main className="events-container">
        {sortedDates.length > 0 ? (
          sortedDates.map((date, index) => (
            <div key={date} className={`date-section pattern-${index % 3}`}>
              {/* Header della sezione con data */}
              <div className="date-header">
                <div className="date-header-content">
                  <h2 className="date-title">
                    {formatSectionDate(date)}
                  </h2>
                  <span className="date-count">
                    {groupedEvents[date].length} tapasciate
                  </span>
                </div>
              </div>

              {/* Lista degli eventi per questa data */}
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
        <div className="footer-hero">
          <div className="footer-hero-placeholder">
            [Spazio riservato per immagine "Grazie Ciaoe Buona Domenica"]
          </div>
        </div>
        
        <div className="footer-content">
          <div className="footer-branding">
            <img 
              src={process.env.PUBLIC_URL + "/footer-logo.svg"} 
              alt="Tapasciate Logo" 
              className="footer-logo"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="footer-partners">
              <div>CóR</div>
              <div>nuovadot</div>
            </div>
          </div>
          
          <div className="footer-info">
            <p>Tapasciate.it è un progetto<br/>di CóR e NuovaDOt</p>
            <p>Nuova DOT srl<br/>04444540169</p>
            <p>via per Grumello 61<br/>24127 Bergamo</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function EventCard({ event }) {
  return (
    <>
      <div className="event-card">
        <div className="event-content">
          <div className="event-info">
            <h3 className="event-title">{event.title}</h3>
            
            <div className="event-details">
              <p className="event-location">
                {event.location.city} ({event.location.province})
              </p>
              
              <p className="event-date">
                {event.date}
              </p>
              
              {event.distances && event.distances.length > 0 && (
                <p className="event-distances">
                  km: {event.distances.join(' - ')}
                </p>
              )}
            </div>
          </div>

          <div className="event-actions">
            <span className="event-source">{event.source}</span>
            {event.poster && (
              <button 
                className="poster-button"
                onClick={() => window.open(event.poster, '_blank')}
              >
                poster
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="event-divider"></div>
    </>
  )
}

export default App
