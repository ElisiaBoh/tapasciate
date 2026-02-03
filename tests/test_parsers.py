"""
Tests for parsing utilities.
"""
import pytest
from scraper.utils.parsers import parse_location, parse_distances
from scraper.models.provinces import Province


class TestParseLocation:
    """Tests for parse_location function."""
    
    def test_location_with_province_in_parentheses(self):
        """Test parsing location with province in parentheses."""
        loc = parse_location("Spinone al Lago (BG)")
        assert loc.city == "Spinone al Lago"
        assert loc.province == Province.BG
        assert loc.region == "Lombardia"
    
    def test_location_without_province(self):
        """Test parsing location without province (uses default)."""
        loc = parse_location("Bergamo")
        assert loc.city == "Bergamo"
        assert loc.province == Province.BG
        assert loc.region == "Lombardia"
    
    def test_multiword_city(self):
        """Test parsing location with brackets and special chars."""
        loc = parse_location("Carvico [Tensostruttura] (BG)")
        assert loc.city == "Carvico [Tensostruttura]"
        assert loc.province == Province.BG
    
    def test_lowercase_province(self):
        """Test lowercase province code normalization."""
        loc = parse_location("Varese va")
        assert loc.city == "Varese"
        assert loc.province == Province.VA
    
    def test_extra_spaces(self):
        """Test extra whitespace handling."""
        loc = parse_location("  Lecco   LC  ")
        assert loc.city == "Lecco"
        assert loc.province == Province.LC
    
    def test_invalid_province_uses_default(self):
        """Test invalid province falls back to default."""
        loc = parse_location("Como XX")
        assert "Como" in loc.city
        assert loc.province == Province.BG  # default
    
    @pytest.mark.parametrize("location_str,expected_city,expected_province,expected_region", [
        ("Milano (MI)", "Milano", Province.MI, "Lombardia"),
        ("Roma (RM)", "Roma", Province.RM, "Lazio"),
        ("Torino (TO)", "Torino", Province.TO, "Piemonte"),
        ("Napoli (NA)", "Napoli", Province.NA, "Campania"),
        ("Palermo (PA)", "Palermo", Province.PA, "Sicilia"),
        ("Venezia (VE)", "Venezia", Province.VE, "Veneto"),
    ])
    def test_different_provinces_and_regions(self, location_str, expected_city, expected_province, expected_region):
        """Test parsing locations with different provinces and regions."""
        loc = parse_location(location_str)
        assert loc.city == expected_city
        assert loc.province == expected_province
        assert loc.region == expected_region


class TestParseDistances:
    """Tests for parse_distances function."""
    
    def test_single_distance(self):
        """Test parsing a single distance."""
        distances = parse_distances("10 km")
        assert distances == ["10 km"]
    
    def test_multiple_distances_with_dash(self):
        """Test parsing multiple distances separated by dash."""
        distances = parse_distances("5 - 10 - 15")
        assert len(distances) == 3
        assert "5" in distances
        assert "10" in distances
        assert "15" in distances
    
    def test_distances_with_italian_conjunction(self):
        """Test parsing distances with Italian 'e' (and)."""
        distances = parse_distances("5 e 10 km")
        # Should replace 'e' with dash and split
        assert len(distances) >= 1
    
    def test_distances_with_comma_decimal(self):
        """Test parsing distances with comma decimal separator."""
        distances = parse_distances("5,5 - 10,5 km")
        # Commas should be converted to dots
        assert any("5.5" in d for d in distances)
    
    def test_empty_string_input(self):
        """Test parsing empty string."""
        distances = parse_distances("")
        assert distances == []
    
    def test_none_input(self):
        """Test parsing None input."""
        distances = parse_distances(None)
        assert distances == []
    
    def test_distances_with_multiple_spaces(self):
        """Test parsing distances with irregular spacing."""
        distances = parse_distances("5    10    15")
        assert len(distances) >= 2
    
    def test_distances_with_text(self):
        """Test parsing distances with descriptive text."""
        distances = parse_distances("5 km ripetibili")
        assert len(distances) == 1
        assert "ripetibili" in distances[0]
    
    @pytest.mark.parametrize("input_str,min_expected_count", [
        ("10", 1),
        ("5-10", 2),
        ("5-10-15", 3),
        ("", 0),
        (None, 0),
    ])
    def test_distance_count(self, input_str, min_expected_count):
        """Test that correct number of distances are parsed."""
        distances = parse_distances(input_str)
        assert len(distances) >= min_expected_count
