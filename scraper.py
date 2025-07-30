import requests
from bs4 import BeautifulSoup
import json
import re

def fetch_csi_events():
    URL = "https://www.csibergamo.it/avvisi/prossime-marce.html"
    resp = requests.get(URL)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    lista = soup.find("ul", class_="latestnews-items")
    if not lista:
        print("❗️ CSI list not found")
        return []

    items = lista.find_all("li", recursive=False)
    csi_events = []
    for li in items:
        text = li.get_text(separator=" ", strip=True)

        # Regex to read: e.g. "07 Settembre Domenica NON COMPETITIVE Gaverina Terme"
        match = re.match(r"^(\d{2}\s+\w+\s+\w+)\s+(NON COMPETITIVE|COMPETITIVE)?\s*(.*)$", text)
        if match:
            date = match.group(1)
            category = match.group(2) or ""
            location = match.group(3).strip()
            csi_events.append({
                "date": date,
                "title": category,
                "location": location,
                "source": "CSI"
            })
        else:
            print(f"⚠️ CSI row not recognized: {text}")
    return csi_events

def fetch_fiasp_events():
    URL = "https://servizi.fiaspitalia.it/www_eventi.php"
    resp = requests.get(URL)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    table = soup.find("table")
    if not table:
        print("❗️ FIASP table not found")
        return []

    fiasp_events = []
    rows = table.find_all("tr")[1:]  # skip header
    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 3:
            continue
        date = cols[0].get_text(strip=True)
        title = cols[1].get_text(strip=True)
        location = cols[2].get_text(strip=True)

        loc_lower = location.lower()
        if "bergamo" in loc_lower or "bg" in loc_lower:
            fiasp_events.append({
                "date": date,
                "title": title,
                "location": location,
                "source": "FIASP"
            })

    return fiasp_events


def main():
    csi_events = fetch_csi_events()
    fiasp_events = fetch_fiasp_events()

    all_events = csi_events + fiasp_events

    with open("marce.json", "w", encoding="utf-8") as f:
        json.dump(all_events, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved {len(all_events)} events (CSI: {len(csi_events)}, FIASP: {len(fiasp_events)})")

if __name__ == "__main__":
    main()
