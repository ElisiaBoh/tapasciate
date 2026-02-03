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
from scraper.db.supabase_client import SupabaseManager


def main():
    """Esegue tutti gli scraper e salva su Supabase"""
    
    print("🚀 Starting Tapasciate scraper...")
    
    # Verifica env variables
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        print("❌ SUPABASE_URL and SUPABASE_KEY environment variables required")
        return
    
    # Pulisci eventi passati
    print("\n🗑️  Deleting past events...")
    try:
        SupabaseManager.delete_past_events()
        print("✅ Past events deleted")
    except Exception as e:
        print(f"⚠️  Failed to delete past events: {e}")
    
    scrapers = [
        CSIScraper(),
        FIASPScraper(),
    ]
    
    total_inserted = 0
    total_updated = 0
    
    for scraper in scrapers:
        print(f"\n🔄 Running {scraper.source_name}...")
        try:
            inserted, updated = scraper.run()
            print(f"✅ {scraper.source_name}: {inserted} inserted, {updated} updated")
            total_inserted += inserted
            total_updated += updated
        except Exception as e:
            print(f"❌ {scraper.source_name} failed: {e}")
    
    print(f"\n✅ Total: {total_inserted} inserted, {total_updated} updated")
    print("✨ Scraping complete!")


if __name__ == "__main__":
    main()
