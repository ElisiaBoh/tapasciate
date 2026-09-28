"""
Test per l'identificazione stabile degli eventi (source + source_id)
e per la rimozione di quelli non più elencati dalla fonte.
"""
from unittest.mock import patch, MagicMock
from scraper.scrapers.base import BaseScraper
from scraper.db.supabase_client import SupabaseManager
from scraper.models.operation import Operation


class FakeScraper(BaseScraper):
    """Scraper finto: 'vede' gli ID indicati senza salvare eventi."""

    def __init__(self, seen_ids):
        super().__init__()
        self.ids = seen_ids

    source = "FIASP"
    source_name = "Fake"
    organizer = "Fake"

    def _fetch_events(self):
        for source_id in self.ids:
            self._mark_seen(source_id)
        return []


class TestRemoveUnseenEvents:
    def run(self, seen_ids, active):
        with patch.object(SupabaseManager, "count_active_events", return_value=active), \
             patch.object(SupabaseManager, "mark_events_seen") as mock_seen, \
             patch.object(SupabaseManager, "remove_unseen_events", return_value=3) as mock_remove:
            result = FakeScraper(seen_ids).run()
        return result, mock_seen, mock_remove

    def test_marca_visti_e_rimuove_gli_altri(self):
        result, mock_seen, mock_remove = self.run(["1", "2"], active=3)

        assert result == (0, 0, 3)
        source, ids, seen_at = mock_seen.call_args.args
        assert (source, ids) == ("FIASP", {"1", "2"})
        mock_remove.assert_called_once_with("FIASP", seen_at)

    def test_non_rimuove_nulla_se_la_fonte_e_vuota(self):
        result, mock_seen, mock_remove = self.run([], active=10)

        assert result == (0, 0, 0)
        mock_seen.assert_not_called()
        mock_remove.assert_not_called()

    def test_non_rimuove_nulla_se_la_fonte_sembra_incompleta(self):
        result, _, mock_remove = self.run(["1", "2"], active=10)

        assert result == (0, 0, 0)
        mock_remove.assert_not_called()

    def test_prima_esecuzione_senza_eventi_attivi(self):
        result, _, mock_remove = self.run(["1"], active=0)

        assert result == (0, 0, 3)
        mock_remove.assert_called_once()


def mock_select(*responses):
    """Client finto: ogni select().…execute() restituisce la risposta successiva."""
    client = MagicMock()
    query = client.table.return_value.select.return_value
    query.eq.return_value = query
    query.is_.return_value = query
    query.limit.return_value = query
    query.execute.side_effect = [MagicMock(data=data) for data in responses]
    return client


class TestUpsertEvent:
    ARGS = dict(source="FIASP", source_id="19171", name="19ª MARCIA", date="04/10/2026",
                location_id=1, organizer="FIASP Italia")

    def test_aggiorna_per_source_id_anche_se_cambiano_nome_e_data(self):
        client = mock_select([{"id": 7}])
        with patch.object(SupabaseManager, "get_client", return_value=client):
            assert SupabaseManager.upsert_event(**self.ARGS) == Operation.UPDATED

        client.table.return_value.update.return_value.eq.assert_called_once_with("id", 7)
        data = client.table.return_value.update.call_args.args[0]
        assert data["source_id"] == "19171" and data["date"] == "2026-10-04"

    def test_riusa_la_riga_pre_migrazione_con_stesso_nome_e_data(self):
        client = mock_select([], [{"id": 3}])
        with patch.object(SupabaseManager, "get_client", return_value=client):
            assert SupabaseManager.upsert_event(**self.ARGS) == Operation.UPDATED

        client.table.return_value.update.return_value.eq.assert_called_once_with("id", 3)

    def test_inserisce_se_non_trova_nulla(self):
        client = mock_select([], [])
        with patch.object(SupabaseManager, "get_client", return_value=client):
            assert SupabaseManager.upsert_event(**self.ARGS) == Operation.INSERTED

        inserted = client.table.return_value.insert.call_args.args[0]
        assert (inserted["source"], inserted["source_id"]) == ("FIASP", "19171")
