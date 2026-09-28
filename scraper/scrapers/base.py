"""
Base scraper class defining the interface for all scrapers.
"""
from __future__ import annotations
import re
import hashlib
import img2pdf
from abc import ABC, abstractmethod
from typing import Optional, Tuple, List
from scraper.models.event import Event, PosterPage
from scraper.models.operation import Operation
from scraper.db.supabase_client import SupabaseManager
from scraper.utils.poster_renderer import render_pdf_pages


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
    def _make_poster_basename(prefix: str, title: str, date: str) -> str:
        """
        Genera la base del nome file per le pagine di un poster su Supabase Storage.

        Args:
            prefix: Prefisso identificativo della sorgente (es. "csi", "fiasp")
            title:  Titolo dell'evento
            date:   Data in formato DD/MM/YYYY o DD-MM-YYYY

        Returns:
            Base in formato "{prefix}-{titolo}-{YYYY-MM-DD}" (senza estensione)
        """
        safe_title = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:50]
        parts = date.replace("-", "/").split("/")
        if len(parts) == 3 and len(parts[2]) == 4:
            safe_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
        else:
            safe_date = date.replace("/", "-") or "unknown"
        return f"{prefix}-{safe_title}-{safe_date}"

    @classmethod
    def _upload_poster_pages(cls, prefix: str, title: str, date: str, pdf_bytes: bytes) -> List[PosterPage]:
        """
        Converte il PDF del poster in immagini WebP (una per pagina) e le carica su Storage.

        Il nome contiene un hash del PDF: se la locandina cambia cambia anche l'URL,
        così browser e CDN non servono la versione vecchia. Le pagine sostituite
        vengono rimosse a fine run da SupabaseManager.delete_orphan_posters().

        Returns:
            Pagine caricate, oppure lista vuota se il rendering o un upload fallisce.
        """
        rendered = render_pdf_pages(pdf_bytes)
        if not rendered:
            return []

        basename = cls._make_poster_basename(prefix, title, date)
        digest = hashlib.sha1(pdf_bytes).hexdigest()[:8]

        pages: List[PosterPage] = []
        for number, page in enumerate(rendered, start=1):
            url = SupabaseManager.upload_poster(f"{basename}-{digest}-p{number}.webp", page.data)
            if not url:
                return []
            pages.append(PosterPage(url=url, width=page.width, height=page.height))
        return pages

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
                poster_pages=[page.model_dump(mode="json") for page in event.poster_pages],
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
