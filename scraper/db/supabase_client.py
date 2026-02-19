import os
from supabase import create_client, Client
from typing import Optional, List
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
    def upsert_location(cls, city: str, province: str, region: str) -> int:
        """Inserisce o recupera una location, ritorna l'ID"""
        client = cls.get_client()
        
        # Normalizza
        city = city.strip().title()
        province = province.strip().upper()
        region = region.strip().title()
        
        # Cerca esistente
        result = client.table("locations").select("id").eq("city", city).eq("province", province).execute()
        
        if result.data:
            return result.data[0]["id"]
        
        # Inserisci nuovo
        result = client.table("locations").insert({
            "city": city,
            "province": province,
            "region": region
        }).execute()
        
        return result.data[0]["id"]
    
    @classmethod
    def upsert_event(
        cls, 
        name: str, 
        date: str, 
        location_id: int, 
        organizer: str, 
        url: Optional[str] = None,
        poster: Optional[str] = None,
        distances: Optional[List[str]] = None
    ) -> Operation:
        """
        Inserisce o aggiorna un evento (UPSERT basato su name + date)
        
        Returns:
            Operation.INSERTED se nuovo evento, Operation.UPDATED se aggiornato
        """
        client = cls.get_client()
        
        # Converti data da DD/MM/YYYY a YYYY-MM-DD
        parsed_date = cls._parse_date(date)
        
        # Converti HttpUrl in stringa se necessario
        poster_str = str(poster) if poster else None
        
        # Cerca evento esistente (solo name + date)
        result = client.table("events").select("id").eq("name", name).eq("date", parsed_date).execute()
        
        event_data = {
            "name": name,
            "date": parsed_date,
            "location_id": location_id,
            "organizer": organizer,
            "url": url,
            "poster": poster_str,
            "distances": distances or []
        }
        
        if result.data:
            # UPDATE
            event_id = result.data[0]["id"]
            event_data["updated_at"] = datetime.now().isoformat()
            client.table("events").update(event_data).eq("id", event_id).execute()
            return Operation.UPDATED
        else:
            # INSERT
            client.table("events").insert(event_data).execute()
            return Operation.INSERTED

    @classmethod
    def upload_poster(cls, filename: str, pdf_bytes: bytes) -> Optional[str]:
        """
        Carica un PDF su Supabase Storage e ritorna l'URL pubblico.
        Se un file con lo stesso nome esiste già, lo sovrascrive.
        
        Args:
            filename: nome del file (es. "csi-bottanuco-2026-03-15.pdf")
            pdf_bytes: contenuto del PDF in memoria
            
        Returns:
            URL pubblico del file, o None in caso di errore
        """
        client = cls.get_client()
        
        try:
            # upsert=True sovrascrive se il file esiste già
            client.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
                path=filename,
                file=pdf_bytes,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
            
            url = client.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(filename)
            return url
        except Exception as e:
            print(f"❌ Failed to upload poster {filename}: {e}")
            return None

    @classmethod
    def delete_poster(cls, poster_url: str):
        """
        Cancella un file da Supabase Storage dato il suo URL pubblico.
        
        Args:
            poster_url: URL pubblico del poster (es. https://xxx.supabase.co/storage/v1/object/public/posters/file.pdf)
        """
        client = cls.get_client()
        
        try:
            # Estrai il filename dall'URL (ultima parte del path)
            filename = poster_url.split(f"/{SUPABASE_STORAGE_BUCKET}/")[-1]
            client.storage.from_(SUPABASE_STORAGE_BUCKET).remove([filename])
        except Exception as e:
            print(f"⚠️ Failed to delete poster {poster_url}: {e}")

    @classmethod
    def delete_past_events(cls):
        """Cancella eventi con data passata, inclusi i poster su Storage"""
        client = cls.get_client()
        today = date.today().isoformat()
        
        # Prima recupera i poster URL degli eventi da cancellare
        result = client.table("events").select("poster").lt("date", today).execute()
        
        # Cancella i file da Storage
        for row in result.data:
            if row.get("poster"):
                cls.delete_poster(row["poster"])
        
        # Poi cancella i record dal DB
        client.table("events").delete().lt("date", today).execute()

    @classmethod
    def _parse_date(cls, date_str: str) -> str:
        """Converte DD/MM/YYYY in YYYY-MM-DD"""
        try:
            dt = datetime.strptime(date_str, "%d/%m/%Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            # Se già in formato corretto o altro formato, ritorna così
            return date_str
