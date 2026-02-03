"""
Main entry point for the Tapasciate scraper.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Carica variabili d'ambiente dal file .env
load_dotenv()

# Aggiungi la root del progetto al PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from scraper.scrapers.csi_scraper import CSIScraper
from scraper.scrapers.fiasp_scraper import FIASPScraper


def main():
    """Esegue tutti gli scraper e salva su Supabase"""
    
    print("🚀 Starting Tapasciate scraper...")
    
    # Verifica env variables
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        print("❌ SUPABASE_URL and SUPABASE_KEY environment variables required")
        return
    
    scrapers = [
        CSIScraper(),
        FIASPScraper(),
    ]
    
    total_saved = 0
    
    for scraper in scrapers:
        print(f"\n🔄 Running {scraper.source_name}...")
        try:
            count = scraper.run()
            print(f"✅ {scraper.source_name}: {count} events saved")
            total_saved += count
        except Exception as e:
            print(f"❌ {scraper.source_name} failed: {e}")
    
    print(f"\n✅ Total events saved: {total_saved}")
    print("✨ Scraping complete!")


if __name__ == "__main__":
    main()