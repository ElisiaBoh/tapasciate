"""
Configuration settings for the Tapasciate scraper.
"""
import os

# URLs
BASE_CSI_BERGAMO = "https://www.csibergamo.it"
CSI_LIST = f"{BASE_CSI_BERGAMO}/avvisi/prossime-marce.html"
FIASP_URL = "https://servizi.fiaspitalia.it/www_eventi.php"

# Paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "events.json")

# Scraping settings
REQUEST_DELAY = 1  # secondi tra richieste
REQUEST_TIMEOUT = 10  # timeout in secondi
DEFAULT_PROVINCE = "BG"  # Provincia di default per Bergamo
