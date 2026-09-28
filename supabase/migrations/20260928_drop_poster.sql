-- Rimuove la colonna del PDF legacy: le locandine sono in poster_pages (immagini WebP).
-- Da eseguire DOPO il merge e il deploy della PR che smette di leggerla/scriverla (scraper e frontend).
alter table public.events
  drop column if exists poster;
