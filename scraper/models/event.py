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
    """A poster page, stored as an image on Supabase Storage."""
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
    source_id: str  # event id on the source: stable even when name or date change
    url: str  # event page on the source
    distances: List[str]