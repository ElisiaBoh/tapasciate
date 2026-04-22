"""
Base scraper class defining the interface for all scrapers.
"""
from __future__ import annotations
import re
import img2pdf
from abc import ABC, abstractmethod
from typing import Optional, Tuple, List
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

    @staticmethod
    def _make_poster_filename(prefix: str, title: str, date: str) -> str:
        """
        Genera il filename per un poster su Supabase Storage.

        Args:
            prefix: Prefisso identificativo della sorgente (es. "csi", "fiasp")
            title:  Titolo dell'evento
            date:   Data in formato DD/MM/YYYY o DD-MM-YYYY

        Returns:
            Filename in formato "{prefix}-{titolo}-{YYYY-MM-DD}.pdf"
        """
        safe_title = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:50]
        parts = date.replace("-", "/").split("/")
        if len(parts) == 3 and len(parts[2]) == 4:
            safe_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
        else:
            safe_date = date.replace("/", "-") or "unknown"
        return f"{prefix}-{safe_title}-{safe_date}.pdf"

    @staticmethod
    def _images_to_pdf(image_bytes_list: List[bytes]) -> Optional[bytes]:
        """
        Converte una lista di immagini in un unico PDF in memoria.

        Returns:
            Bytes del PDF, o None in caso di errore.
        """
        try:
            return img2pdf.convert(image_bytes_list)
        except Exception as e:
            print(f"⚠️ Failed to convert poster images to PDF: {e}")
            return None

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
