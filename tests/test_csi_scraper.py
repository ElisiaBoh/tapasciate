"""
Tests for CSI scraper parsing logic.
Tests only the parsing methods, not HTTP requests or database operations.
"""
import pytest
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.scrapers.csi_scraper import CSIScraper
from scraper.models.provinces import Province


class TestCSIScraperParsing:
    """Tests for CSI HTML parsing methods."""
    
    def test_source_name(self):
        """Test scraper source name."""
        scraper = CSIScraper()
        assert scraper.source_name == "CSI Bergamo"
    
    def test_extract_poster_with_absolute_url(self):
        """Test _extract_poster with absolute URL."""
        html = """
        <div class="jsn-article-content">
            <img src="https://example.com/poster.jpg" alt="Poster">
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        content = soup.find("div", class_="jsn-article-content")
        
        scraper = CSIScraper()
        poster = scraper._extract_poster(content)
        
        assert poster == "https://example.com/poster.jpg"
    
    def test_extract_poster_with_relative_url(self):
        """Test _extract_poster with relative URL (gets BASE_CSI_BERGAMO prefix)."""
        html = """
        <div class="jsn-article-content">
            <img src="/images/poster.jpg" alt="Poster">
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        content = soup.find("div", class_="jsn-article-content")
        
        scraper = CSIScraper()
        poster = scraper._extract_poster(content)
        
        assert poster.startswith("https://www.csibergamo.it")
        assert poster.endswith("/images/poster.jpg")
    
    def test_extract_poster_no_image(self):
        """Test _extract_poster with no image."""
        html = """
        <div class="jsn-article-content">
            <p>No images here</p>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        content = soup.find("div", class_="jsn-article-content")
        
        scraper = CSIScraper()
        poster = scraper._extract_poster(content)
        
        assert poster is None
    
    def test_extract_poster_no_content(self):
        """Test _extract_poster with None content."""
        scraper = CSIScraper()
        poster = scraper._extract_poster(None)
        
        assert poster is None
    
    def test_parse_date_valid(self):
        """Test _parse_date with valid date structure."""
        html = """
        <html><body>
            <ul class="latestnews-items">
                <li class="active">
                    <span class="position1 day">15</span>
                    <span class="position3 month">Marzo</span>
                </li>
            </ul>
        </body></html>
        """
        soup = BeautifulSoup(html, "html.parser")
        
        scraper = CSIScraper()
        date = scraper._parse_date(soup)
        
        year = datetime.now().year
        assert date == f"15/03/{year}"
    
    def test_parse_date_all_months(self):
        """Test _parse_date with all Italian month names."""
        months = {
            "Gennaio": "01", "Febbraio": "02", "Marzo": "03", 
            "Aprile": "04", "Maggio": "05", "Giugno": "06",
            "Luglio": "07", "Agosto": "08", "Settembre": "09",
            "Ottobre": "10", "Novembre": "11", "Dicembre": "12"
        }
        
        scraper = CSIScraper()
        year = datetime.now().year
        
        for month_name, month_num in months.items():
            html = f"""
            <html><body>
                <ul class="latestnews-items">
                    <li class="active">
                        <span class="position1 day">10</span>
                        <span class="position3 month">{month_name}</span>
                    </li>
                </ul>
            </body></html>
            """
            soup = BeautifulSoup(html, "html.parser")
            date = scraper._parse_date(soup)
            
            assert date == f"10/{month_num}/{year}"
    
    def test_parse_date_single_digit_day(self):
        """Test _parse_date pads single digit days with zero."""
        html = """
        <html><body>
            <ul class="latestnews-items">
                <li class="active">
                    <span class="position1 day">5</span>
                    <span class="position3 month">Marzo</span>
                </li>
            </ul>
        </body></html>
        """
        soup = BeautifulSoup(html, "html.parser")
        
        scraper = CSIScraper()
        date = scraper._parse_date(soup)
        
        year = datetime.now().year
        assert date == f"05/03/{year}"
    
    def test_parse_date_missing_active_li(self):
        """Test _parse_date with no active li element."""
        html = """
        <html><body>
            <ul class="latestnews-items">
                <li>
                    <span class="position1 day">15</span>
                    <span class="position3 month">Marzo</span>
                </li>
            </ul>
        </body></html>
        """
        soup = BeautifulSoup(html, "html.parser")
        
        scraper = CSIScraper()
        date = scraper._parse_date(soup)
        
        assert date == ""
    
    def test_parse_date_missing_day_tag(self):
        """Test _parse_date with missing day span."""
        html = """
        <html><body>
            <ul class="latestnews-items">
                <li class="active">
                    <span class="position3 month">Marzo</span>
                </li>
            </ul>
        </body></html>
        """
        soup = BeautifulSoup(html, "html.parser")
        
        scraper = CSIScraper()
        date = scraper._parse_date(soup)
        
        assert date == ""
    
    def test_parse_date_missing_month_tag(self):
        """Test _parse_date with missing month span."""
        html = """
        <html><body>
            <ul class="latestnews-items">
                <li class="active">
                    <span class="position1 day">15</span>
                </li>
            </ul>
        </body></html>
        """
        soup = BeautifulSoup(html, "html.parser")
        
        scraper = CSIScraper()
        date = scraper._parse_date(soup)
        
        assert date == ""
    
    def test_parse_date_unknown_month(self):
        """Test _parse_date with unknown month name."""
        html = """
        <html><body>
            <ul class="latestnews-items">
                <li class="active">
                    <span class="position1 day">15</span>
                    <span class="position3 month">UnknownMonth</span>
                </li>
            </ul>
        </body></html>
        """
        soup = BeautifulSoup(html, "html.parser")
        
        scraper = CSIScraper()
        date = scraper._parse_date(soup)
        
        year = datetime.now().year
        assert date == f"15/00/{year}"  # Falls back to "00"
