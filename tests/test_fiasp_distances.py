import unittest
from scraper import parse_distances

class TestParseDistances(unittest.TestCase):
    def test_various_formats(self):
        self.assertEqual(parse_distances("10-21-42"), ["10", "21", "42"])
        self.assertEqual(parse_distances("5 ripetibili"), ["5 ripetibili"])
        self.assertEqual(parse_distances("0,250-15-5"), ["0.250", "15", "5"])
        self.assertEqual(parse_distances("6 - 8"), ["6", "8"])
        self.assertEqual(parse_distances("5 e 10"), ["", "10"])
        self.assertEqual(parse_distances("  "), [])
        self.assertEqual(parse_distances(None), [])
        self.assertEqual(parse_distances("5  10"), ["5", "10"])

if __name__ == "__main__":
    unittest.main()
