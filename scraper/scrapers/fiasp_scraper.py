"""
Scraper for FIASP events.
"""
from __future__ import annotations
import re
import requests
from typing import Optional
from urllib.parse import urlparse, parse_qs
import img2pdf
from bs4 import BeautifulSoup
from scraper.scrapers.base import BaseScraper
from scraper.models.event import Event
from scraper.utils.parsers import parse_location, parse_distances
from scraper.config import FIASP_URL, REQUEST_TIMEOUT
from scraper.db.supabase_client import SupabaseManager


class FIASPScraper(BaseScraper):
    """Scraper for FIASP walking events."""

    @property
    def source_name(self) -> str:
        return "FIASP Italia"

    @property
    def organizer(self) -> str:
        return "FIASP Italia"

    def _fetch_events(self) -> list[Event]:
        """Scarica eventi dal sito FIASP"""
        try:
            resp = requests.get(FIASP_URL, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
        except Exception as e:
            print(f"❌ Failed to fetch FIASP events: {e}")
            return []

        return self._parse_html(resp.text)

    def _parse_html(self, html: str) -> list[Event]:
        """Parse la tabella HTML di FIASP"""
        soup = BeautifulSoup(html, "html.parser")
        table = soup.find("table")

        if not table:
            print("⚠️ FIASP table not found")
            return []

        events = []
        for row in table.find_all("tr")[1:]:  # Skip header
            event = self._parse_row(row)
            if event:
                events.append(event)

        return events

    def _parse_row(self, row) -> Event | None:
        """Parse singola riga della tabella"""
        cols = row.find_all("td")

        if len(cols) < 3:
            return None

        date = cols[0].get_text(strip=True)
        title = cols[1].get_text(strip=True)
        location_raw = cols[2].get_text(strip=True)
        location = parse_location(location_raw)

        # Parse poster link: scarica e carica su Supabase Storage
        raw_poster = self._extract_poster(cols)
        poster = self._download_and_upload_poster(raw_poster, title, date) if raw_poster else None

        # Parse distances
        distances_raw = cols[3].get_text(strip=True) if len(cols) > 3 else ""
        distances = parse_distances(distances_raw)

        try:
            return Event(
                title=title,
                date=date,
                location=location,
                poster=poster,
                source="FIASP",
                distances=distances
            )
        except Exception as e:
            print(f"⚠️ Skipped invalid FIASP event: {e}")
            return None

    def _extract_poster(self, cols) -> str | None:
        """Estrae link grezzo al poster/flyer dalla colonna 7."""
        if len(cols) < 7:
            return None

        a_tag = cols[6].find("a")
        if not a_tag or not a_tag.get("href"):
            return None

        return a_tag["href"].strip()

    def _extract_gdrive_file_id(self, url: str) -> Optional[str]:
        """
        Estrae il file ID da un URL Google Drive.

        Supporta:
          - https://drive.google.com/file/d/FILE_ID/view
          - https://drive.google.com/open?id=FILE_ID
          - https://drive.google.com/uc?id=FILE_ID
        """
        match = re.search(r'drive\.google\.com/file/d/([^/?&]+)', url)
        if match:
            return match.group(1)

        parsed = urlparse(url)
        if 'drive.google.com' in parsed.netloc:
            params = parse_qs(parsed.query)
            if 'id' in params:
                return params['id'][0]

        return None

    def _download_poster_bytes(self, url: str) -> Optional[tuple[bytes, str]]:
        """
        Scarica il file da URL. Per Google Drive costruisce l'URL di download diretto.
        Ritorna (bytes, content_type) o None in caso di errore.
        """
        file_id = self._extract_gdrive_file_id(url)
        if file_id:
            download_url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download"
        else:
            download_url = url

        try:
            resp = requests.get(download_url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
            resp.raise_for_status()

            content_type = resp.headers.get('Content-Type', '')

            if 'text/html' in content_type:
                print(f"⚠️ Got HTML response instead of file for poster: {url}")
                return None

            return resp.content, content_type
        except Exception as e:
            print(f"⚠️ Failed to download poster {url}: {e}")
            return None

    def _download_and_upload_poster(self, raw_url: str, title: str, date: str) -> Optional[str]:
        """
        Scarica il poster da raw_url, lo carica su Supabase Storage
        e ritorna l'URL pubblico stabile. Ritorna None in caso di errore.
        """
        result = self._download_poster_bytes(raw_url)
        if not result:
            return None

        file_bytes, content_type = result

        if 'image/' in content_type:
            try:
                file_bytes = img2pdf.convert(file_bytes)
            except Exception as e:
                print(f"⚠️ Failed to convert poster image to PDF: {e}")
                return None
        elif 'application/pdf' not in content_type:
            print(f"⚠️ Unsupported poster content type '{content_type}' for {raw_url}")
            return None

        # Genera filename: fiasp-{titolo}-{YYYY-MM-DD}.pdf
        safe_title = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:50]
        parts = date.split("/")
        safe_date = f"{parts[2]}-{parts[1]}-{parts[0]}" if len(parts) == 3 else date.replace("/", "-")
        filename = f"fiasp-{safe_title}-{safe_date}.pdf"

        return SupabaseManager.upload_poster(filename, file_bytes)
