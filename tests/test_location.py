import unittest
from enum import Enum
from pydantic import BaseModel
try:
    from scraper import parse_location, Location, Province
except Exception as e:
    print("Failed to import from scraper:", e)
    raise

class TestParseLocation(unittest.TestCase):

    def test_valid_location_with_province(self):
        loc = parse_location("Bergamo BG")
        self.assertEqual(loc.city, "Bergamo")
        self.assertEqual(loc.province, Province.BG)

    def test_location_only_city(self):
        loc = parse_location("Milano")
        self.assertEqual(loc.city, "Milano")
        self.assertEqual(loc.province, Province.BG)  # default province

    def test_invalid_province(self):
        loc = parse_location("Como XX")
        self.assertEqual(loc.city, "Como XX")
        self.assertEqual(loc.province, Province.BG)  # default province

    def test_multiword_city(self):
        loc = parse_location("Carvico [Tensostruttura - Area Festa Patronale] (BG)")
        self.assertEqual(loc.city, "Carvico [Tensostruttura - Area Festa Patronale]")
        self.assertEqual(loc.province, Province.BG)

    def test_lowercase_province(self):
        loc = parse_location("Varese va")
        self.assertEqual(loc.city, "Varese")
        self.assertEqual(loc.province, Province.VA)

    def test_extra_spaces(self):
        loc = parse_location("  Lecco   LC  ")
        self.assertEqual(loc.city, "Lecco")
        self.assertEqual(loc.province, Province.LC)

    def test_empty_string(self):
        loc = parse_location("")
        self.assertEqual(loc.city, "")
        self.assertEqual(loc.province, Province.BG)  # default province


if __name__ == "__main__":
    unittest.main()
