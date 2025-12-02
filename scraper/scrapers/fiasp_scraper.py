"""
Scraper for FIASP events.
"""
import requests
from bs4 import BeautifulSoup
from typing import List
from scraper.scrapers.base import BaseScraper
from scraper.models.event import Event
from scraper.utils.parsers import parse_location, parse_distances
from scraper.config import FIASP_URL, REQUEST_TIMEOUT


class FIASPScraper(BaseScraper):
    """Scraper for FIASP walking events."""
    
    @property
    def source_name(self) -> str:
        return "FIASP Italia"
    
    def fetch_events(self) -> List[Event]:
        """
        Fetch events from FIASP website.
        
        Returns:
            List of Event objects
        """
        try:
            resp = requests.get(FIASP_URL, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
        except Exception as e:
            print(f"❌ Failed to fetch FIASP events: {e}")
            return []
        
        return self._parse_html(resp.text)
    
    def _parse_html(self, html: str) -> List[Event]:
        """Parse the FIASP HTML table."""
        soup = BeautifulSoup(html, "html.parser")
        table = soup.find("table")
        
        if not table:
            print("⚠️ FIASP table not found")
            return []
        
        events = []
        for row in table.find_all("tr")[1:]:  # Skip header row
            event = self._parse_row(row)
            if event:
                events.append(event)
        
        return events
    
    def _parse_row(self, row) -> Event | None:
        """Parse a single table row into an Event."""
        cols = row.find_all("td")
        
        if len(cols) < 3:
            return None
        
        date = cols[0].get_text(strip=True)
        title = cols[1].get_text(strip=True)
        location_raw = cols[2].get_text(strip=True)
        location = parse_location(location_raw)
        
        # Parse flyer link
        flyer_link = None
        if len(cols) >= 7:
            a_tag = cols[6].find("a")
            if a_tag and a_tag.get("href"):
                flyer_link = a_tag["href"].strip()
        
        # Parse distances
        distances_raw = cols[3].get_text(strip=True) if len(cols) > 3 else ""
        distances_list = parse_distances(distances_raw)
        
        try:
            return Event(
                title=title,
                date=date,
                location=location,
                poster=flyer_link,
                source="FIASP",
                distances=distances_list
            )
        except Exception as e:
            print(f"⚠️ Skipped invalid FIASP event: {e}")
            return None
