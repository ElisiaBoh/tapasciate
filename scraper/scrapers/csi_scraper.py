"""
Scraper for CSI Bergamo events.
"""
import requests
from bs4 import BeautifulSoup
import time
import datetime
from scraper.models.provinces import Province
from scraper.scrapers.base import BaseScraper
from scraper.models.event import Event
from scraper.utils.parsers import parse_location
from scraper.config import BASE_CSI_BERGAMO, CSI_LIST, REQUEST_DELAY, REQUEST_TIMEOUT
from scraper.db.supabase_client import SupabaseManager


class CSIScraper(BaseScraper):
    """Scraper for CSI Bergamo walking events."""
    
    @property
    def source_name(self) -> str:
        return "CSI Bergamo"
    
    def run(self) -> int:
        """Esegue lo scraping e salva su Supabase"""
        events = self._fetch_events()
        
        saved_count = 0
        for event in events:
            if self._save_to_supabase(event):
                saved_count += 1
        
        return saved_count
    
    def _fetch_events(self) -> list[Event]:
        """Scarica eventi dal sito CSI"""
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
            event = self._parse_event_item(li)
            if event:
                events.append(event)
                time.sleep(REQUEST_DELAY)
        
        return events
    
    def _parse_event_item(self, li) -> Event | None:
        """Parse singolo evento dalla lista"""
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
        
        soup = BeautifulSoup(r.text, "html.parser")
        
        # Parse location
        title_tag = soup.find("h2", class_="contentheading")
        location_raw = title_tag.get_text(strip=True) if title_tag else a.get_text(strip=True)
        location = parse_location(location_raw, default_province=Province.BG)
        
        # Parse content and title
        content = soup.find("div", class_="jsn-article-content")
        raw = content.get_text(separator="\n", strip=True) if content else ""
        title = raw.split("\n")[0].strip() if raw else ""
        
        # Parse poster
        poster = self._extract_poster(content)
        
        # Parse date
        date = self._parse_date(soup)
        
        try:
            return Event(
                title=title,
                date=date,
                location=location,
                poster=poster,
                source="CSI",
                distances=[]
            )
        except Exception as e:
            print(f"⚠️ Skipped invalid CSI event: {e}")
            return None
    
    def _extract_poster(self, content) -> str | None:
        """Estrae URL del poster"""
        if not content:
            return None
        
        first_img = content.find("img")
        if not first_img or not first_img.get("src"):
            return None
        
        src = first_img["src"]
        if src.startswith("/"):
            return f"{BASE_CSI_BERGAMO}{src}"
        return src
    
    def _parse_date(self, soup: BeautifulSoup) -> str:
        """Estrae data dalla pagina"""
        active_li = soup.select_one("ul.latestnews-items li.active")
        if not active_li:
            return ""
        
        day_tag = active_li.select_one("span.position1.day")
        month_tag = active_li.select_one("span.position3.month")
        
        if not (day_tag and month_tag):
            return ""
        
        day = day_tag.get_text(strip=True)
        month_name = month_tag.get_text(strip=True)
        
        months = {
            "Gennaio": "01", "Febbraio": "02", "Marzo": "03", "Aprile": "04",
            "Maggio": "05", "Giugno": "06", "Luglio": "07", "Agosto": "08",
            "Settembre": "09", "Ottobre": "10", "Novembre": "11", "Dicembre": "12"
        }
        
        month = months.get(month_name, "00")
        year = str(datetime.datetime.now().year)
        
        return f"{day.zfill(2)}/{month}/{year}"
    
    def _save_to_supabase(self, event: Event) -> bool:
        """Salva evento su Supabase"""
        try:
            location_id = SupabaseManager.upsert_location(
                city=event.location.city,
                province=event.location.province,
                region=event.location.region
            )
            
            SupabaseManager.insert_event(
                name=event.title,
                date=event.date,
                location_id=location_id,
                organizer="CSI Bergamo",
                url=None,
                poster=event.poster,
                distances=event.distances
            )
            
            print(f"✅ Saved: {event.title}")
            return True
        except Exception as e:
            print(f"❌ Failed to save: {event.title} - {e}")
            return False