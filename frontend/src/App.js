import { useState, useEffect } from 'react'
import './App.css'

// Configurazione API
const API_BASE = 'http://localhost:3001/api';

function App() {
  const [events, setEvents] = useState([])
  const [provinces, setProvinces] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState('')
  const [error, setError] = useState(null)

  // 🆕 Carica le province solo una volta all'inizio
  const loadProvinces = async () => {
    try {
      const response = await fetch(`${API_BASE}/provinces`);
      const result = await response.json();
      
      if (result.success) {
        setProvinces(result.data);
      }
    } catch (error) {
      console.error('Errore nel caricare le province:', error);
    }
  };

  // Carica gli eventi dall'API
  const loadEvents = async (province = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const url = province 
        ? `${API_BASE}/events?province=${province}`
        : `${API_BASE}/events`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setEvents(result.data);
      } else {
        setError(result.error || 'Errore nel caricare gli eventi');
      }
    } catch (error) {
      console.error('Errore API:', error);
      setError('Impossibile connettersi al server');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Carica province e eventi al primo caricamento
  useEffect(() => {
    loadProvinces(); // Carica le province una sola volta
    loadEvents();    // Carica tutti gli eventi
  }, []);

  // Quando cambia la provincia selezionata
  const handleProvinceChange = (province) => {
    setSelectedProvince(province);
    loadEvents(province);
  };

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

  // Raggruppa eventi per data (ora arrivano già ordinati dal backend)
  const groupedEvents = events.reduce((groups, event) => {
    const date = event.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedEvents);

  if (loading) {
    return <div className="loading">Caricamento eventi...</div>
  }

  if (error) {
    return (
      <div className="error">
        <p>❌ {error}</p>
        <button onClick={() => loadEvents()} className="retry-button">
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <img src={process.env.PUBLIC_URL + "/logo.svg"} alt="Logo Eventi di Corsa" className="logo" />
      </header>

      <div className="filters">
        <select 
          value={selectedProvince} 
          onChange={(e) => handleProvinceChange(e.target.value)}
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
          {events.length} eventi trovati
        </span>
      </div>

      <main className="events-container">
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <div key={date} className="date-section">
              <div className="date-header">
                <h2 className="date-title">
                  📅 {formatSectionDate(date)}
                </h2>
                <span className="date-count">
                  {groupedEvents[date].length} eventi
                </span>
              </div>

              <div className="events-grid">
                {groupedEvents[date].map((event, index) => (
                  <EventCard key={`${date}-${index}`} event={event} />
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
  const formatDate = (dateString) => {
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