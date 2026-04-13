"""
Scraper for FIASP events.
"""
import requests
from bs4 import BeautifulSoup
from scraper.scrapers.base import BaseScraper
from scraper.models.event import Event
from scraper.utils.parsers import parse_location, parse_distances
from scraper.config import FIASP_URL, REQUEST_TIMEOUT


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
        
        # Parse poster link
        poster = self._extract_poster(cols)
        
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
        """Estrae link al poster/flyer"""
        if len(cols) < 7:
            return None
        
        a_tag = cols[6].find("a")
        if not a_tag or not a_tag.get("href"):
            return None
        
        return a_tag["href"].strip()
    
