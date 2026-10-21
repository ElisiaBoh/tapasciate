"""
Base scraper class defining the interface for all scrapers.
"""
from __future__ import annotations
import re
import hashlib
import img2pdf
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from scraper.models.event import Event, PosterPage
from scraper.models.operation import Operation
from scraper.db.supabase_client import SupabaseManager
from scraper.utils.poster_renderer import render_pdf_pages


# Below this share of seen vs. active events the source is considered incomplete
# (site down, page changed) and nothing is removed
MIN_SEEN_RATIO = 0.5


class BaseScraper(ABC):
    """Abstract base class for event scrapers."""

    def __init__(self) -> None:
        # ids listed by the source in this run, even when parsing the event failed
        self._seen_ids: set[str] = set()

    @property
    @abstractmethod
    def source(self) -> str:
        """Source code stored in events.source (e.g. 'FIASP')."""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Source display name (e.g. 'CSI Bergamo')."""
        pass

    @property
    @abstractmethod
    def organizer(self) -> str:
        """Organizer name saved to Supabase."""
        pass

    @abstractmethod
    def _fetch_events(self) -> list[Event]:
        """Download and parse the events of the source."""
        pass

    def _mark_seen(self, source_id: str) -> None:
        """Record an event listed by the source, so it won't be marked as removed."""
        self._seen_ids.add(source_id)

    def run(self) -> Tuple[int, int, int]:
        """
        Scrape, save to Supabase and mark as removed the events gone from the source.

        Returns:
            (inserted, updated, removed)
        """
        self._seen_ids = set()
        seen_at = datetime.now(timezone.utc).isoformat()
        events = self._fetch_events()

        inserted = 0
        updated = 0

        for event in events:
            result = self._save_event(event)
            if result == Operation.INSERTED:
                inserted += 1
            elif result == Operation.UPDATED:
                updated += 1

        removed = self._remove_unseen_events(seen_at)
        return (inserted, updated, removed)

    def _remove_unseen_events(self, seen_at: str) -> int:
        """Mark unlisted events as removed, if the source seems to have been read in full."""
        active = SupabaseManager.count_active_events(self.source)
        if not self._seen_ids or len(self._seen_ids) < active * MIN_SEEN_RATIO:
            print(
                f"⚠️ {self.source_name}: {len(self._seen_ids)} events seen out of {active} active, "
                "skipping removal as a precaution"
            )
            return 0

        SupabaseManager.mark_events_seen(self.source, self._seen_ids, seen_at)
        return SupabaseManager.remove_unseen_events(self.source, seen_at)

    @staticmethod
    def _make_poster_basename(prefix: str, title: str, date: str) -> str:
        """
        Build the base file name for the pages of a poster on Supabase Storage.

        Args:
            prefix: Source prefix (e.g. "csi", "fiasp")
            title:  Event title
            date:   Date as DD/MM/YYYY or DD-MM-YYYY

        Returns:
            "{prefix}-{title}-{YYYY-MM-DD}" (without extension)
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
        Convert the poster PDF into WebP images (one per page) and upload them to Storage.

        The name contains a hash of the PDF: when the poster changes so does the URL,
        so browsers and CDN don't serve the old version. Replaced pages are deleted
        at the end of the run by SupabaseManager.delete_orphan_posters().

        Returns:
            Uploaded pages, or an empty list if rendering or an upload fails.
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
        Merge a list of images into a single in-memory PDF.

        Returns:
            PDF bytes, or None on error.
        """
        try:
            return img2pdf.convert(image_bytes_list)
        except Exception as e:
            print(f"⚠️ Failed to convert poster images to PDF: {e}")
            return None

    def _save_event(self, event: Event) -> Operation:
        """Save an event to Supabase."""
        try:
            location_id = SupabaseManager.upsert_location(
                city=event.location.city,
                province=event.location.province,
                province_name=event.location.province_name,
                region=event.location.region
            )

            operation = SupabaseManager.upsert_event(
                source=event.source,
                source_id=event.source_id,
                name=event.title,
                date=event.date,
                location_id=location_id,
                organizer=self.organizer,
                url=event.url,
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
