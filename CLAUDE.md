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
npm test             # Run unit/integration tests (Jest + React Testing Library)
npm run test:e2e     # Run E2E tests (Playwright, richiede dev server o lo avvia in automatico)
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
2. Scraper deletes past events from Supabase, then scrapes new ones from CSI Bergamo and FIASP Italia; events no longer listed by a source are marked `removed_at` (hidden, not deleted)
3. Frontend reads events from Supabase and displays them by zone (Italy, region or province) and period

### Frontend (`frontend/src/`)

**Component tree:**
```
App                 — sceglie la vista dall'URL: `/` (Italia), `/<regione>`, `/<regione>/<provincia>` → lista; `/evento/<id>-<slug>` → dettaglio
├── Header          — logo (link alla zona ricordata o a `/`); aggiunge classe CSS quando la pagina è scrollata
├── ZoneBar         — lista: pulsante zona (apre ZonePicker), periodo (Tutte / Questa settimana / Prossima settimana), titolo h1 con conteggi
├── ZonePicker      — finestra modale "Scegli la zona": regioni a fisarmonica e province con i conteggi
├── EventList       — lista eventi raggruppati per data (EventCard: tutta la card è il link al dettaglio)
├── BackButton      — dettaglio: barra "Torna a <zona>"
├── EventDetail     — dettaglio evento; frecce/tasti/swipe scorrono gli eventi della stessa zona e data; Calendario/Mappa/Condividi; PosterViewer
└── Footer
```

Componenti condivisi (ognuno porta il suo CSS, non usare le loro classi senza importarli): `DateHeader` (striscia rosa), `Icon` (icone a tratto), `Tile` (quadrato giallo con icona), `Skeleton`, `StatusMessage` (messaggi di errore).

**Zone e navigazione:**
- Una zona (`Zone` in `types/`) è Italia, regione o provincia; gli slug degli URL vengono da `region` e `province_name` dei dati (`utils/zonePath.ts`: `zonePath`, `parseRoute`, `resolveZone`). Una zona senza eventi futuri risulta "non trovata" (noindex)
- `utils/zones.ts`: catalogo regioni/province con conteggi (`buildCatalog`), filtri e testi ("Tapasciate in provincia di Bergamo", articoli delle regioni)
- `utils/period.ts`: "questa settimana" = da oggi a domenica, "prossima" = lunedì–domenica successivi; il periodo non va nell'URL
- La zona scelta in ZonePicker è ricordata nel localStorage (`utils/savedZone.ts`): aprendo `/` si viene reindirizzati lì e il logo punta lì. Aprire un link a una zona non la cambia
- Il dettaglio prende la zona dalla lista di provenienza (`zonePath` nello stato della history, messo da EventCard) o, se aperto da link, dalla provincia dell'evento

**Hooks e servizi:**
- **`hooks/useEvents.ts`**: `useEvents` gestisce il fetching ed espone `status`, `events`, `upcomingEvents`, `catalog`, `today`; `useZoneEvents` filtra per zona e periodo e raggruppa per data
- **`hooks/useRoute.ts`**: router minimale senza librerie (`usePathname`, `useHistoryState`, `navigate`, `linkClickHandler`) basato su History API; Netlify reindirizza già `/*` su `index.html`
- **`hooks/useModal.ts`**: focus, Esc, Tab e blocco scroll comuni alle finestre modali
- **`utils/eventPath.ts`**: costruisce/parsa gli URL `/evento/<id>-<slug>` (l'id è quello della tabella `events`)
- **`utils/eventSeo.ts`** / **`utils/zoneSeo.ts`**: title, canonical e meta delle pagine evento e zona; `scripts/sitemap.js` duplica `eventPath`/`zonePaths` (verificato dai test)
- **`eventsService.ts`**: unico layer dati — chiama Supabase con JOIN su `locations`, mappa i campi al tipo `Event`
- **`supabaseClient.ts`**: istanza Supabase (URL e anon key sono pubbliche, ok commitarle)
- **`types/`**: tipi TypeScript condivisi (incluso `Event`, `Zone`, `Period`)

**`status`** è un discriminated union con almeno tre stati: `loading`, `success`, `error`.

### Scraper (`scraper/`)
- `BaseScraper` abstract class in `scrapers/base.py` — tutti gli scraper la estendono
- Ogni scraper restituisce `list[Event]` (Pydantic model da `models/event.py`)
- `db/supabase_client.py` gestisce la logica di upsert usando `(source, source_id)` come chiave univoca: `source_id` è l'ID dell'evento sulla fonte (FIASP `idMan`, id articolo CSI dall'URL), quindi cambi di nome/data aggiornano la stessa riga
- **Eventi rimossi**: ogni scraper registra gli ID elencati dalla fonte (`_mark_seen`, anche se il parsing dell'evento fallisce); a fine run gli eventi non visti ricevono `removed_at` e il frontend li nasconde. Se una fonte restituisce meno del 50% degli eventi attivi la rimozione viene saltata (`MIN_SEEN_RATIO` in `scrapers/base.py`)
- `models/provinces.py` e `utils/region_mapper.py` normalizzano i dati di localizzazione
- **Poster**: ogni scraper ottiene un PDF (CSI unisce le immagini con `img2pdf`, FIASP scarica il volantino), `utils/poster_renderer.py` lo converte in WebP 1200px (una per pagina, con pypdfium2) e `BaseScraper._upload_poster_pages` le carica su Storage (`posters/<nome>-<hash>-pN.webp`). A fine run `SupabaseManager.delete_orphan_posters()` cancella i file non più referenziati

### Database Schema (Supabase/PostgreSQL)
- `locations`: id, city, province, province_name, region, created_at
- `events`: id, name, date, location_id, organizer, url (pagina sulla fonte), source (`FIASP`/`CSI`), source_id, last_seen_at, removed_at, poster_pages (jsonb `[{url, width, height}]`), distances, created_at, updated_at — unique `(source, source_id)`
- Migrazioni SQL in `supabase/migrations/`, applicate a mano dall'SQL Editor di Supabase

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
| Unit/Integration Testing | Jest + React Testing Library |
| E2E Testing | Playwright (Chromium) |
| Analytics | Google Tag Manager (GTM-W694RKFF) |

## Convenzioni

- **TypeScript**: tutto il frontend è in TypeScript. Non aggiungere file `.js` in `frontend/src/`
- **Componenti**: ogni componente ha la sua cartella in `components/` con file `.tsx` e `.css` dedicati
- **Niente routing library**: l'app è single-page senza React Router. Non introdurlo senza discussione
- **CSS**: nessun CSS-in-JS, nessun framework UI. Solo CSS modules o file `.css` plain
- **Test unitari/integrazione**: file `*.test.ts/tsx` in `frontend/src/test/` (Jest + RTL)
- **Test E2E**: file `*.spec.ts` in `frontend/tests/` (Playwright); le chiamate Supabase vengono intercettate con mock, nessun backend necessario
