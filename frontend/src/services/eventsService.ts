import { supabase } from '../supabaseClient'
import type { Event } from '../types'

export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      location:locations (
        city,
        province,
        province_name,
        region
      )
    `)
    // Events no longer listed by their source stay in the database but are hidden
    .is('removed_at', null)
    .order('date', { ascending: true })

  if (error) throw error

  return data.map(event => ({
    id: event.id,
    title: event.name,
    date: event.date,
    location: {
      city: event.location.city,
      province: event.location.province,
      province_name: event.location.province_name,
      region: event.location.region,
    },
    posterPages: event.poster_pages ?? [],
    organizer: event.organizer ?? null,
    distances: event.distances ?? [],
  }))
}
