"""
Scraper for CSI Bergamo events.
"""
import requests
from bs4 import BeautifulSoup
import time
import datetime
from typing import List
from scraper.scrapers.base import BaseScraper
from scraper.models.event import Event
from scraper.utils.parsers import parse_location
from scraper.config import BASE_CSI_BERGAMO, CSI_LIST, REQUEST_DELAY, REQUEST_TIMEOUT


class CSIScraper(BaseScraper):
    """Scraper for CSI Bergamo walking events."""
    
    @property
    def source_name(self) -> str:
        return "CSI Bergamo"
    
    def fetch_events(self) -> List[Event]:
        """
        Fetch events from CSI Bergamo website.
        
        Returns:
            List of Event objects
        """
        try:
            resp = requests.get(CSI_LIST, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
        except Exception as e:
            print(f"❌ Failed to fetch CSI list: {e}")
            return []
        
        soup = BeautifulSoup(resp.text, "html.parser")
        lista = soup.find("ul", class_="latestnews-items")
        
        if not lista:
            print("⚠️ CSI list not found")
            return []
        
        events = []
        for li in lista.find_all("li", recursive=False):
            event = self._parse_event_from_list_item(li)
            if event:
                events.append(event)
                time.sleep(REQUEST_DELAY)
        
        return events
    
    def _parse_event_from_list_item(self, li) -> Event | None:
        """Parse a single event from a list item."""
        a = li.find("a", href=True)
        if not a:
            return None
        
        detail_url = BASE_CSI_BERGAMO + a["href"]
        
        try:
            r = requests.get(detail_url, timeout=REQUEST_TIMEOUT)
            r.raise_for_status()
        except Exception as e:
            print(f"⚠️ Failed to fetch detail: {detail_url} — {e}")
            return None
        
        ds = BeautifulSoup(r.text, "html.parser")
        
        # Parse location
        title_tag = ds.find("h2", class_="contentheading")
        location_raw = title_tag.get_text(strip=True) if title_tag else a.get_text(strip=True)
        location = parse_location(location_raw)
        
        # Parse content and title
        content = ds.find("div", class_="jsn-article-content")
        raw = content.get_text(separator="\n", strip=True) if content else ""
        title = raw.split("\n")[0].strip() if raw else ""
        
        # Parse image
        first_image_url = None
        if content:
            first_img = content.find("img")
            if first_img and first_img.get("src"):
                src = first_img["src"]
                if src.startswith("/"):
                    first_image_url = f"{BASE_CSI_BERGAMO}{src}"
                else:
                    first_image_url = src
        
        # Parse date
        event_date = self._parse_date_from_page(ds)
        
        try:
            return Event(
                title=title,
                date=event_date,
                location=location,
                poster=first_image_url,
                source="CSI",
                distances=[]
            )
        except Exception as e:
            print(f"⚠️ Skipped invalid CSI event: {e}")
            return None
    
    def _parse_date_from_page(self, soup: BeautifulSoup) -> str:
        """Parse the event date from the detail page."""
        active_li = soup.select_one("ul.latestnews-items li.active")
        
        if not active_li:
            return ""
        
        day_tag = active_li.select_one("span.position1.day")
        month_tag = active_li.select_one("span.position3.month")
        
        if not (day_tag and month_tag):
            return ""
        
        day = day_tag.get_text(strip=True)
        month_name = month_tag.get_text(strip=True)
        
        mesi = {
            "Gennaio": "01", "Febbraio": "02", "Marzo": "03", "Aprile": "04",
            "Maggio": "05", "Giugno": "06", "Luglio": "07", "Agosto": "08",
            "Settembre": "09", "Ottobre": "10", "Novembre": "11", "Dicembre": "12"
        }
        
        month = mesi.get(month_name, "00")
        year = str(datetime.datetime.now().year)
        
        return f"{day.zfill(2)}/{month}/{year}"
