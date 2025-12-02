"""
Base scraper class defining the interface for all scrapers.
"""
from abc import ABC, abstractmethod
from typing import List
from scraper.models.event import Event


class BaseScraper(ABC):
    """Abstract base class for event scrapers."""
    
    @abstractmethod
    def fetch_events(self) -> List[Event]:
        """
        Fetch events from the source.
        
        Returns:
            List of Event objects
        """
        pass
    
    @property
    @abstractmethod
    def source_name(self) -> str:
        """
        Human-readable name of the source.
        
        Returns:
            Source name string
        """
        pass
