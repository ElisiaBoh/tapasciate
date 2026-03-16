# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tapasciate.it** is a website listing orienteering races in Italy. It has two independent components:
- **Frontend**: React SPA displaying events fetched from Supabase
- **Scraper**: Python backend that scrapes race data from external sources and saves it to Supabase

## Commands

### Frontend (React)
```bash
cd frontend
npm install          # Install dependencies
npm start            # Dev server at http://localhost:3000
npm run build        # Production build → frontend/build/
npm test             # Run tests
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
- **Single component app**: `App.js` handles all state, filtering, and rendering — no routing library
- **`eventsService.js`**: Only data layer — fetches events from Supabase with location JOIN, converts dates from `YYYY-MM-DD` to `DD/MM/YYYY`
- **`supabaseClient.js`**: Supabase client instance (URL and anon key are public/safe to commit)
- Netlify handles deployment; `netlify.toml` configures build and SPA catch-all redirect

### Scraper (`scraper/`)
- `BaseScraper` abstract class in `scrapers/base.py` — all scrapers extend this
- Each scraper returns `list[Event]` (Pydantic model from `models/event.py`)
- `db/supabase_client.py` handles upsert logic using the event URL as unique key
- `models/provinces.py` and `utils/region_mapper.py` normalize location data

### Database Schema (Supabase/PostgreSQL)
- `locations`: id, city, province, region, created_at
- `events`: id, name, date, location_id, organizer, url, poster, distances, created_at, updated_at

### Deployment
- **Frontend**: Netlify, auto-deploys from `main` branch (`base = "frontend"`)
- **Scraper**: GitHub Actions (`.github/workflows/scraper.yml`), uses `SUPABASE_URL` and `SUPABASE_KEY` secrets

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, CSS3, Create React App |
| Backend | Python 3.11, BeautifulSoup4, Pydantic |
| Database | Supabase (PostgreSQL) |
| Hosting | Netlify (frontend), GitHub Actions (scraper) |
| Analytics | Google Tag Manager (GTM-W694RKFF) |
