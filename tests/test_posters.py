"""
Test per la conversione dei poster in immagini e la pulizia dei file su Storage.
"""
import io
import pytest
from unittest.mock import patch, MagicMock
from PIL import Image
from scraper.scrapers.base import BaseScraper
from scraper.db.supabase_client import SupabaseManager
from scraper.utils.poster_renderer import render_pdf_pages, POSTER_PAGE_WIDTH, MAX_PAGES

BASE_URL = "https://xyz.supabase.co/storage/v1/object/public/posters/"


def make_pdf(pages: int = 1, size=(595, 842)) -> bytes:
    """PDF A4 con pagine bianche, generato con Pillow."""
    images = [Image.new("RGB", size, "white") for _ in range(pages)]
    buffer = io.BytesIO()
    images[0].save(buffer, "PDF", save_all=True, append_images=images[1:])
    return buffer.getvalue()


class TestRenderPdfPages:
    def test_renderizza_una_webp_per_pagina_alla_larghezza_fissa(self):
        pages = render_pdf_pages(make_pdf(pages=2))

        assert len(pages) == 2
        for page in pages:
            assert page.width == POSTER_PAGE_WIDTH
            assert page.height == pytest.approx(POSTER_PAGE_WIDTH * 842 / 595, abs=2)
            assert page.data[:4] == b"RIFF" and page.data[8:12] == b"WEBP"

    def test_limita_il_numero_di_pagine(self):
        assert len(render_pdf_pages(make_pdf(pages=MAX_PAGES + 2))) == MAX_PAGES

    def test_pdf_non_valido_restituisce_lista_vuota(self):
        assert render_pdf_pages(b"%PDF-1.4 fake content") == []


class TestUploadPosterPages:
    @patch.object(SupabaseManager, "upload_poster", side_effect=lambda name, data: BASE_URL + name)
    def test_carica_le_pagine_con_nome_hash_e_numero(self, mock_upload):
        pdf = make_pdf(pages=2)
        pages = BaseScraper._upload_poster_pages("fiasp", "Test Event", "01/03/2026", pdf)

        assert len(pages) == 2
        names = [call.args[0] for call in mock_upload.call_args_list]
        assert names[0].startswith("fiasp-test-event-2026-03-01-") and names[0].endswith("-p1.webp")
        assert names[1].endswith("-p2.webp")
        assert pages[0].width == POSTER_PAGE_WIDTH
        assert str(pages[0].url) == BASE_URL + names[0]

    @patch.object(SupabaseManager, "upload_poster", side_effect=lambda name, data: BASE_URL + name)
    def test_il_nome_cambia_se_cambia_il_pdf(self, mock_upload):
        BaseScraper._upload_poster_pages("csi", "Evento", "01/03/2026", make_pdf(pages=1))
        BaseScraper._upload_poster_pages("csi", "Evento", "01/03/2026", make_pdf(pages=1, size=(600, 800)))

        first, second = (call.args[0] for call in mock_upload.call_args_list)
        assert first != second

    @patch.object(SupabaseManager, "upload_poster", return_value=None)
    def test_upload_fallito_restituisce_lista_vuota(self, mock_upload):
        assert BaseScraper._upload_poster_pages("csi", "Evento", "01/03/2026", make_pdf()) == []

    def test_pdf_non_valido_non_carica_nulla(self):
        with patch.object(SupabaseManager, "upload_poster") as mock_upload:
            assert BaseScraper._upload_poster_pages("csi", "Evento", "01/03/2026", b"not a pdf") == []
            mock_upload.assert_not_called()


def mock_client(event_rows):
    client = MagicMock()
    client.table.return_value.select.return_value.execute.return_value.data = event_rows
    return client


class TestDeleteOrphanPosters:
    ROWS = [
        {"poster": None, "poster_pages": [{"url": BASE_URL + "a-p1.webp"}, {"url": BASE_URL + "a-p2.webp"}]},
        {"poster": BASE_URL + "legacy.pdf", "poster_pages": []},
        {"poster": None, "poster_pages": []},
    ]

    def test_cancella_solo_i_file_non_referenziati(self):
        stored = ["a-p1.webp", "a-p2.webp", "legacy.pdf", "vecchio.pdf", "a-old-p1.webp"]
        with patch.object(SupabaseManager, "get_client", return_value=mock_client(self.ROWS)), \
             patch.object(SupabaseManager, "_list_storage_files", return_value=stored), \
             patch.object(SupabaseManager, "delete_poster_files") as mock_delete:
            deleted = SupabaseManager.delete_orphan_posters()

        assert deleted == 2
        mock_delete.assert_called_once_with(["vecchio.pdf", "a-old-p1.webp"])

    def test_non_cancella_nulla_se_nessun_evento_referenzia_file(self):
        with patch.object(SupabaseManager, "get_client", return_value=mock_client([])), \
             patch.object(SupabaseManager, "_list_storage_files", return_value=["a-p1.webp"]), \
             patch.object(SupabaseManager, "delete_poster_files") as mock_delete:
            assert SupabaseManager.delete_orphan_posters() == 0

        mock_delete.assert_not_called()

    def test_poster_filenames_include_pdf_legacy_e_pagine(self):
        row = {"poster": BASE_URL + "legacy.pdf", "poster_pages": [{"url": BASE_URL + "x-p1.webp?"}]}
        assert SupabaseManager._poster_filenames(row) == ["x-p1.webp", "legacy.pdf"]
