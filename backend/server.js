const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001; // Porta diversa dal React (3000)

// Middleware
app.use(cors()); // Permette chiamate dal frontend React
app.use(express.json());

// Funzione per leggere gli eventi dal JSON
const getEventsFromFile = () => {
  try {
    const eventsPath = path.join(__dirname, 'events.json');
    const eventsData = fs.readFileSync(eventsPath, 'utf8');
    return JSON.parse(eventsData);
  } catch (error) {
    console.error('Errore nel leggere events.json:', error);
    return [];
  }
};

// Funzione per filtrare gli eventi
const filterEvents = (events, filters = {}) => {
  let filteredEvents = [...events];

  // Filtra per provincia
  if (filters.province && filters.province !== '') {
    filteredEvents = filteredEvents.filter(event => 
      event.location.province === filters.province
    );
  }

  // Filtra per città (futuro)
  if (filters.city && filters.city !== '') {
    filteredEvents = filteredEvents.filter(event => 
      event.location.city.toLowerCase().includes(filters.city.toLowerCase())
    );
  }

  // Filtra per data (futuro)
  if (filters.dateFrom || filters.dateTo) {
    // Implementazione futura per range di date
  }

  return filteredEvents;
};

// Funzione per ordinare gli eventi per data
const sortEventsByDate = (events) => {
  return events.sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('/').map(Number);
    const [dayB, monthB, yearB] = b.date.split('/').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA - dateB;
  });
};

// ROTTE API

// GET /api/events - Ottieni tutti gli eventi (con filtri opzionali)
app.get('/api/events', (req, res) => {
  try {
    const { province, city, sortBy } = req.query;
    
    // Leggi eventi dal file
    let events = getEventsFromFile();
    
    // Applica filtri
    events = filterEvents(events, { province, city });
    
    // Ordina per data (default)
    if (!sortBy || sortBy === 'date') {
      events = sortEventsByDate(events);
    }

    // Statistiche utili
    const stats = {
      total: events.length,
      provinces: [...new Set(events.map(e => e.location.province))].sort(),
      cities: [...new Set(events.map(e => e.location.city))].sort(),
    };

    res.json({
      success: true,
      data: events,
      stats: stats,
      filters: { province, city, sortBy }
    });
    
  } catch (error) {
    console.error('Errore API /events:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricare gli eventi'
    });
  }
});

// GET /api/provinces - Ottieni lista delle province
app.get('/api/provinces', (req, res) => {
  try {
    const events = getEventsFromFile();
    const provinces = [...new Set(events.map(event => event.location.province))].sort();
    
    res.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore nel caricare le province'
    });
  }
});

// GET /api/stats - Statistiche generali
app.get('/api/stats', (req, res) => {
  try {
    const events = getEventsFromFile();
    
    const stats = {
      totalEvents: events.length,
      provinces: [...new Set(events.map(e => e.location.province))].length,
      cities: [...new Set(events.map(e => e.location.city))].length,
      sources: [...new Set(events.map(e => e.source))],
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolare le statistiche'
    });
  }
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Backend API attivo su http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponibili:`);
  console.log(`   GET /api/events?province=BG`);
  console.log(`   GET /api/provinces`);
  console.log(`   GET /api/stats`);
});