# 🧪 Test Suite - Tapasciate

Suite completa di test per gli scraper Tapasciate.

## 🔄 Migrazione completata

✅ Tutti i test originali (unittest) sono stati mantenuti e integrati con nuovi test pytest.  
✅ I test originali sono nelle classi `*Original` per facile identificazione.  
✅ Aggiunti 20+ nuovi test per maggiore copertura.

---

## 📁 Struttura

```
tests/
├── conftest.py              # Configurazione pytest e fixtures condivise
├── fixtures/                # File HTML reali dai siti
│   ├── csi_list.html       # Lista eventi CSI Bergamo
│   ├── csi_detail.html     # Dettaglio evento CSI
│   └── fiasp_events.html   # Tabella eventi FIASP (ex test_fiasp_events.html)
├── test_models.py          # Test modelli Pydantic (Event, Location, Province)
├── test_parsers.py         # Test parsing (parse_location, parse_distances)
├── test_csi_scraper.py     # Test scraper CSI Bergamo
├── test_fiasp_scraper.py   # Test scraper FIASP
├── capture_html.py         # Script per catturare HTML reali dai siti
├── pytest.ini              # Configurazione pytest
└── README.md               # Questa guida
```

---

## 🚀 Esecuzione Test

### Setup iniziale (una volta sola)

```bash
# Installa pytest e coverage
pip3.11 install pytest pytest-cov

# Cattura HTML reali dai siti
python3.11 tests/capture_html.py
```

### Esegui tutti i test

```bash
# Dalla root del progetto
python3.11 -m pytest tests/ -v
```

### Esegui test specifici

```bash
# Solo test dei parser
python3.11 -m pytest tests/test_parsers.py -v

# Solo test dei modelli
python3.11 -m pytest tests/test_models.py -v

# Solo test CSI scraper
python3.11 -m pytest tests/test_csi_scraper.py -v

# Solo test FIASP scraper
python3.11 -m pytest tests/test_fiasp_scraper.py -v

# Solo test originali (quelli migrati da unittest)
python3.11 -m pytest tests/test_parsers.py::TestParseLocationOriginal -v
python3.11 -m pytest tests/test_fiasp_scraper.py::TestFiaspParsingOriginal -v
```

### Test con output dettagliato

```bash
# Mostra print() statements
python3.11 -m pytest tests/ -v -s

# Mostra anche variabili locali in caso di errore
python3.11 -m pytest tests/ -v -l

# Entrambi
python3.11 -m pytest tests/ -vv -s
```

### Test con coverage

```bash
# Coverage base (output terminale)
python3.11 -m pytest tests/ --cov=scraper --cov-report=term

# Coverage con report HTML interattivo
python3.11 -m pytest tests/ --cov=scraper --cov-report=html

# Apri il report
open htmlcov/index.html  # macOS
```

### Esegui solo test veloci (esclude test di rete)

```bash
python3.11 -m pytest tests/ -v -m "not network"
```

---

## 📥 Catturare HTML Reali

Per aggiornare i file HTML di test con dati reali dai siti web:

```bash
python3.11 tests/capture_html.py
```

**Questo script:**
1. 📡 Scarica la pagina lista eventi CSI Bergamo
2. 📡 Scarica una pagina dettaglio evento CSI
3. 📡 Scarica la tabella eventi FIASP
4. 💾 Salva tutto in `tests/fixtures/`
5. 📊 Mostra statistiche sui file catturati

**Quando usarlo:**
- ✅ Dopo cambiamenti nella struttura HTML dei siti web
- ✅ Quando i test falliscono per differenze HTML inaspettate
- ✅ Per aggiungere nuovi casi di test reali
- ✅ Prima di fare debug su errori di parsing
- ✅ Periodicamente (es. ogni mese) per mantenere i test aggiornati

---

## 🔍 Debug Test Falliti

### Scenario 1: Test fallisce con HTML reale

