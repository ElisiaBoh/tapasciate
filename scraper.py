import requests
from bs4 import BeautifulSoup
import json

url = "https://www.csibergamo.it/avvisi/prossime-marce.html"
response = requests.get(url)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')
table = soup.find('table')
rows = table.find_all('tr')

marce = []
for row in rows[1:]:
    cells = row.find_all('td')
    if len(cells) >= 4:
        marcia = {
            "data": cells[0].get_text(strip=True),
            "località": cells[1].get_text(strip=True),
            "denominazione": cells[2].get_text(strip=True),
            "organizzazione": cells[3].get_text(strip=True),
        }
        marce.append(marcia)

# Salva i dati in un file JSON
with open("marce.json", "w", encoding="utf-8") as f:
    json.dump(marce, f, ensure_ascii=False, indent=2)

print(f"{len(marce)} marce salvate in marce.json ✅")
