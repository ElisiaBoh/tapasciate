"""
Test di debug per CSI scraper.
"""
import pytest
from pathlib import Path
from bs4 import BeautifulSoup
from scraper.scrapers.csi_scraper import CSIScraper


def test_csi_list_structure():
    """Verifica la struttura dell'HTML della lista CSI."""
    fixture = Path("tests/fixtures/csi_list.html")
    
    if not fixture.exists():
        pytest.skip("csi_list.html non trovato - esegui capture_html.py")
    
    with open(fixture, encoding="utf-8") as f:
        html = f.read()
    
    soup = BeautifulSoup(html, "html.parser")
    
    # Debug: mostra struttura
    print("\n🔍 Analisi HTML CSI List:")
    print(f"   Lunghezza HTML: {len(html)} caratteri")
    
    # Cerca la lista eventi
    lista = soup.find("ul", class_="latestnews-items")
    print(f"   Lista trovata: {lista is not None}")
    
    if lista:
        items = lista.find_all("li", recursive=False)
        print(f"   Numero <li>: {len(items)}")
        
        if items:
            first_li = items[0]
            print(f"\n   Primo <li>:")
            print(f"   {first_li.prettify()[:500]}")
            
            a = first_li.find("a", href=True)
            print(f"\n   Link trovato: {a is not None}")
            if a:
                print(f"   href: {a['href']}")
                print(f"   testo: {a.get_text(strip=True)}")
    else:
        # Cerca altre possibili strutture
        print("\n   ⚠️ Lista non trovata! Cerco strutture alternative...")
        all_uls = soup.find_all("ul")
        print(f"   Totale <ul>: {len(all_uls)}")
        for i, ul in enumerate(all_uls[:3]):
            print(f"   <ul> {i}: class={ul.get('class')}")


def test_csi_detail_structure():
    """Verifica la struttura dell'HTML del dettaglio CSI."""
    fixture = Path("tests/fixtures/csi_detail.html")
    
    if not fixture.exists():
        pytest.skip("csi_detail.html non trovato - esegui capture_html.py")
    
    with open(fixture, encoding="utf-8") as f:
        html = f.read()
    
    soup = BeautifulSoup(html, "html.parser")
    
    print("\n🔍 Analisi HTML CSI Detail:")
    print(f"   Lunghezza HTML: {len(html)} caratteri")
    
    # Cerca titolo
    title = soup.find("h2", class_="contentheading")
    print(f"   Titolo trovato: {title is not None}")
    if title:
        print(f"   Testo titolo: {title.get_text(strip=True)}")
    
    # Cerca contenuto
    content = soup.find("div", class_="jsn-article-content")
    print(f"   Contenuto trovato: {content is not None}")
    if content:
        text = content.get_text(separator="\n", strip=True)
        print(f"   Prime 3 righe contenuto:")
        for line in text.split("\n")[:3]:
            print(f"     {line}")
        
        # Cerca immagine
        img = content.find("img")
        print(f"   Immagine trovata: {img is not None}")
        if img:
            print(f"   src: {img.get('src')}")
    
    # Cerca data
    active_li = soup.select_one("ul.latestnews-items li.active")
    print(f"   Data trovata: {active_li is not None}")
    if active_li:
        day = active_li.select_one("span.position1.day")
        month = active_li.select_one("span.position3.month")
        print(f"   Giorno: {day.get_text(strip=True) if day else 'N/A'}")
        print(f"   Mese: {month.get_text(strip=True) if month else 'N/A'}")


def test_scraper_actual_fetch():
    """Test reale dello scraper CSI."""
    scraper = CSIScraper()
    
    print("\n🕷️ Esecuzione scraper CSI...")
    events = scraper.fetch_events()
    
    print(f"   Eventi trovati: {len(events)}")
    
    if events:
        print(f"\n   Primo evento:")
        e = events[0]
        print(f"     Titolo: {e.title}")
        print(f"     Data: {e.date}")
        print(f"     Città: {e.location.city}")
        print(f"     Provincia: {e.location.province}")
        print(f"     Poster: {e.poster}")
    else:
        print("   ⚠️ NESSUN EVENTO TROVATO!")
    
    # Verifica che almeno 1 evento sia presente
    assert len(events) > 0, "Lo scraper CSI non ha trovato eventi!"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])