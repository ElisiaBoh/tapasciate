"""
Scraper implementations.
"""
from scraper.scrapers.base import BaseScraper
from scraper.scrapers.csi_scraper import CSIScraper
from scraper.scrapers.fiasp_scraper import FIASPScraper

__all__ = ["BaseScraper", "CSIScraper", "FIASPScraper"]
