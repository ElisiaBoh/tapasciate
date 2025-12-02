# Tapasciate

Scraper per eventi di camminate non competitive in Italia (CSI Bergamo e FIASP).

## 📁 Struttura del progetto
```
tapasciate/
├── scraper/              # Backend Python
│   ├── models/          # Modelli dati (Event, Location, Province)
│   ├── scrapers/        # Scrapers (CSI, FIASP)
│   ├── utils/           # Utility functions
│   ├── config.py        # Configurazioni
│   ├── main.py          # Entry point
│   └── requirements.txt
├── frontend/            # Frontend React
├── data/                # Output JSON
├── tests/               # Test suite
└── .github/workflows/   # CI/CD
```

## 🚀 Uso locale
```bash
# Installa dipendenze
python3.11 -m pip install -r scraper/requirements.txt

# Esegui scraper
python3.11 scraper/main.py

# Output: data/events.json
```

## 🤖 Automazione

Lo scraper gira automaticamente ogni mercoledì alle 8:00 (CET) tramite GitHub Actions.

## 🧪 Test
```bash
pytest tests/ -v
```