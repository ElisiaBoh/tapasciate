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
npm run test:e2e     # Run E2E tests (Playwright; reuses the dev server or starts it)
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
App                 — picks the view from the URL: `/` (Italy), `/<region>`, `/<region>/<province>` → list; `/evento/<id>-<slug>` → detail
├── Header          — logo (links to the saved zone or `/`); adds a CSS class when the page is scrolled
├── ZoneBar         — list: zone button (opens ZonePicker), period (Tutte / Questa settimana / Prossima settimana), h1 title with counts
├── ZonePicker      — "Scegli la zona" modal: regions as an accordion, provinces with event counts
├── EventList       — events grouped by date (EventCard: the whole card links to the detail)
├── BackButton      — detail: "Torna a <zone>" bar
├── EventDetail     — event detail; arrows/keys/swipe move through same-zone, same-day events; Calendar/Map/Share; PosterViewer
└── Footer
```

Shared components (each ships its own CSS, don't use their classes without importing them): `DateHeader` (pink strip), `Icon` (stroke icons), `Tile` (yellow square with an icon), `Skeleton`, `StatusMessage` (error messages).

**Zones and navigation:**
- A zone (`Zone` in `types/`) is Italy, a region or a province; URL slugs come from the data's `region` and `province_name` (`utils/zonePath.ts`: `zonePath`, `parseRoute`, `resolveZone`, `resolvePageZone`). A zone without upcoming events is "not found" (noindex)
- `utils/zones.ts`: region/province catalog with counts (`buildCatalog`), filters and copy ("Tapasciate in provincia di Bergamo", region articles)
- `utils/period.ts`: "questa settimana" = today to Sunday, "prossima" = the following Monday to Sunday; the period is not in the URL
- The zone picked in ZonePicker is saved in localStorage (`utils/savedZone.ts`): opening `/` redirects there and the logo points there. Opening a link to a zone doesn't change it
- The detail takes its zone from the list it was opened from (`listPath` in the history state, set by EventCard) or, when opened from a link, from the event's province

**Hooks and services:**
- **`hooks/useEvents.ts`**: `useEvents` fetches and exposes `status`, `events`, `upcomingEvents`, `catalog`, `today`; `useZoneEvents` filters by zone and period and groups by date
- **`hooks/useRoute.ts`**: minimal library-free router (`usePathname`, `useHistoryState`, `navigate`, `linkClickHandler`) on the History API; Netlify already rewrites `/*` to `index.html`
- **`hooks/useModal.ts`**: focus, Esc, Tab trapping and scroll lock shared by modals
- **`utils/eventPath.ts`**: builds/parses `/evento/<id>-<slug>` URLs (the id is the `events` table id)
- **`utils/eventSeo.ts`** / **`utils/zoneSeo.ts`**: title, canonical and meta tags for event and zone pages; `scripts/sitemap.js` duplicates `eventPath`/`zonePaths` (checked by tests)
- **`eventsService.ts`**: the only data layer — queries Supabase with a JOIN on `locations` and maps fields to the `Event` type
- **`supabaseClient.ts`**: Supabase client (URL and anon key are public, fine to commit)
- **`types/`**: shared TypeScript types (`Event`, `Zone`, `Period`, …)

**`status`** is a discriminated union with at least three states: `loading`, `success`, `error`.

### Scraper (`scraper/`)
- `BaseScraper` abstract class in `scrapers/base.py` — every scraper extends it
- Each scraper returns `list[Event]` (Pydantic model from `models/event.py`)
- `db/supabase_client.py` upserts using `(source, source_id)` as the unique key: `source_id` is the event id on the source (FIASP `idMan`, CSI article id from the URL), so name/date changes update the same row
- **Removed events**: each scraper records the ids listed by the source (`_mark_seen`, even when parsing the event fails); at the end of the run unseen events get `removed_at` and the frontend hides them. If a source returns less than 50% of the active events, removal is skipped (`MIN_SEEN_RATIO` in `scrapers/base.py`)
- `models/provinces.py` and `utils/region_mapper.py` normalize location data
- **Posters**: each scraper gets a PDF (CSI merges images with `img2pdf`, FIASP downloads the flyer), `utils/poster_renderer.py` converts it to 1200px WebP (one per page, with pypdfium2) and `BaseScraper._upload_poster_pages` uploads them to Storage (`posters/<name>-<hash>-pN.webp`). At the end of the run `SupabaseManager.delete_orphan_posters()` deletes files no longer referenced

### Database Schema (Supabase/PostgreSQL)
- `locations`: id, city, province, province_name, region, created_at
- `events`: id, name, date, location_id, organizer, url (page on the source), source (`FIASP`/`CSI`), source_id, last_seen_at, removed_at, poster_pages (jsonb `[{url, width, height}]`), distances, created_at, updated_at — unique `(source, source_id)`
- SQL migrations in `supabase/migrations/`, applied by hand from the Supabase SQL Editor

### Deployment
- **Frontend**: Netlify, auto-deploys from `main` (`base = "frontend"`)
- **Scraper**: GitHub Actions (`.github/workflows/scraper.yml`), uses the `SUPABASE_URL` and `SUPABASE_KEY` secrets

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

## Conventions

- **Language**: code, comments, docs and commit messages are in English. The site's user-facing copy and URLs stay in Italian
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat(frontend): …`, `fix(scraper): …`, `refactor: …`, `docs: …`, `test: …`, `chore: …`)
- **Pure functions**: put logic in pure functions (in `utils/`) and keep components and hooks thin; pure functions are what unit tests target first
- **Comments**: as few as possible — the code should explain itself through names and small functions. Comment only a non-obvious "why", never the "what"
- **TypeScript**: the whole frontend is TypeScript. Don't add `.js` files in `frontend/src/`
- **Components**: each component has its own folder in `components/` with dedicated `.tsx` and `.css` files
- **No routing library**: the app is a single-page app without React Router. Don't introduce one without discussing it
- **CSS**: no CSS-in-JS, no UI framework. Only CSS modules or plain `.css` files
- **Unit/integration tests**: `*.test.ts/tsx` files in `frontend/src/test/` (Jest + RTL)
- **E2E tests**: `*.spec.ts` files in `frontend/tests/` (Playwright); Supabase calls are intercepted with mocks, no backend needed
