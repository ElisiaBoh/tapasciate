# Scraper tests

Pytest suite for the scraper. Tests cover parsing and the save/removal logic: HTTP requests and Supabase are always mocked, so no network or database is needed.

## Running

From the repository root, with the virtualenv active:

```bash
pytest tests/
pytest tests/test_parsers.py                   # one file
pytest tests/test_parsers.py -k gor             # tests matching a name
```

## Files

| File | Covers |
|------|--------|
| `test_parsers.py` | `extract_province_str`, `parse_location`, `parse_distances` |
| `test_csi_scraper.py` | CSI Bergamo: article id, date parsing, poster download |
| `test_fiasp_scraper.py` | FIASP: table parsing, `idMan`, poster download (Google Drive included) |
| `test_event_identity.py` | `(source, source_id)` identity and removal of events no longer listed |
| `test_posters.py` | PDF → WebP rendering, upload naming, orphan poster cleanup |
| `capture_html.py` | Not a test: saves the current HTML of the sources to `fixtures/` for debugging parsing |
