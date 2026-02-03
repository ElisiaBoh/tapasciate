import os
from supabase import create_client, Client
from typing import Optional, List
from datetime import datetime, date


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
    ):
        """Inserisce o aggiorna un evento (UPSERT basato su name + date)"""
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
        else:
            # INSERT
            client.table("events").insert(event_data).execute()
    
    @classmethod
    def delete_past_events(cls):
        """Cancella eventi con data passata"""
        client = cls.get_client()
        today = date.today().isoformat()
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