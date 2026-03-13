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
    .order('date', { ascending: true })

  if (error) throw error

  return data.map(event => ({
    title: event.name,
    date: event.date,
    location: {
      city: event.location.city,
      province: event.location.province,
      province_name: event.location.province_name,
      region: event.location.region,
    },
    poster: event.poster ?? null,
    source: event.organizer ?? null,
    distances: event.distances ?? [],
  }))
}
