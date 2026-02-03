import { supabase } from '../supabaseClient'

/**
 * Recupera tutti gli eventi con le loro location
 * Ritorna gli eventi nel formato compatibile con il frontend esistente
 */
export async function fetchEvents() {
  try {
    // Query con JOIN per ottenere anche i dati della location
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        location:locations (
          city,
          province,
          region
        )
      `)
      .order('date', { ascending: true })

    if (error) throw error

    // Trasforma i dati nel formato che si aspetta il frontend
    return data.map(event => ({
      title: event.name,
      date: formatDateToFrontend(event.date), // Converte da YYYY-MM-DD a DD/MM/YYYY
      location: {
        city: event.location.city,
        province: event.location.province,
        region: event.location.region
      },
      poster: event.poster,
      source: event.organizer,
      distances: event.distances || []
    }))
  } catch (error) {
    console.error('Errore nel recuperare gli eventi:', error)
    throw error
  }
}

/**
 * Converte la data da formato database (YYYY-MM-DD) a formato frontend (DD/MM/YYYY)
 */
function formatDateToFrontend(dateString) {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}