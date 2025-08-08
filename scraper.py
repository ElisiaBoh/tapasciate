import requests
from bs4 import BeautifulSoup
import json
import re
import time
import datetime
from pydantic import BaseModel, HttpUrl
from typing import Optional, Literal

BASE_CSI = "https://www.csibergamo.it"
CSI_LIST = f"{BASE_CSI}/avvisi/prossime-marce.html"
FIASP_URL = "https://servizi.fiaspitalia.it/www_eventi.php"


# --- Modello tipizzato ---
class Evento(BaseModel):
    title: str
    date: str  # formato dd/mm/yyyy
    location: str
    poster: Optional[HttpUrl] = None
    source: Literal["CSI", "FIASP"]


# --- CSI: lista e dettagli ---
def fetch_csi_events_detailed() -> list[Evento]:
    resp = requests.get(CSI_LIST)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    lista = soup.find("ul", class_="latestnews-items")
    if not lista:
        print("⚠️ CSI list not found")
        return []

    detailed: list[Evento] = []
    for li in lista.find_all("li", recursive=False):
        a = li.find("a", href=True)
        if not a:
            continue
        detail_url = BASE_CSI + a["href"]
        try:
            r = requests.get(detail_url)
            r.raise_for_status()
        except Exception as e:
            print(f"⚠️ Failed to fetch detail: {detail_url} — {e}")
            continue

        ds = BeautifulSoup(r.text, "html.parser")
        title_tag = ds.find("h2", class_="contentheading")
        location = title_tag.get_text(strip=True) if title_tag else a.get_text(strip=True)

        content = ds.find("div", class_="jsn-article-content")
        raw = content.get_text(separator="\n", strip=True) if content else ""
        title = raw.split("\n")[0].strip() if raw else ""

        # image
        first_image_url = None
        if content:
            first_img = content.find("img")
            if first_img and first_img.get("src"):
                src = first_img["src"]
                if src.startswith("/"):
                    first_image_url = f"{BASE_CSI}{src}"
                else:
                    first_image_url = src

        # date
        active_li = ds.select_one("ul.latestnews-items li.active")
        event_date = ""
        day_tag = month_tag = None
        if active_li:
            day_tag = active_li.select_one("span.position1.day")
            month_tag = active_li.select_one("span.position3.month")

        if day_tag and month_tag:
            day = day_tag.get_text(strip=True)
            month_name = month_tag.get_text(strip=True)
            mesi = {
                "Gennaio": "01", "Febbraio": "02", "Marzo": "03", "Aprile": "04",
                "Maggio": "05", "Giugno": "06", "Luglio": "07", "Agosto": "08",
                "Settembre": "09", "Ottobre": "10", "Novembre": "11", "Dicembre": "12"
            }
            month = mesi.get(month_name, "00")
            year = str(datetime.datetime.now().year)
            event_date = f"{day.zfill(2)}/{month}/{year}"

        try:
            detailed.append(Evento(
                title=title,
                date=event_date,
                location=location,
                poster=first_image_url,
                source="CSI"
            ))
        except Exception as e:
            print(f"⚠️ Skipped invalid CSI event: {e}")

        time.sleep(1)

    return detailed


# --- FIASP original scraper ---
def fetch_fiasp_events() -> list[Evento]:
    resp = requests.get(FIASP_URL)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table")
    if not table:
        print("⚠️ FIASP table not found")
        return []

    def convert_drive_link(url: str) -> str:
        match = re.search(r'/d/([a-zA-Z0-9_-]+)/', url)
        if match:
            file_id = match.group(1)
            return f"https://drive.google.com/uc?export=view&id={file_id}"
        return url

    fiasp: list[Evento] = []
    for row in table.find_all("tr")[1:]:
        cols = row.find_all("td")
        if len(cols) < 3:
            continue
        date = cols[0].get_text(strip=True)
        title = cols[1].get_text(strip=True)
        location = cols[2].get_text(strip=True)

        # image
        flyer_link = None
        if len(cols) >= 7:
            a_tag = cols[6].find("a")
            if a_tag and a_tag.get("href"):
                flyer_link = convert_drive_link(a_tag["href"].strip())

        if "bergamo" in location.lower() or "bg" in location.lower():
            try:
                fiasp.append(Evento(
                    title=title,
                    date=date,
                    location=location,
                    poster=flyer_link,
                    source="FIASP"
                ))
            except Exception as e:
                print(f"⚠️ Skipped invalid FIASP event: {e}")

    return fiasp


def main():
    csi = fetch_csi_events_detailed()
    fiasp = fetch_fiasp_events()
    all_events = csi + fiasp

    # Salvataggio dati
    with open("marce.json", "w", encoding="utf-8") as f:
        json.dump([e.model_dump(mode="json") for e in all_events], f, ensure_ascii=False, indent=2)

    print(f"✅ Saved {len(all_events)} events (CSI {len(csi)}, FIASP {len(fiasp)})")


if __name__ == "__main__":
    main()
