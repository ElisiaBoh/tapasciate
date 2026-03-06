"""
Parsing utilities for event data.
"""
import re
from typing import List
from scraper.models.event import Location
from scraper.models.provinces import Province
from scraper.utils.region_mapper import get_region_from_province


def extract_province_str(text: str) -> tuple[str, str | None]:
    """
    Estrae città e sigla provincia grezza da una stringa di location.

    Supporta i formati:
    - "Città (XX)"  — parentesi esplicite in coda (priorità)
    - "Città XX"    — fallback posizionale, ultimo token

    Args:
        text: Stringa grezza, es. "Spinone al Lago (BG)" o "Varese VA"

    Returns:
        Tupla (city, province_str) dove province_str è in uppercase
        o None se non è stato trovato nessun candidato.
    """
    raw = text.strip()

    m = re.search(r'\(([A-Za-z]{2,3})\)\s*$', raw)
    if m:
        return raw[:m.start()].strip(), m.group(1).upper()

    parts = raw.split()
    if len(parts) >= 2:
        return " ".join(parts[:-1]), parts[-1].strip("()").upper()

    return raw, None


def parse_location(location_raw: str, default_province: Province = Province.BG) -> Location:
    """
    Parse a location string into a Location object.

    Args:
        location_raw: Raw location string, e.g. "Spinone al Lago (BG)"
        default_province: Default province if not found in string

    Returns:
        Location object with city, province and region
    """
    raw = location_raw.strip()
    city, province_str = extract_province_str(raw)

    if province_str:
        try:
            province = Province(province_str)
            region = get_region_from_province(province)
            return Location(city=city, province=province, region=region)
        except ValueError:
            print(f"⚠️ Unknown province '{province_str}', defaulting to {default_province.value}")

    region = get_region_from_province(default_province)
    return Location(city=raw, province=default_province, region=region)


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