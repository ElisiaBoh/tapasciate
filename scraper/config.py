"""
Configuration settings for the Tapasciate scraper.
"""
# URLs
BASE_CSI_BERGAMO = "https://www.csibergamo.it"
CSI_LIST = f"{BASE_CSI_BERGAMO}/avvisi/prossime-marce.html"
FIASP_URL = "https://servizi.fiaspitalia.it/www_eventi.php"

# Scraping settings
REQUEST_DELAY = 1  # secondi tra richieste
REQUEST_TIMEOUT = 10  # timeout in secondi

# Supabase Storage
SUPABASE_STORAGE_BUCKET = "posters"
