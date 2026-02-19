"""
Scraper for CSI Bergamo events.
"""
import requests
import img2pdf
import io
import re
import time
import datetime
from typing import Tuple, Optional
from bs4 import BeautifulSoup
from scraper.scrapers.base import BaseScraper
from scraper.models.event import Event
from scraper.models.provinces import Province
from scraper.models.operation import Operation
from scraper.utils.parsers import parse_location
from scraper.config import BASE_CSI_BERGAMO, CSI_LIST, REQUEST_DELAY, REQUEST_TIMEOUT
from scraper.db.supabase_client import SupabaseManager


class CSIScraper(BaseScraper):
    """Scraper for CSI Bergamo walking events."""
    
    @property
    def source_name(self) -> str:
        return "CSI Bergamo"
    
    def run(self) -> Tuple[int, int]:
        """Esegue lo scraping e salva su Supabase"""
        events = self._fetch_events()
        
        inserted = 0
        updated = 0
        
        for event in events:
            result = self._save_to_supabase(event)
            if result == Operation.INSERTED:
                inserted += 1
            elif result == Operation.UPDATED:
                updated += 1
        
        return (inserted, updated)
    
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
        
        # Parse date
        date = self._parse_date(soup)
        
        # Parse poster: scarica tutte le immagini, crea PDF, carica su Storage
        poster_url = self._extract_and_upload_poster(content, title, date)
        
        try:
            return Event(
                title=title,
                date=date,
                location=location,
                poster=poster_url,
                source="CSI",
                distances=[]
            )
        except Exception as e:
            print(f"⚠️ Skipped invalid CSI event: {e}")
            return None

    def _extract_and_upload_poster(self, content, title: str, date: str) -> Optional[str]:
        """
        Raccoglie tutte le immagini del poster, le unisce in un PDF
        e lo carica su Supabase Storage. Ritorna l'URL pubblico.
        """
        if not content:
            return None

        # Raccogli tutti i src delle immagini nel contenuto
        imgs = content.find_all("img")
        if not imgs:
            return None

        image_bytes_list = []
        for img in imgs:
            src = img.get("src")
            if not src:
                continue
            url = f"{BASE_CSI_BERGAMO}{src}" if src.startswith("/") else src
            try:
                resp = requests.get(url, timeout=REQUEST_TIMEOUT)
                resp.raise_for_status()
                image_bytes_list.append(resp.content)
            except Exception as e:
                print(f"⚠️ Failed to download poster image {url}: {e}")

        if not image_bytes_list:
            return None

        # Converti le immagini in un unico PDF in memoria
        try:
            pdf_bytes = img2pdf.convert(image_bytes_list)
        except Exception as e:
            print(f"⚠️ Failed to convert poster images to PDF: {e}")
            return None

        # Genera filename dal titolo e dalla data (es. "csi-bottanuco-2026-03-15.pdf")
        safe_title = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:50]
        safe_date = date.replace("/", "-") if date else "unknown"
        # Converti DD-MM-YYYY → YYYY-MM-DD per ordinamento leggibile
        parts = safe_date.split("-")
        if len(parts) == 3 and len(parts[2]) == 4:
            safe_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
        filename = f"csi-{safe_title}-{safe_date}.pdf"

        # Carica su Supabase Storage
        poster_url = SupabaseManager.upload_poster(filename, pdf_bytes)
        return poster_url

    def _extract_poster(self, content) -> Optional[str]:
        """
        Mantenuto per compatibilità con i test esistenti.
        Ritorna solo la prima immagine come URL (comportamento originale).
        """
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
        
        day = active_li.select_one("span.position1.day")
        month = active_li.select_one("span.position3.month")
        
        if not day or not month:
            return ""
        
        month_map = {
            "Gennaio": "01", "Febbraio": "02", "Marzo": "03",
            "Aprile": "04", "Maggio": "05", "Giugno": "06",
            "Luglio": "07", "Agosto": "08", "Settembre": "09",
            "Ottobre": "10", "Novembre": "11", "Dicembre": "12"
        }
        
        day_str = day.get_text(strip=True).zfill(2)
        month_str = month_map.get(month.get_text(strip=True), "01")
        year_str = str(datetime.datetime.now().year)
        
        return f"{day_str}/{month_str}/{year_str}"

    def _save_to_supabase(self, event: Event) -> Operation:
        """Salva evento su Supabase"""
        try:
            location_id = SupabaseManager.upsert_location(
                city=event.location.city,
                province=event.location.province,
                region=event.location.region
            )
            
            operation = SupabaseManager.upsert_event(
                name=event.title,
                date=event.date,
                location_id=location_id,
                organizer="CSI Bergamo",
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
