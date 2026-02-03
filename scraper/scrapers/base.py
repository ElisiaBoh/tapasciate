"""
Base scraper class defining the interface for all scrapers.
"""
from abc import ABC, abstractmethod
from typing import Tuple


class BaseScraper(ABC):
    """Abstract base class for event scrapers."""
    
    @abstractmethod
    def run(self) -> Tuple[int, int]:
        """
        Esegue lo scraping e salva su Supabase.
        
        Returns:
            Tupla (eventi_inseriti, eventi_aggiornati)
        """
        pass
    
    @property
    @abstractmethod
    def source_name(self) -> str:
        """Nome della sorgente"""
        pass
