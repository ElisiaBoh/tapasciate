-- Identificazione stabile degli eventi tramite l'ID della fonte (FIASP idMan, id articolo CSI)
-- e rimozione "soft" degli eventi che spariscono dalla fonte.
-- Da eseguire PRIMA del deploy dello scraper che usa queste colonne.

alter table public.events
  add column if not exists source text,          -- 'FIASP' | 'CSI'
  add column if not exists source_id text,       -- ID dell'evento sulla fonte
  add column if not exists last_seen_at timestamptz not null default now(),  -- ultimo run in cui la fonte lo elencava
  add column if not exists removed_at timestamptz;  -- valorizzato se l'evento non è più sulla fonte (nascosto nel frontend)

-- Le righe esistenti non hanno source_id: lo scraper le riabbina per nome + data al primo run,
-- quelle non riabbinate vengono marcate come rimosse.
update public.events
  set source = case organizer when 'FIASP Italia' then 'FIASP' when 'CSI Bergamo' then 'CSI' end,
      last_seen_at = coalesce(updated_at, created_at)
  where source is null;

-- Le righe con source_id null (pre-migrazione) non entrano in conflitto tra loro
alter table public.events
  add constraint events_source_source_id_key unique (source, source_id);