```bash
# 1. Cattura nuovo HTML dai siti
python3.11 tests/capture_html.py

# 2. Esegui test specifico con output dettagliato
python3.11 -m pytest tests/test_fiasp_scraper.py::TestFiaspParsingOriginal::test_parse_fiasp_html_original -vv -s

# 3. Guarda l'HTML catturato
open tests/fixtures/fiasp_events.html  # macOS
cat tests/fixtures/fiasp_events.html   # Linux
```

### Scenario 2: Capire cosa viene parsato

Aggiungi print temporanei nel test:

```python
def test_parse_html_with_fixture(self, fiasp_html):
    scraper = FIASPScraper()
    events = scraper._parse_html(fiasp_html)
    
    # 🔍 Debug output
    print(f"\n📊 Trovati {len(events)} eventi")
    for i, event in enumerate(events[:3]):  # Primi 3
        print(f"  Evento {i+1}:")
        print(f"    Titolo: {event.title}")
        print(f"    Data: {event.date}")
        print(f"    Località: {event.location.city} ({event.location.province})")
        print(f"    Distanze: {event.distances}")
    
    assert len(events) > 0
```

Esegui con `-s` per vedere i print:
```bash
python3.11 -m pytest tests/test_fiasp_scraper.py -v -s
```

### Scenario 3: Analizza HTML manualmente

Crea uno script temporaneo `debug_html.py`:

```python
from bs4 import BeautifulSoup
from pathlib import Path

# Carica HTML
html_file = Path("tests/fixtures/fiasp_events.html")
with open(html_file, encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

# Analizza struttura
table = soup.find("table")
if table:
    rows = table.find_all("tr")
    print(f"📊 Totale righe: {len(rows)}")
    
    # Mostra header
    if rows:
        print("\n📋 Header:")
        for i, th in enumerate(rows[0].find_all("th")):
            print(f"  Col {i}: {th.get_text(strip=True)}")
    
    # Mostra prima riga dati
    if len(rows) > 1:
        print("\n📝 Prima riga dati:")
        for i, td in enumerate(rows[1].find_all("td")):
            print(f"  Col {i}: {td.get_text(strip=True)}")
else:
    print("❌ Nessuna tabella trovata!")
```

Esegui:
```bash
python3.11 debug_html.py
```

### Scenario 4: Confronta HTML vecchio vs nuovo

```bash
# Backup del vecchio HTML
cp tests/fixtures/fiasp_events.html tests/fixtures/fiasp_events_OLD.html

# Cattura nuovo HTML
python3.11 tests/capture_html.py

# Confronta
diff tests/fixtures/fiasp_events_OLD.html tests/fixtures/fiasp_events.html
```

---

## 📊 Coverage Report

Per vedere quali parti del codice sono coperte dai test:

```bash
# Report nel terminale
python3.11 -m pytest tests/ --cov=scraper --cov-report=term-missing

# Report HTML dettagliato
python3.11 -m pytest tests/ --cov=scraper --cov-report=html

# Apri nel browser
open htmlcov/index.html
```

**Target coverage: > 80%**

Il report HTML mostra:
- ✅ Linee coperte (verde)
- ❌ Linee non coperte (rosso)
- ⚠️ Branch non testati (giallo)

---

## 📚 Contenuto Test Suite

### test_parsers.py (28 test totali)

**Test originali mantenuti:**
- `TestParseLocationOriginal` (5 test da unittest)
- `TestParseDistancesOriginal` (1 test da unittest)

**Nuovi test aggiunti:**
- `TestParseLocationExtended` (6 test)
- `TestParseDistancesExtended` (16 test con parametrize)

### test_fiasp_scraper.py (10 test totali)

**Test originali mantenuti:**
- `TestFiaspParsingOriginal::test_parse_fiasp_html_original` (verifica 292 eventi)

**Nuovi test aggiunti:**
- `TestFIASPScraper` (9 test): empty HTML, malformed rows, network errors, mocking

### test_csi_scraper.py (4 test)

**Nuovi test:**
- Test parsing date italiane
- Test conversione mesi (Gennaio→01, etc.)
- Test con HTML fixture
- Test con mock HTTP

### test_models.py (6 test)

**Nuovi test:**
- Validazione Location
- Validazione Event
- Test province invalide
- Serializzazione JSON

