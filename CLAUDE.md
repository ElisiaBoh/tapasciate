# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tapasciate.it** is a website listing non-competitive walking races (tapasciate) in Italy. It has two independent components:
- **Frontend**: React SPA (TypeScript) displaying events fetched from Supabase
- **Scraper**: Python backend that scrapes race data from external sources and saves it to Supabase

## Commands

### Frontend (React)
```bash
cd frontend
npm install          # Install dependencies
npm start            # Dev server at http://localhost:3000
npm run build        # Production build → frontend/build/
npm test             # Run tests (Jest + React Testing Library)
```

### Scraper (Python)
```bash
source venv/bin/activate
cd scraper
python main.py       # Run all scrapers
pytest tests/        # Run tests
```

## Architecture

### Data Flow
1. GitHub Actions triggers `scraper/main.py` every Wednesday at 06:00 CEST
2. Scraper deletes past events from Supabase, then scrapes new ones from CSI Bergamo and FIASP Italia
3. Frontend reads events from Supabase and displays them filtered by province

### Frontend (`frontend/src/`)

**Component tree:**
```
App
├── Header          — logo e titolo; aggiunge classe CSS quando la pagina è scrollata
├── ProvinceFilter  — dropdown/pill per filtrare per provincia; disabilitato durante il caricamento
├── EventList       — lista eventi raggruppati per data
└── Footer
```

**Hooks e servizi:**
- **`hooks/useEvents.ts`**: gestisce tutto lo stato — fetching, filtraggio per provincia, raggruppamento per data. Espone: `status`, `groupedEvents`, `sortedDates`, `provinces`, `selectedProvince`, `setProvince`
- **`eventsService.ts`**: unico layer dati — chiama Supabase con JOIN su `locations`, mappa i campi al tipo `Event`
- **`supabaseClient.ts`**: istanza Supabase (URL e anon key sono pubbliche, ok commitarle)
- **`types/`**: tipi TypeScript condivisi (incluso `Event`)

**`status`** è un discriminated union con almeno tre stati: `loading`, `success`, `error`.

### Scraper (`scraper/`)
- `BaseScraper` abstract class in `scrapers/base.py` — tutti gli scraper la estendono
- Ogni scraper restituisce `list[Event]` (Pydantic model da `models/event.py`)
- `db/supabase_client.py` gestisce la logica di upsert usando l'URL dell'evento come chiave univoca
- `models/provinces.py` e `utils/region_mapper.py` normalizzano i dati di localizzazione

### Database Schema (Supabase/PostgreSQL)
- `locations`: id, city, province, province_name, region, created_at
- `events`: id, name, date, location_id, organizer, url, poster, distances, created_at, updated_at

### Deployment
- **Frontend**: Netlify, auto-deploy dal branch `main` (`base = "frontend"`)
- **Scraper**: GitHub Actions (`.github/workflows/scraper.yml`), usa i secret `SUPABASE_URL` e `SUPABASE_KEY`

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, CSS3, Create React App |
| Backend | Python 3.11, BeautifulSoup4, Pydantic |
| Database | Supabase (PostgreSQL) |
| Hosting | Netlify (frontend), GitHub Actions (scraper) |
| Testing | Jest + React Testing Library |
| Analytics | Google Tag Manager (GTM-W694RKFF) |

## Convenzioni

- **TypeScript**: tutto il frontend è in TypeScript. Non aggiungere file `.js` in `frontend/src/`
- **Componenti**: ogni componente ha la sua cartella in `components/` con file `.tsx` e `.css` dedicati
- **Niente routing library**: l'app è single-page senza React Router. Non introdurlo senza discussione
- **CSS**: nessun CSS-in-JS, nessun framework UI. Solo CSS modules o file `.css` plain
- **Test**: tutti i file relativi ai test (setup e `*.test.ts/tsx`) si trovano in `frontend/src/test/`
