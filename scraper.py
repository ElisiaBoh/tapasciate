import requests
from bs4 import BeautifulSoup
import json
import re

URL = "https://www.csibergamo.it/avvisi/prossime-marce.html"
resp = requests.get(URL)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, "html.parser")

lista = soup.find("ul", class_="latestnews-items")
if not lista:
    print("❗️ List not found")
    events = []
else:
    items = lista.find_all("li", recursive=False)
    events = []
    for li in items:
        text = li.get_text(separator=" ", strip=True)

        # Regex to read: e.g. "07 Settembre Domenica NON COMPETITIVE Gaverina Terme"
        match = re.match(r"^(\d{2}\s+\w+\s+\w+)\s+(NON COMPETITIVE|COMPETITIVE)?\s*(.*)$", text)
        if match:
            info = match.group(1)
            categoria = match.group(2) or ""
            localita = match.group(3).strip()
            events.append({
                "info": info,
                "categoria": categoria,
                "localita": localita
            })
        else:
            print(f"⚠️ Row not recognized: {text}")

with open("marce.json", "w", encoding="utf-8") as f:
    json.dump(events, f, ensure_ascii=False, indent=2)

print(f"✅ Saved {len(events)} events")
