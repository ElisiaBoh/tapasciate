"""
Base scraper class defining the interface for all scrapers.
"""
from abc import ABC, abstractmethod
from typing import Tuple
from scraper.models.event import Event
from scraper.models.operation import Operation
from scraper.db.supabase_client import SupabaseManager


class BaseScraper(ABC):
    """Abstract base class for event scrapers."""

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Nome della sorgente (es. 'CSI Bergamo')"""
        pass

    @property
    @abstractmethod
    def organizer(self) -> str:
        """Nome dell'organizzatore da salvare su Supabase"""
        pass

    @abstractmethod
    def _fetch_events(self) -> list[Event]:
        """Scarica e parsa gli eventi dalla sorgente. Implementato da ogni scraper."""
        pass

    def run(self) -> Tuple[int, int]:
        """Esegue lo scraping e salva su Supabase. Comune a tutti gli scraper."""
        events = self._fetch_events()

        inserted = 0
        updated = 0

        for event in events:
            result = self._save_event(event)
            if result == Operation.INSERTED:
                inserted += 1
            elif result == Operation.UPDATED:
                updated += 1

        return (inserted, updated)

    def _save_event(self, event: Event) -> Operation:
        """Salva un evento su Supabase. Comune a tutti gli scraper."""
        try:
            location_id = SupabaseManager.upsert_location(
                city=event.location.city,
                province=event.location.province,
                province_name=event.location.province_name,
                region=event.location.region
            )

            operation = SupabaseManager.upsert_event(
                name=event.title,
                date=event.date,
                location_id=location_id,
                organizer=self.organizer,
                url=None,
                poster=event.poster,
                distances=event.distances
            )

            if operation == Operation.INSERTED:
                print(f"✅ Inserted: {event.title}")
            else:
                print(f"🔄 Updated: {event.title}")

            return operation
        except Exception as e:
            print(f"❌ Failed: {event.title} - {e}")
            return Operation.FAILED
