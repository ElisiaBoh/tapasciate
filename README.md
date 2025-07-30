# Tapasciate Scraper

This project is a simple Python-based web scraper that collects information about upcoming non-competitive walking events ("tapasciate") in the Bergamo area, published on the [CSI Bergamo website](https://www.csibergamo.it/avvisi/prossime-marce.html).

The data is periodically extracted and saved in a `marce.json` file, which can be used to power static or dynamic websites displaying upcoming events.

---

## 🔍 What It Does

- Fetches the list of upcoming walking events from the CSI Bergamo announcements page.
- Parses the event **title**, **category**, and **location**.
- Saves the data in a structured JSON format.

Example output (`marce.json`):

```json
[
  {
    "info": "03 Agosto Domenica",
    "categoria": "NON COMPETITIVE",
    "localita": "Spinone al Lago"
  },
  {
    "info": "07 Settembre Domenica",
    "categoria": "NON COMPETITIVE",
    "localita": "Gaverina Terme"
  }
]
```

## ⚙️ How It Works

The project consists of:

- scraper.py: the Python script responsible for fetching and parsing the event data.
- marce.json: the output file containing the structured data.
- A GitHub Actions workflow (.github/workflows/aggiorna-marce.yml) that runs every Monday at 6:00 UTC (8:00 Italian time), and also when changes are pushed to the scraper.

## 🧪 Run Locally

To test the scraper locally:

1. Make sure you have Python 3.11+ installed.
2. Install dependencies:
`pip install requests beautifulsoup4`
3. Run the script:
   `python scraper.py`

The file marce.json will be created or updated in the root directory.

## 🚀 GitHub Actions

The project includes a GitHub Actions workflow that:

- Runs on a weekly schedule
- Can be manually triggered
- Commits and pushes updates to marce.json

