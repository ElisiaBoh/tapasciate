"""
Scraper for CSI Bergamo events.
"""
from __future__ import annotations
import re
import requests
import time
import datetime
from typing import List
from bs4 import BeautifulSoup, Tag
from scraper.scrapers.base import BaseScraper
from scraper.models.event import Event, PosterPage
from scraper.models.provinces import Province
from scraper.utils.parsers import parse_location
from scraper.config import BASE_CSI_BERGAMO, CSI_LIST, REQUEST_DELAY, REQUEST_TIMEOUT


class CSIScraper(BaseScraper):
    """Scraper for CSI Bergamo walking events."""

    @property
    def source(self) -> str:
        return "CSI"

    @property
    def source_name(self) -> str:
        return "CSI Bergamo"

    @property
    def organizer(self) -> str:
        return "CSI Bergamo"
    
    def _fetch_events(self) -> list[Event]:
        """Download events from the CSI site."""
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
    
    def _parse_event_item(self, li: Tag) -> Event | None:
        """Parse one event of the list, downloading its detail page."""
        a = li.find("a", href=True)
        if not a:
            return None
        
        detail_url = BASE_CSI_BERGAMO + a["href"]

        source_id = self._extract_source_id(a["href"])
        if not source_id:
            print(f"⚠️ Skipped CSI event without article id: {detail_url}")
            return None
        # Marked before downloading the detail: a network error must not get the event removed
        self._mark_seen(source_id)

        try:
            r = requests.get(detail_url, timeout=REQUEST_TIMEOUT)
            r.raise_for_status()
        except Exception as e:
            print(f"⚠️ Failed to fetch detail: {detail_url} — {e}")
            return None
        
        soup = BeautifulSoup(r.text, "html.parser")
        
        title_tag = soup.find("h2", class_="contentheading")
        location_raw = title_tag.get_text(strip=True) if title_tag else a.get_text(strip=True)
        location = parse_location(location_raw, default_province=Province.BG)
        
        content = soup.find("div", class_="jsn-article-content")
        raw = content.get_text(separator="\n", strip=True) if content else ""
        title = raw.split("\n")[0].strip() if raw else ""
        
        date = self._parse_date(soup)
        
        poster_pages = self._extract_and_upload_poster(content, title, date)
        
        try:
            return Event(
                title=title,
                date=date,
                location=location,
                poster_pages=poster_pages,
                source=self.source,
                source_id=source_id,
                url=detail_url,
                distances=[]
            )
        except Exception as e:
            print(f"⚠️ Skipped invalid CSI event: {e}")
            return None

    @staticmethod
    def _extract_source_id(href: str) -> str | None:
        """Extract the CSI article id from the URL (e.g. ".../5952-event-title.html" → "5952")."""
        match = re.search(r"/(\d+)-[^/]*\.html$", href)
        return match.group(1) if match else None

    def _extract_and_upload_poster(self, content: Tag | None, title: str, date: str) -> List[PosterPage]:
        """
        Download every poster image, merge them into a PDF
        and upload its pages as images to Supabase Storage.
        """
        if not content:
            return []

        imgs = content.find_all("img")
        if not imgs:
            return []

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
            return []

        pdf_bytes = self._images_to_pdf(image_bytes_list)
        if not pdf_bytes:
            return []

        return self._upload_poster_pages("csi", title, date, pdf_bytes)

    def _parse_date(self, soup: BeautifulSoup) -> str:
        """Extract the event date from the page."""
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
        
        month_str = month_map.get(month.get_text(strip=True))
        if not month_str:
            return ""

        day_str = day.get_text(strip=True).zfill(2)
        year_str = str(datetime.datetime.now().year)
        
        return f"{day_str}/{month_str}/{year_str}"

