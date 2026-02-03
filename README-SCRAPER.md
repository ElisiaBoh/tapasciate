# Tapasciate Scraper - Testing Guide

## Setup Locale

### 1. Prerequisiti
- Python 3.11+
- Virtual environment attivo

### 2. Configurazione Environment

Crea il file `.env` nella **root del progetto** con:

```bash
SUPABASE_URL=https://zwypodzchumtuitkhkta.supabase.co
SUPABASE_KEY=sb_publishable_Yeo_ij8JWe7fVfqUw3VIfA_lvb5DO3t
```

**IMPORTANTE**: Verifica che `.env` sia nel `.gitignore`!

### 3. Installazione Dipendenze

```bash
# Dalla root del progetto tapasciate
python3.11 -m venv venv
source venv/bin/activate
pip install -r scraper/requirements.txt
```

### 4. Eseguire lo Scraper

```bash
cd scraper
python main.py
```

### 5. Output Atteso

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
🔄 Updated: 6ª STRABUSSETO IN MASCHERA KIDS
✅ FIASP Italia: 450 inserted, 60 updated

✅ Total: 452 inserted, 61 updated
✨ Scraping complete!
```

---

## Database Supabase

### Dashboard
🔗 **URL**: https://supabase.com/dashboard/project/zwypodzchumtuitkhkta

### Credenziali
- **Email**: la tua email usata per registrarti su Supabase
- **Password**: quella che hai scelto durante la registrazione

### Visualizzare i Dati

1. Vai su https://supabase.com/dashboard/project/zwypodzchumtuitkhkta
2. Nel menu laterale, clicca su **"Table Editor"**
3. Seleziona la tabella:
   - **`events`** → Lista eventi con nome, data, poster, distanze
   - **`locations`** → Città, province, regioni

### Schema Database

**Tabella `locations`:**
```sql
id          | BIGSERIAL PRIMARY KEY
city        | VARCHAR(100) NOT NULL
province    | VARCHAR(2) NOT NULL
region      | VARCHAR(50) NOT NULL
created_at  | TIMESTAMP DEFAULT NOW()
UNIQUE(city, province)
```

**Tabella `events`:**
```sql
id          | BIGSERIAL PRIMARY KEY
name        | VARCHAR(255) NOT NULL
date        | DATE NOT NULL
location_id | BIGINT NOT NULL (FK → locations)
organizer   | VARCHAR(100)
url         | VARCHAR(500)
poster      | VARCHAR(500)
distances   | TEXT[]
created_at  | TIMESTAMP DEFAULT NOW()
updated_at  | TIMESTAMP DEFAULT NOW()
```

### API REST

Gli eventi sono accessibili via API REST automatica di Supabase:

**Endpoint:** `https://zwypodzchumtuitkhkta.supabase.co/rest/v1/events`

**Headers richiesti:**
```
apikey: sb_publishable_Yeo_ij8JWe7fVfqUw3VIfA_lvb5DO3t
Authorization: Bearer sb_publishable_Yeo_ij8JWe7fVfqUw3VIfA_lvb5DO3t
```

**Esempio query:**
```bash
curl "https://zwypodzchumtuitkhkta.supabase.co/rest/v1/events?select=*" \
  -H "apikey: sb_publishable_Yeo_ij8JWe7fVfqUw3VIfA_lvb5DO3t" \
  -H "Authorization: Bearer sb_publishable_Yeo_ij8JWe7fVfqUw3VIfA_lvb5DO3t"
```

---

## GitHub Actions

Lo scraper gira automaticamente ogni **mercoledì alle 6:00 CEST** (4:00 UTC).

### Secrets Configurati
Nel repo GitHub → Settings → Secrets and variables → Actions:
- `SUPABASE_URL`
- `SUPABASE_KEY`

### Esecuzione Manuale
1. Vai su GitHub → Actions tab
2. Seleziona workflow "Scraper"
3. Click "Run workflow" → "Run workflow"

---

## Logica UPSERT

Lo scraper usa una strategia intelligente per evitare duplicati:

- **Evento univoco**: `name` + `date`
- Se esiste → **UPDATE** (aggiorna poster, distanze, ecc.)
- Se non esiste → **INSERT** (crea nuovo)
- Eventi con data passata vengono **cancellati** all'inizio di ogni run

---

## Troubleshooting

### Errore: `ModuleNotFoundError: No module named 'dotenv'`
```bash
pip install python-dotenv
```

### Errore: `unsupported operand type(s) for |`
Stai usando Python < 3.10. Usa Python 3.11+:
```bash
python3.11 --version
python3.11 -m venv venv
```

### Errore: `SUPABASE_URL and SUPABASE_KEY environment variables required`
Il file `.env` non è nella root del progetto o non è stato caricato. Verifica:
```bash
ls -la .env  # Deve esistere nella root
cat .env     # Deve contenere le variabili
```

### Eventi non salvati: `Object of type HttpUrl is not JSON serializable`
Aggiorna `supabase_client.py` con la versione corretta che converte `HttpUrl` in stringa.

---

## Prossimi Step

✅ Backend completato
⬜ Frontend - modificare React per leggere da Supabase API
⬜ Deploy frontend su Netlify
⬜ Configurare dominio custom
