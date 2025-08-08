import unittest
from scraper import parse_fiasp_html, Province

class TestFiaspParsing(unittest.TestCase):
    def test_parse_fiasp_html(self):
        with open("tests/test_fiasp_events.html", encoding="utf-8") as f:
            html = f.read()

        events = parse_fiasp_html(html)
        self.assertEqual(len(events), 292)

        e1 = events[0]
        self.assertEqual(e1.title, "52° EL GIR DI CENT FOO")
        self.assertEqual(e1.date, "10/08/2025")
        self.assertEqual(e1.location.city, "Barni")
        self.assertEqual(e1.location.province, Province.CO)
        #self.assertIn("https://drive.google.com/uc?export=view&id=1gASG4EhQY66OlS0f6Jf-Za8QgQa9p7H6", e1.poster)

        e2 = events[1]
        self.assertEqual(e2.title, "7ª CAMMINATA SAN GAETANO")
        self.assertEqual(e2.location.city, "Ponti sul Mincio")
        self.assertEqual(e2.location.province, Province.MN)
        self.assertIsNotNone(e2.poster)
