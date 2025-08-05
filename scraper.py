import requests
from bs4 import BeautifulSoup
import json
import re
import time
import datetime

BASE_CSI = "https://www.csibergamo.it"
CSI_LIST = f"{BASE_CSI}/avvisi/prossime-marce.html"
FIASP_URL = "https://servizi.fiaspitalia.it/www_eventi.php"

# --- CSI: lista e dettagli ---
def fetch_csi_events_detailed():
    resp = requests.get(CSI_LIST)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    lista = soup.find("ul", class_="latestnews-items")
    if not lista:
        print("⚠️ CSI list not found")
        return []

    detailed = []
    for li in lista.find_all("li", recursive=False):
        a = li.find("a", href=True)
        if not a:
            continue
        detail_url = BASE_CSI + a["href"]
        try:
            r = requests.get(detail_url); r.raise_for_status()
        except Exception as e:
            print(f"⚠️ Failed to fetch detail: {detail_url} — {e}")
            continue

        ds = BeautifulSoup(r.text, "html.parser")
        title = ds.find("h2", class_="contentheading")
        location = title.get_text(strip=True) if title else a.get_text(strip=True)

        content = ds.find("div", class_="jsn-article-content")
        raw = content.get_text(separator="\n", strip=True) if content else ""
        title = raw.split("\n")[0].strip() if raw else ""

        #image
        first_image_url = ""

        if content:
            first_img = content.find("img")
            if first_img and first_img.get("src"):
                src = first_img["src"]
                if src.startswith("/"):
                    first_image_url = f"{BASE_CSI}{src}"
                else:
                    first_image_url = src

        #date
        active_li = ds.select_one("ul.latestnews-items li.active")
        event_date = ""

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

        detailed.append({
            "title": title,
            "date": event_date,
            "location": location,
            "image": first_image_url,
            "source": "CSI"
        })
        time.sleep(1)

    return detailed

# --- FIASP original scraper ---
def fetch_fiasp_events():
    resp = requests.get(FIASP_URL)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table")
    if not table:
        print("⚠️ FIASP table not found")
        return []

    fiasp = []
    for row in table.find_all("tr")[1:]:
        cols = row.find_all("td")
        if len(cols) < 3:
            continue
        date = cols[0].get_text(strip=True)
        title = cols[1].get_text(strip=True)
        loc = cols[2].get_text(strip=True)
        if "bergamo" in loc.lower() or "bg" in loc.lower():
            fiasp.append({
                "title": title,
                "date": date,
                "location": loc,
                "details": "",
                "source": "FIASP"
            })

    return fiasp

def main():
    csi = fetch_csi_events_detailed()
    fiasp = fetch_fiasp_events()
    all_events = csi + fiasp
    with open("marce.json", "w", encoding="utf-8") as f:
        json.dump(all_events, f, ensure_ascii=False, indent=2)
    print(f"✅ Saved {len(all_events)} events (CSI {len(csi)}, FIASP {len(fiasp)})")

if __name__ == "__main__":
    main()
