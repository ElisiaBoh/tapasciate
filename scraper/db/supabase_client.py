import os
from supabase import create_client, Client
from typing import Optional, List, Iterable
from datetime import datetime, date
from scraper.models.operation import Operation
from scraper.config import SUPABASE_STORAGE_BUCKET


class SupabaseManager:
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        if cls._instance is None:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            
            if not url or not key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
            
            cls._instance = create_client(url, key)
        
        return cls._instance

    @classmethod
    def upsert_location(cls, city: str, province: str, province_name: str, region: str) -> int:
        """Inserisce o recupera una location, ritorna l'ID"""
        client = cls.get_client()

        # Normalizza
        city = city.strip().title()
        province = province.strip().upper()
        province_name = province_name.strip()
        region = region.strip().title()

        # Cerca esistente
        result = client.table("locations").select("id, province_name, region").eq("city", city).eq("province", province).execute()

        if result.data:
            location_id = result.data[0]["id"]
            updates = {}
            if result.data[0]["region"] != region:
                updates["region"] = region
            if result.data[0]["province_name"] != province_name:
                updates["province_name"] = province_name
            if updates:
                client.table("locations").update(updates).eq("id", location_id).execute()
            return location_id

        # Inserisci nuovo
        result = client.table("locations").insert({
            "city": city,
            "province": province,
            "province_name": province_name,
            "region": region
        }).execute()

        return result.data[0]["id"]
    
    @classmethod
    def upsert_event(
        cls,
        source: str,
        source_id: str,
        name: str,
        date: str,
        location_id: int,
        organizer: str,
        url: Optional[str] = None,
        poster_pages: Optional[List[dict]] = None,
        distances: Optional[List[str]] = None
    ) -> Operation:
        """
        Inserisce o aggiorna un evento identificandolo con (source, source_id):
        se sulla fonte cambiano nome o data si aggiorna la stessa riga, con lo stesso id.

        Returns:
            Operation.INSERTED se nuovo evento, Operation.UPDATED se aggiornato
        """
        client = cls.get_client()

        # Converti data da DD/MM/YYYY a YYYY-MM-DD
        parsed_date = cls._parse_date(date)

        event_data = {
            "source": source,
            "source_id": source_id,
            "name": name,
            "date": parsed_date,
            "location_id": location_id,
            "organizer": organizer,
            "url": url,
            "poster_pages": poster_pages or [],
            "distances": distances or [],
            # Un evento rimosso che ricompare sulla fonte torna visibile
            "removed_at": None
        }

        event_id = cls._find_event_id(source, source_id, name, parsed_date)

        if event_id is not None:
            event_data["updated_at"] = datetime.now().isoformat()
            client.table("events").update(event_data).eq("id", event_id).execute()
            return Operation.UPDATED

        client.table("events").insert(event_data).execute()
        return Operation.INSERTED

    @classmethod
    def _find_event_id(cls, source: str, source_id: str, name: str, parsed_date: str) -> Optional[int]:
        """Cerca l'evento per ID della fonte, poi tra le righe create prima degli ID (per nome + data)."""
        client = cls.get_client()

        result = client.table("events").select("id").eq("source", source).eq("source_id", source_id).execute()
        if result.data:
            return result.data[0]["id"]

        # Righe pre-migrazione senza source_id: riusarle mantiene id e link di dettaglio
        result = (
            client.table("events").select("id")
            .eq("source", source).is_("source_id", "null")
            .eq("name", name).eq("date", parsed_date)
            .limit(1).execute()
        )
        return result.data[0]["id"] if result.data else None

    @classmethod
    def count_active_events(cls, source: str) -> int:
        """Numero di eventi di una fonte non marcati come rimossi."""
        client = cls.get_client()
        result = (
            client.table("events").select("id", count="exact")
            .eq("source", source).is_("removed_at", "null")
            .execute()
        )
        return result.count or 0

    @classmethod
    def mark_events_seen(cls, source: str, source_ids: Iterable[str], seen_at: str):
        """Segna come presenti sulla fonte gli eventi elencati (e ripristina quelli rimossi che ricompaiono)."""
        client = cls.get_client()
        source_ids = list(source_ids)

        for start in range(0, len(source_ids), 100):
            batch = source_ids[start:start + 100]
            (
                client.table("events")
                .update({"last_seen_at": seen_at, "removed_at": None})
                .eq("source", source).in_("source_id", batch)
                .execute()
            )

    @classmethod
    def remove_unseen_events(cls, source: str, seen_at: str) -> int:
        """
        Marca come rimossi gli eventi di una fonte non visti nel run corrente
        (last_seen_at precedente a seen_at). Non cancella le righe: il frontend le nasconde.

        Returns:
            Numero di eventi marcati come rimossi.
        """
        client = cls.get_client()
        result = (
            client.table("events")
            .update({"removed_at": seen_at})
            .eq("source", source).is_("removed_at", "null").lt("last_seen_at", seen_at)
            .execute()
        )
        return len(result.data)

    @classmethod
    def upload_poster(cls, filename: str, file_bytes: bytes, content_type: str = "image/webp") -> Optional[str]:
        """
        Carica un file del poster su Supabase Storage e ritorna l'URL pubblico.
        Se un file con lo stesso nome esiste già, lo sovrascrive.

        Args:
            filename: nome del file (es. "csi-bottanuco-2026-03-15-1a2b3c4d-p1.webp")
            file_bytes: contenuto del file in memoria
            content_type: MIME type del file

        Returns:
            URL pubblico del file, o None in caso di errore
        """
        client = cls.get_client()

        try:
            # upsert=True sovrascrive se il file esiste già
            client.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
                path=filename,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )

            url = client.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(filename)
            return url.rstrip("?")
        except Exception as e:
            print(f"❌ Failed to upload poster {filename}: {e}")
            return None

    @classmethod
    def _storage_filename(cls, public_url: str) -> str:
        """Estrae il nome del file dall'URL pubblico di Storage."""
        return public_url.split(f"/{SUPABASE_STORAGE_BUCKET}/")[-1].split("?")[0]

    @classmethod
    def _poster_filenames(cls, row: dict) -> List[str]:
        """Nomi dei file su Storage referenziati da una riga di events (pagine del poster)."""
        return [cls._storage_filename(page["url"]) for page in row.get("poster_pages") or [] if page.get("url")]

    @classmethod
    def delete_poster_files(cls, filenames: Iterable[str]):
        """Cancella file da Supabase Storage, a blocchi."""
        client = cls.get_client()
        filenames = list(filenames)

        for start in range(0, len(filenames), 100):
            batch = filenames[start:start + 100]
            try:
                client.storage.from_(SUPABASE_STORAGE_BUCKET).remove(batch)
            except Exception as e:
                print(f"⚠️ Failed to delete posters {batch}: {e}")

    @classmethod
    def delete_past_events(cls):
        """Cancella eventi con data passata, inclusi i poster su Storage"""
        client = cls.get_client()
        today = date.today().isoformat()

        # Prima recupera i poster degli eventi da cancellare
        result = client.table("events").select("poster_pages").lt("date", today).execute()

        # Cancella i file da Storage
        filenames = [name for row in result.data for name in cls._poster_filenames(row)]
        cls.delete_poster_files(filenames)

        # Poi cancella i record dal DB
        client.table("events").delete().lt("date", today).execute()

    @classmethod
    def _list_storage_files(cls) -> List[str]:
        """Elenca tutti i file del bucket dei poster."""
        client = cls.get_client()
        bucket = client.storage.from_(SUPABASE_STORAGE_BUCKET)
        names: List[str] = []
        offset = 0

        while True:
            batch = bucket.list("", {"limit": 1000, "offset": offset})
            names.extend(item["name"] for item in batch if item.get("id"))  # le cartelle non hanno id
            if len(batch) < 1000:
                return names
            offset += 1000

    @classmethod
    def delete_orphan_posters(cls) -> int:
        """
        Cancella da Storage i file che nessun evento referenzia più:
        pagine di locandine aggiornate, residui di upload falliti.

        Returns:
            Numero di file cancellati.
        """
        client = cls.get_client()
        # Se la query fallisce solleva un'eccezione: meglio non cancellare nulla che cancellare tutto
        result = client.table("events").select("poster_pages").execute()
        referenced = {name for row in result.data for name in cls._poster_filenames(row)}

        stored = cls._list_storage_files()
        if not referenced and stored:
            print("⚠️ No poster referenced by any event: skipping orphan cleanup as a precaution")
            return 0

        orphans = [name for name in stored if name not in referenced]
        cls.delete_poster_files(orphans)
        return len(orphans)

    @classmethod
    def _parse_date(cls, date_str: str) -> str:
        """Converte DD/MM/YYYY in YYYY-MM-DD"""
        try:
            dt = datetime.strptime(date_str, "%d/%m/%Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            # Se già in formato corretto o altro formato, ritorna così
            return date_str
