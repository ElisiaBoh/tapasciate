# Tapasciate - Guida Sviluppo Locale

Guida rapida per eseguire scraper e frontend in locale.

---

## 🐍 Scraper (Backend)

### Prerequisiti
- Python 3.11+ installato
- Virtual environment già configurato
- File `.env` nella root del progetto

### Quick Start

```bash
# 1. Attiva virtual environment
source venv/bin/activate

# 2. Vai nella cartella scraper
cd scraper

# 3. Esegui lo scraper
python main.py
```

### Output Atteso

```
🚀 Starting Tapasciate scraper...

🗑️  Deleting past events...
✅ Past events deleted

🔄 Running CSI Bergamo...
✅ Inserted: Mercatorum
🔄 Updated: StraPonte
✅ CSI Bergamo: 2 inserted, 1 updated

🔄 Running FIASP Italia...
✅ Inserted: 8ª MARCIA DEI RAN RUN
✅ FIASP Italia: 450 inserted, 60 updated

✅ Total: 452 inserted, 61 updated
✨ Scraping complete!
```

### Eseguire i Test

I test verificano la logica di parsing senza fare chiamate HTTP o accedere al database.

```bash
# Dalla cartella scraper/ con venv attivo
pytest tests/

# Esegui test con output dettagliato
pytest tests/ -v

# Esegui solo test specifici
pytest tests/test_parsers.py
pytest tests/test_fiasp_scraper.py
pytest tests/test_csi_scraper.py

# Esegui con coverage
pytest tests/ --cov=scraper --cov-report=html
```

---

## ⚛️ Frontend (React)

### Prerequisiti
- Node.js installato
- npm installato

### Quick Start

```bash
# 1. Vai nella cartella frontend
cd frontend

# 2. Installa dipendenze (solo prima volta)
npm install

# 3. Avvia il server di sviluppo
npm start
```

Il sito si apre automaticamente su `http://localhost:3000`

### Build per Produzione

```bash
# Dalla cartella frontend/
npm run build
```

I file ottimizzati finiscono in `frontend/build/`

---

## 🗄️ Database Supabase

### Dashboard
🔗 https://supabase.com/dashboard/project/zwypodzchumtuitkhkta


### Schema Database

**Tabella `locations`:**
```
id          | BIGSERIAL PRIMARY KEY
city        | VARCHAR(100) NOT NULL
province    | VARCHAR(2) NOT NULL
region      | VARCHAR(50) NOT NULL
created_at  | TIMESTAMP DEFAULT NOW()
```

**Tabella `events`:**
```
id          | BIGSERIAL PRIMARY KEY
name        | VARCHAR(255) NOT NULL
date        | DATE NOT NULL
location_id | BIGINT (FK → locations)
organizer   | VARCHAR(100)
url         | VARCHAR(500)
poster      | VARCHAR(500)
distances   | TEXT[]
created_at  | TIMESTAMP DEFAULT NOW()
updated_at  | TIMESTAMP DEFAULT NOW()
```

---

## 🤖 GitHub Actions

### Scraper automatico
- **Quando**: Ogni mercoledì alle 6:00 CEST
- **Cosa fa**: Esegue gli scraper e aggiorna Supabase
- **File**: `.github/workflows/scraper.yml`

### Esecuzione Manuale
1. GitHub → tab **Actions**
2. Seleziona workflow **"Scraper"**
3. **Run workflow** → **Run workflow**


---

