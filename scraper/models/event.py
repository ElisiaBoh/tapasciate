"""
Data models for events.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, HttpUrl
from scraper.models.provinces import Province

class Location(BaseModel):
    """Represents a location with city and province."""
    city: str
    province: Province


class Event(BaseModel):
    """Represents a walking event."""
    title: str
    date: str  # format dd/mm/yyyy
    location: Location
    poster: Optional[HttpUrl] = None
    source: Literal["CSI", "FIASP"]
    distances: List[str]
