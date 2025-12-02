"""
Tests for FIASP scraper.
Combines original unittest tests with new pytest tests.
"""
import pytest
from pathlib import Path
from unittest.mock import Mock, patch
from scraper.scrapers.fiasp_scraper import FIASPScraper
from scraper.models.provinces import Province


# ============================================================================
# ORIGINAL TESTS (from test_fiasp.py)
# ============================================================================

class TestFiaspParsingOriginal:
    """Original tests for FIASP HTML parsing from test_fiasp.py."""
    
    def test_parse_fiasp_html_original(self):
        """Original test: parse test_fiasp_events.html fixture."""
        # Try both old and new fixture locations
        fixture_paths = [
            Path("tests/test_fiasp_events.html"),
            Path("tests/fixtures/test_fiasp_events.html"),
        ]
        
        html = None
        for path in fixture_paths:
            if path.exists():
                with open(path, encoding="utf-8") as f:
                    html = f.read()
                break
        
        if html is None:
            pytest.skip("test_fiasp_events.html fixture not found")
        
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        # Original assertions
        assert len(events) == 292
        
        e1 = events[0]
        assert e1.title == "52° EL GIR DI CENT FOO"
        assert e1.date == "10/08/2025"
        assert e1.location.city == "Barni"
        assert e1.location.province == Province.CO
        # Original test had poster check commented out
        # assert "https://drive.google.com" in e1.poster
        
        e2 = events[1]
        assert e2.title == "7ª CAMMINATA SAN GAETANO"
        assert e2.location.city == "Ponti sul Mincio"
        assert e2.location.province == Province.MN
        assert e2.poster is not None


# ============================================================================
# NEW EXTENDED TESTS
# ============================================================================

class TestFIASPScraper:
    """Extended tests for FIASPScraper."""
    
    def test_source_name(self):
        """Test scraper source name."""
        scraper = FIASPScraper()
        assert scraper.source_name == "FIASP Italia"
    
    def test_parse_html_with_fixture(self, fiasp_html):
        """Test parsing FIASP HTML with fixture from conftest."""
        scraper = FIASPScraper()
        events = scraper._parse_html(fiasp_html)
        
        # Basic assertions
        assert isinstance(events, list)
        
        if len(events) > 0:
            # Check first event structure
            event = events[0]
            assert event.source == "FIASP"
            assert event.title
            assert event.date
            assert event.location
            assert isinstance(event.distances, list)
    
    def test_parse_empty_html(self):
        """Test parsing HTML with no table."""
        html = "<html><body><p>No events</p></body></html>"
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        assert events == []
    
    def test_parse_html_with_malformed_rows(self):
        """Test parsing HTML with incomplete rows."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th></tr>
                <tr><td>01/01/2024</td></tr>
                <tr><td>02/01/2024</td><td>Event</td><td>City (BG)</td></tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        # Should skip malformed row and parse valid one
        assert len(events) >= 1
        if events:
            assert events[0].title == "Event"
    
    def test_parse_html_with_distances(self):
        """Test parsing HTML with distance information."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th><th>Distanze</th></tr>
                <tr>
                    <td>01/01/2024</td>
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
        """Test parsing HTML with poster/flyer link."""
        html = """
        <html><body>
            <table>
                <tr><th>Data</th><th>Titolo</th><th>Località</th><th>D1</th><th>D2</th><th>D3</th><th>Volantino</th></tr>
                <tr>
                    <td>01/01/2024</td>
                    <td>Test Event</td>
                    <td>Bergamo (BG)</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><a href="https://example.com/poster.jpg">Volantino</a></td>
                </tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)
        
        assert len(events) == 1
        assert events[0].poster is not None
        assert "example.com" in str(events[0].poster)
    
    @patch('scraper.scrapers.fiasp_scraper.requests.get')
    def test_fetch_events_network_error(self, mock_get):
        """Test handling of network errors."""
        mock_get.side_effect = Exception("Network error")
        
        scraper = FIASPScraper()
        events = scraper.fetch_events()
        
        assert events == []
    
    @patch('scraper.scrapers.fiasp_scraper.requests.get')
    def test_fetch_events_success(self, mock_get, fiasp_html):
        """Test successful event fetching."""
        mock_response = Mock()
        mock_response.text = fiasp_html
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        scraper = FIASPScraper()
        events = scraper.fetch_events()
        
        assert isinstance(events, list)
    
    def test_parse_row_with_various_provinces(self):
        """Test parsing rows with different province codes."""
        test_cases = [
            ("Milano (MI)", "Milano", Province.MI),
            ("Roma (RM)", "Roma", Province.RM),
            ("Napoli (NA)", "Napoli", Province.NA),
        ]
        
        for location_str, expected_city, expected_province in test_cases:
            html = f"""
            <html><body>
                <table>
                    <tr><th>Data</th><th>Titolo</th><th>Località</th></tr>
                    <tr>
                        <td>01/01/2024</td>
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
