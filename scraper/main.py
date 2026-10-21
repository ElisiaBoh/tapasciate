"""
Main entry point for the Tapasciate scraper.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(Path(__file__).parent.parent))

from scraper.scrapers.csi_scraper import CSIScraper
from scraper.scrapers.fiasp_scraper import FIASPScraper
from scraper.db.supabase_client import SupabaseManager


def main() -> int:
    """Runs every scraper and saves to Supabase; returns the process exit code."""
    
    print("🚀 Starting Tapasciate scraper...")
    
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        print("❌ SUPABASE_URL and SUPABASE_KEY environment variables required")
        return 1

    failed = False
    
    print("\n🗑️  Deleting past events...")
    try:
        SupabaseManager.delete_past_events()
        print("✅ Past events deleted")
    except Exception as e:
        print(f"⚠️  Failed to delete past events: {e}")
        failed = True
    
    scrapers = [
        CSIScraper(),
        FIASPScraper(),
    ]
    
    total_inserted = 0
    total_updated = 0
    total_removed = 0
    
    for scraper in scrapers:
        print(f"\n🔄 Running {scraper.source_name}...")
        try:
            inserted, updated, removed = scraper.run()
            print(f"✅ {scraper.source_name}: {inserted} inserted, {updated} updated, {removed} removed")
            total_inserted += inserted
            total_updated += updated
            total_removed += removed
        except Exception as e:
            print(f"❌ {scraper.source_name} failed: {e}")
            failed = True
    
    print(f"\n✅ Total: {total_inserted} inserted, {total_updated} updated, {total_removed} removed")

    print("\n🧹 Deleting orphan poster files...")
    try:
        deleted = SupabaseManager.delete_orphan_posters()
        print(f"✅ {deleted} orphan poster files deleted")
    except Exception as e:
        print(f"⚠️  Failed to delete orphan posters: {e}")
        failed = True

    if failed:
        print("❌ Scraping completed with errors")
        return 1
    print("✨ Scraping complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
