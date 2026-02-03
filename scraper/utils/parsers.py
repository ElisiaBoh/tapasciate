"""
Parsing utilities for event data.
"""
import re
from typing import List
from scraper.models.event import Location
from scraper.models.provinces import Province
from scraper.utils.region_mapper import get_region_from_province


def parse_location(location_raw: str, default_province: Province = Province.BG) -> Location:
    """
    Parse a location string into a Location object.
    
    Args:
        location_raw: Raw location string, e.g. "Spinone al Lago (BG)"
        default_province: Default province if not found in string
        
    Returns:
        Location object with city, province and region
    """
    parts = location_raw.strip().split()
    
    if len(parts) >= 2:
        city = " ".join(parts[:-1])
        province_str = parts[-1].strip("()").upper()  # rimuove parentesi
        
        try:
            province = Province(province_str)
            region = get_region_from_province(province)
            return Location(city=city, province=province, region=region)
        except ValueError:
            print(f"⚠️ Unknown province '{province_str}', defaulting to {default_province.value}")
    
    # Fallback con provincia di default
    region = get_region_from_province(default_province)
    return Location(city=location_raw.strip(), province=default_province, region=region)


def parse_distances(raw: str) -> List[str]:
    """
    Parse a distance string from FIASP into a list of distances.
    
    Args:
        raw: Raw distance string, e.g. "5 - 10 km" or "5 e 10 km"
        
    Returns:
        List of distance strings
    """
    if not raw:
        return []
    
    raw = raw.replace(",", ".").strip()
    raw = re.sub(r"\s+e\s+", "-", raw, flags=re.IGNORECASE)
    parts = re.split(r"\s*[-–]\s*|\s{2,}", raw)
    
    results = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        results.append(part)
    
    return results