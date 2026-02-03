"""
Base scraper class defining the interface for all scrapers.
"""
from abc import ABC, abstractmethod


class BaseScraper(ABC):
    """Abstract base class for event scrapers."""
    
    @abstractmethod
    def run(self) -> int:
        """
        Esegue lo scraping e salva su Supabase.
        
        Returns:
            Numero di eventi salvati
        """
        pass
    
    @property
    @abstractmethod
    def source_name(self) -> str:
        """Nome della sorgente"""
        pass