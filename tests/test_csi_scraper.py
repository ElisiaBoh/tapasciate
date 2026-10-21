"""
Tests for CSI scraper parsing logic.
Tests only the parsing methods, not HTTP requests or database operations.
"""
from unittest.mock import patch
from bs4 import BeautifulSoup
from datetime import datetime
from scraper.scrapers.csi_scraper import CSIScraper


class TestCSISourceId:
    """L'id dell'articolo CSI identifica l'evento anche se cambiano titolo o data."""

    def test_estrae_id_articolo_dall_url(self):
        href = "/avvisi/prossime-marce/218-marce/non-competitive/5952-2026-quater-salcc-e-öna-biida.html"
        assert CSIScraper._extract_source_id(href) == "5952"

    def test_url_senza_id_restituisce_none(self):
        assert CSIScraper._extract_source_id("/avvisi/prossime-marce.html") is None

    @patch("scraper.scrapers.csi_scraper.requests.get", side_effect=Exception("timeout"))
    def test_evento_visto_anche_se_il_dettaglio_non_si_scarica(self, mock_get):
        li = BeautifulSoup(
            '<li><a href="/avvisi/prossime-marce/218-marce/non-competitive/6086-panoramica.html">Mapello</a></li>',
            "html.parser",
        ).li
        scraper = CSIScraper()

        assert scraper._parse_event_item(li) is None
        assert scraper._seen_ids == {"6086"}


class TestCSIScraperParsing:
    """Tests for CSI HTML parsing methods."""
    
    def test_source_name(self):
        """Test scraper source name."""
        scraper = CSIScraper()
        assert scraper.source_name == "CSI Bergamo"
    
    @patch.object(CSIScraper, "_upload_poster_pages", return_value=[])
    @patch.object(CSIScraper, "_images_to_pdf", return_value=b"%PDF")
    @patch("scraper.scrapers.csi_scraper.requests.get")
    def test_extract_and_upload_poster_downloads_every_image(self, mock_get, _mock_pdf, mock_upload):
        """Relative image URLs get the CSI Bergamo prefix, absolute ones are kept."""
        html = """
        <div class="jsn-article-content">
            <img src="/images/poster.jpg">
            <img src="https://example.com/back.jpg">
        </div>
        """
        content = BeautifulSoup(html, "html.parser").find("div")
        mock_get.return_value.content = b"img"

        CSIScraper()._extract_and_upload_poster(content, "Title", "15/03/2026")

        urls = [call.args[0] for call in mock_get.call_args_list]
        assert urls == ["https://www.csibergamo.it/images/poster.jpg", "https://example.com/back.jpg"]
        mock_upload.assert_called_once_with("csi", "Title", "15/03/2026", b"%PDF")

    @patch("scraper.scrapers.csi_scraper.requests.get")
    def test_extract_and_upload_poster_without_images(self, mock_get):
        """No content or no images: nothing is downloaded."""
        html = '<div class="jsn-article-content"><p>No images here</p></div>'
        content = BeautifulSoup(html, "html.parser").find("div")

        scraper = CSIScraper()
        assert scraper._extract_and_upload_poster(content, "Title", "15/03/2026") == []
        assert scraper._extract_and_upload_poster(None, "Title", "15/03/2026") == []
        mock_get.assert_not_called()

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
        
        assert date == ""
