-- Pagine della locandina come immagini WebP su Storage: [{ "url": ..., "width": ..., "height": ... }]
-- Sostituiscono il PDF in events.poster, non visualizzabile in pagina su Chrome Android e nelle webview.
-- Applicata manualmente dall'SQL Editor di Supabase il 2026-09-28.
alter table public.events
  add column if not exists poster_pages jsonb not null default '[]'::jsonb;
