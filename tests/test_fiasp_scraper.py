"""
Tests for FIASP scraper parsing logic.
Tests only the HTML parsing methods, not HTTP requests or database operations.
"""
import pytest
from bs4 import BeautifulSoup
from scraper.scrapers.fiasp_scraper import FIASPScraper
from scraper.models.provinces import Province


class TestFIASPScraperParsing:
    """Tests for FIASP HTML parsing methods."""
    
    def test_source_name(self):
        """Test scraper source name."""
        scraper = FIASPScraper()
        assert scraper.source_name == "FIASP Italia"
    
    def test_parse_html_basic(self):
        """Test parsing basic FIASP HTML table."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th></tr>
                <tr>
                    <td>10/02/2026</td>
                    <td>Test Event</td>
                    <td>Bergamo (BG)</td>
                </tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        assert len(events) == 1
        assert events[0].title == "Test Event"
        assert events[0].date == "10/02/2026"
        assert events[0].location.city == "Bergamo"
        assert events[0].location.province == Province.BG
        assert events[0].source == "FIASP"
    
    def test_parse_html_empty_table(self):
        """Test parsing HTML with no table."""
        html = "<html><body><p>No events</p></body></html>"
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        assert events == []
    
    def test_parse_html_with_malformed_rows(self):
        """Test parsing HTML with incomplete rows (skips them)."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th></tr>
                <tr><td>01/01/2024</td></tr>
                <tr><td>02/02/2026</td><td>Valid Event</td><td>Milano (MI)</td></tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        # Should skip malformed row and parse only valid one
        assert len(events) == 1
        assert events[0].title == "Valid Event"
    
    def test_parse_html_with_distances(self):
        """Test parsing HTML with distance information."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th><th>Distanze</th></tr>
                <tr>
                    <td>01/03/2026</td>
                    <td>Test Event</td>
                    <td>Bergamo (BG)</td>
                    <td>5 - 10 - 15</td>
                </tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        assert len(events) == 1
        assert len(events[0].distances) >= 2
    
    def test_parse_html_with_poster_link(self):
        """Test parsing HTML with poster/flyer link in 7th column."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th><th>D1</th><th>D2</th><th>D3</th><th>Volantino</th></tr>
                <tr>
                    <td>01/03/2026</td>
                    <td>Test Event</td>
                    <td>Bergamo (BG)</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><a href="https://example.com/poster.pdf">PDF</a></td>
                </tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        assert len(events) == 1
        assert events[0].poster is not None
        assert "example.com" in str(events[0].poster)
    
    def test_parse_html_without_poster(self):
        """Test parsing HTML with missing poster column."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th></tr>
                <tr>
                    <td>01/03/2026</td>
                    <td>Test Event</td>
                    <td>Bergamo (BG)</td>
                </tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        assert len(events) == 1
        assert events[0].poster is None
    
    def test_parse_row_with_various_provinces(self):
        """Test parsing rows with different province codes."""
        test_cases = [
            ("Milano (MI)", "Milano", Province.MI),
            ("Roma (RM)", "Roma", Province.RM),
            ("Napoli (NA)", "Napoli", Province.NA),
            ("Torino (TO)", "Torino", Province.TO),
        ]
        
        for location_str, expected_city, expected_province in test_cases:
            html = f"""
            <html><body>
                <table>
                    <tr><th>Data</th><th>Titolo</th><th>Località</th></tr>
                    <tr>
                        <td>01/03/2026</td>
                        <td>Test Event</td>
                        <td>{location_str}</td>
                    </tr>
                </table>
            </body></html>
            """
            scraper = FIASPScraper()
            events = scraper._parse_html(html)
            
            assert len(events) == 1
            assert events[0].location.city == expected_city
            assert events[0].location.province == expected_province
    
    def test_extract_poster_with_valid_link(self):
        """Test _extract_poster method with valid poster link."""
        html = """
        <tr>
            <td>01/03/2026</td>
            <td>Event</td>
            <td>City</td>
            <td></td>
            <td></td>
            <td></td>
            <td><a href="https://example.com/flyer.pdf">Link</a></td>
        </tr>
        """
        soup = BeautifulSoup(html, "html.parser")
        row = soup.find("tr")
        cols = row.find_all("td")
        
        scraper = FIASPScraper()
        poster = scraper._extract_poster(cols)
        
        assert poster == "https://example.com/flyer.pdf"
    
    def test_extract_poster_with_no_link(self):
        """Test _extract_poster method with no link."""
        html = """
        <tr>
            <td>01/03/2026</td>
            <td>Event</td>
            <td>City</td>
        </tr>
        """
        soup = BeautifulSoup(html, "html.parser")
        row = soup.find("tr")
        cols = row.find_all("td")
        
        scraper = FIASPScraper()
        poster = scraper._extract_poster(cols)
        
        assert poster is None
    
    def test_parse_multiple_events(self):
        """Test parsing HTML with multiple events."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th></tr>
                <tr><td>01/03/2026</td><td>Event 1</td><td>Bergamo (BG)</td></tr>
                <tr><td>02/03/2026</td><td>Event 2</td><td>Milano (MI)</td></tr>
                <tr><td>03/03/2026</td><td>Event 3</td><td>Roma (RM)</td></tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        assert len(events) == 3
        assert events[0].title == "Event 1"
        assert events[1].title == "Event 2"
        assert events[2].title == "Event 3"
