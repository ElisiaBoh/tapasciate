"""
Converte le pagine di un PDF in immagini WebP da mostrare nel sito.

Il frontend non mostra i PDF (non visualizzabili dentro la pagina su Chrome
Android e nelle webview): ogni pagina diventa un'immagine, leggibile ovunque.
"""
from __future__ import annotations
import io
from dataclasses import dataclass
from typing import List

import pypdfium2 as pdfium

POSTER_PAGE_WIDTH = 1200  # px: testo leggibile anche nei dettagli piccoli, ~200-500 KB a pagina
WEBP_QUALITY = 80
MAX_PAGES = 6  # le locandine hanno 1-5 pagine; oltre è quasi certamente un documento non pertinente


@dataclass
class RenderedPage:
    data: bytes
    width: int
    height: int


def render_pdf_pages(pdf_bytes: bytes) -> List[RenderedPage]:
    """
    Renderizza le pagine del PDF come WebP larghe POSTER_PAGE_WIDTH px.

    Returns:
        Lista di pagine renderizzate, vuota in caso di errore.
    """
    try:
        pdf = pdfium.PdfDocument(pdf_bytes)
    except Exception as e:
        print(f"⚠️ Failed to open poster PDF: {e}")
        return []

    pages: List[RenderedPage] = []
    try:
        for index in range(min(len(pdf), MAX_PAGES)):
            page = pdf[index]
            scale = POSTER_PAGE_WIDTH / page.get_width()
            image = page.render(scale=scale).to_pil().convert("RGB")
            buffer = io.BytesIO()
            image.save(buffer, "WEBP", quality=WEBP_QUALITY)
            pages.append(RenderedPage(data=buffer.getvalue(), width=image.width, height=image.height))
    except Exception as e:
        print(f"⚠️ Failed to render poster PDF: {e}")
        return []
    finally:
        pdf.close()

    return pages
