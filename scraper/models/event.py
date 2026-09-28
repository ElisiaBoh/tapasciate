"""
Data models for events.
"""
from typing import List, Literal
from pydantic import BaseModel, HttpUrl
from scraper.models.provinces import Province


class Location(BaseModel):
    """Represents a location with city and province."""
    city: str
    province: Province
    province_name: str
    region: str


class PosterPage(BaseModel):
    """Una pagina della locandina, salvata come immagine su Supabase Storage."""
    url: HttpUrl
    width: int
    height: int


class Event(BaseModel):
    """Represents a walking event."""
    title: str
    date: str  # format dd/mm/yyyy
    location: Location
    poster_pages: List[PosterPage] = []
    source: Literal["CSI", "FIASP"]
    source_id: str  # ID dell'evento sulla fonte: chiave stabile anche se cambiano nome o data
    url: str  # pagina dell'evento sulla fonte
    distances: List[str]