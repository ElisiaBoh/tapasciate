"""
Main entry point for the Tapasciate scraper.
"""
import json
import sys
from pathlib import Path

# Aggiungi la root del progetto al PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from scrapers.csi_scraper import CSIScraper
from scraper.scrapers.fiasp_scraper import FIASPScraper
from scraper.config import OUTPUT_FILE

def main():
    """
    Run all scrapers and save combined results to JSON.
    """
    print("🚀 Starting Tapasciate scraper...")
    
    # Initialize scrapers
    scrapers = [
        CSIScraper(),
        FIASPScraper()
    ]
    
    # Collect events from all sources
    all_events = []
    for scraper in scrapers:
        print(f"\n📡 Fetching events from {scraper.source_name}...")
        try:
            events = scraper.fetch_events()
            all_events.extend(events)
            print(f"✅ Found {len(events)} events from {scraper.source_name}")
        except Exception as e:
            print(f"❌ Error fetching from {scraper.source_name}: {e}")
    
    # Ensure output directory exists
    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save to JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            [event.model_dump(mode="json") for event in all_events],
            f,
            ensure_ascii=False,
            indent=2
        )
    
    print(f"\n💾 Saved {len(all_events)} total events to {OUTPUT_FILE}")
    print("✨ Scraping complete!")


if __name__ == "__main__":
    main()
