"""
Converts the pages of a PDF into WebP images shown on the site.

The frontend doesn't show PDFs (they can't be displayed inline on Chrome
Android and in webviews): every page becomes an image, readable everywhere.
"""
from __future__ import annotations
import io
from dataclasses import dataclass
from typing import List

import pypdfium2 as pdfium

POSTER_PAGE_WIDTH = 1200  # px: small print stays readable, ~200-500 KB per page
WEBP_QUALITY = 80
MAX_PAGES = 6  # posters have 1-5 pages; more is almost certainly an unrelated document


@dataclass
class RenderedPage:
    data: bytes
    width: int
    height: int


def render_pdf_pages(pdf_bytes: bytes) -> List[RenderedPage]:
    """
    Render the PDF pages as WebP images POSTER_PAGE_WIDTH px wide.

    Returns:
        Rendered pages, empty on error.
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
