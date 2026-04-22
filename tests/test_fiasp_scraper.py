"""
Tests for FIASP scraper parsing logic.
Tests only the HTML parsing methods, not HTTP requests or database operations.
"""
import pytest
from unittest.mock import patch, MagicMock
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

    @patch.object(FIASPScraper, '_download_and_upload_poster',
                  return_value="https://xyz.supabase.co/storage/v1/object/public/posters/fiasp-test-event-2026-03-01.pdf")
    def test_parse_html_with_poster_link(self, mock_upload):
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
                    <td><a href="https://drive.google.com/file/d/1abc123/view">PDF</a></td>
                </tr>
            </table>
        </body></html>
        """
        scraper = FIASPScraper()
        events = scraper._parse_html(html)

        assert len(events) == 1
        assert events[0].poster is not None
        assert "supabase.co" in str(events[0].poster)
        mock_upload.assert_called_once_with(
            "https://drive.google.com/file/d/1abc123/view", "Test Event", "01/03/2026"
        )

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


class TestFIASPPosterUpload:
    """Tests for FIASP poster download and upload logic."""

    def test_extract_gdrive_file_id_from_view_url(self):
        """Estrae file ID da URL /file/d/{ID}/view."""
        scraper = FIASPScraper()
        fid = scraper._extract_gdrive_file_id(
            "https://drive.google.com/file/d/1abc123XYZ/view?usp=sharing"
        )
        assert fid == "1abc123XYZ"

    def test_extract_gdrive_file_id_from_open_url(self):
        """Estrae file ID da URL ?id={ID}."""
        scraper = FIASPScraper()
        fid = scraper._extract_gdrive_file_id(
            "https://drive.google.com/open?id=1abc123XYZ"
        )
        assert fid == "1abc123XYZ"

    def test_extract_gdrive_file_id_from_uc_url(self):
        """Estrae file ID da URL uc?id={ID}."""
        scraper = FIASPScraper()
        fid = scraper._extract_gdrive_file_id(
            "https://drive.google.com/uc?id=1abc123XYZ&export=download"
        )
        assert fid == "1abc123XYZ"

    def test_extract_gdrive_file_id_non_gdrive(self):
        """Ritorna None per URL non Google Drive."""
        scraper = FIASPScraper()
        fid = scraper._extract_gdrive_file_id("https://example.com/poster.pdf")
        assert fid is None

    @patch('scraper.scrapers.fiasp_scraper.requests.get')
    @patch('scraper.db.supabase_client.SupabaseManager.upload_poster',
           return_value="https://xyz.supabase.co/storage/v1/object/public/posters/fiasp-test-event-2026-03-01.pdf")
    def test_download_and_upload_poster_gdrive_pdf(self, mock_upload, mock_get):
        """Scarica un PDF da Google Drive e lo carica su Supabase."""
        mock_resp = MagicMock()
        mock_resp.content = b"%PDF-1.4 fake content"
        mock_resp.headers = {'Content-Type': 'application/pdf'}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        scraper = FIASPScraper()
        result = scraper._download_and_upload_poster(
            "https://drive.google.com/file/d/1abc123XYZ/view",
            "Test Event",
            "01/03/2026"
        )

        assert result == "https://xyz.supabase.co/storage/v1/object/public/posters/fiasp-test-event-2026-03-01.pdf"
        # Deve usare l'URL di download diretto di Google Drive
        called_url = mock_get.call_args[0][0]
        assert "drive.usercontent.google.com" in called_url
        assert "1abc123XYZ" in called_url
        mock_upload.assert_called_once_with("fiasp-test-event-2026-03-01.pdf", b"%PDF-1.4 fake content")

    @patch('scraper.scrapers.fiasp_scraper.requests.get')
    def test_download_and_upload_poster_returns_none_on_html_response(self, mock_get):
        """Ritorna None se il server risponde con HTML (es. pagina di virus scan)."""
        mock_resp = MagicMock()
        mock_resp.content = b"<html>Virus scan warning</html>"
        mock_resp.headers = {'Content-Type': 'text/html; charset=utf-8'}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        scraper = FIASPScraper()
        result = scraper._download_and_upload_poster(
            "https://drive.google.com/file/d/1abc123XYZ/view",
            "Test Event",
            "01/03/2026"
        )
        assert result is None

    @patch('scraper.scrapers.fiasp_scraper.requests.get', side_effect=Exception("connection error"))
    def test_download_and_upload_poster_returns_none_on_network_error(self, mock_get):
        """Ritorna None in caso di errore di rete."""
        scraper = FIASPScraper()
        result = scraper._download_and_upload_poster(
            "https://drive.google.com/file/d/1abc123XYZ/view",
            "Test Event",
            "01/03/2026"
        )
        assert result is None

    @patch('scraper.scrapers.fiasp_scraper.requests.get')
    @patch('scraper.db.supabase_client.SupabaseManager.upload_poster',
           return_value="https://xyz.supabase.co/storage/v1/object/public/posters/fiasp-test-event-2026-03-01.pdf")
    def test_download_and_upload_poster_accepts_octet_stream(self, mock_upload, mock_get):
        """Accetta application/octet-stream (Google Drive restituisce questo per i PDF)."""
        mock_resp = MagicMock()
        mock_resp.content = b"%PDF-1.4 fake content"
        mock_resp.headers = {'Content-Type': 'application/octet-stream'}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        scraper = FIASPScraper()
        result = scraper._download_and_upload_poster(
            "https://drive.google.com/file/d/1abc123XYZ/view",
            "Test Event",
            "01/03/2026"
        )
        assert result is not None
        mock_upload.assert_called_once()