---

## ✅ Best Practices

### 1. Usa fixture reali
Sempre cattura HTML dai siti veri prima di testare modifiche importanti.

### 2. Test isolati
Ogni test deve essere indipendente. Non fare assunzioni su ordine di esecuzione.

### 3. Mock network calls
Usa `@patch` per evitare chiamate HTTP reali nei test (tranne capture_html.py).

### 4. Nomi descrittivi
```python
# ✅ Buono
def test_parse_location_with_province_in_parentheses():

# ❌ Cattivo
def test1():
```

### 5. Arrange-Act-Assert
Organizza test in 3 sezioni chiare:
```python
def test_something():
    # Arrange - prepara dati
    input_data = "test"
    
    # Act - esegui azione
    result = function(input_data)
    
    # Assert - verifica risultato
    assert result == expected
```

### 6. Usa parametrize per test simili
```python
@pytest.mark.parametrize("input,expected", [
    ("Milano (MI)", "Milano"),
    ("Roma (RM)", "Roma"),
])
def test_cities(input, expected):
    result = parse_city(input)
    assert result == expected
```

### 7. Skip intelligente
Se un fixture manca, salta il test:
```python
if not fixture_file.exists():
    pytest.skip("Fixture not found")
```

---

## 🐛 Troubleshooting

### ModuleNotFoundError: No module named 'scraper'

**Causa:** Stai eseguendo da directory sbagliata o import non configurati.

**Soluzione:**
```bash
# Assicurati di essere nella root del progetto
cd /Users/elisia/Desktop/tapasciate

# Esegui così
python3.11 -m pytest tests/
```

### Fixture 'fiasp_html' not found

**Causa:** File HTML non catturato.

**Soluzione:**
```bash
# Cattura HTML
python3.11 tests/capture_html.py

# Verifica che esistano
ls -la tests/fixtures/
```

### Import error in test files

**Causa:** Import relativi invece di assoluti.

**Soluzione:**
```python
# ✅ Corretto - import assoluti
from scraper.models.event import Event
from scraper.utils.parsers import parse_location

# ❌ Sbagliato - import relativi
from ..scraper.models.event import Event
```

### Test passa in locale ma fallisce su GitHub Actions

**Causa:** Differenze ambiente o fixture mancante.

**Soluzione:**
1. Verifica che `tests/fixtures/` sia committato su Git
2. Controlla che il workflow GitHub installi tutte le dipendenze
3. Usa `pytest -v` per vedere output dettagliato

### BeautifulSoup warning

**Warning:** `UserWarning: No parser was explicitly specified`

**Soluzione:** Già risolto - usiamo `html.parser` ovunque.

---

## 🎯 Comandi Rapidi

```bash
# Test tutto
pytest tests/ -v

# Test + coverage
pytest tests/ --cov=scraper --cov-report=html && open htmlcov/index.html

# Test solo 1 file
pytest tests/test_parsers.py -v

# Test solo 1 classe
pytest tests/test_parsers.py::TestParseLocationOriginal -v

# Test solo 1 funzione
pytest tests/test_parsers.py::TestParseLocationOriginal::test_multiword_city -v

# Test con output
pytest tests/ -v -s

# Test veloce (skip slow)
pytest tests/ -v -m "not slow"

# Aggiorna HTML
python3.11 tests/capture_html.py

# Clean cache
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null
```

---

## 📖 Risorse

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest Parametrize](https://docs.pytest.org/en/stable/how-to/parametrize.html)
- [Pytest Fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- [unittest.mock](https://docs.python.org/3/library/unittest.mock.html)
- [BeautifulSoup4 Docs](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

---

## 📞 Support

Per problemi o domande sui test:
1. Controlla questo README
2. Leggi `MIGRATION_TESTS.md` per dettagli migrazione
3. Esegui `pytest tests/ -v` per vedere errori dettagliati
4. Apri un issue su GitHub con output completo

---

**Ultimo aggiornamento:** Dicembre 2024  
**Versione test suite:** 2.0  
**Coverage target:** > 80%  
**Status:** ✅ Tutti i test passano
