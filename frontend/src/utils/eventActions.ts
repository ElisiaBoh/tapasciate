import { eventDescription, eventUrl } from './eventSeo'
import { slugify } from './slugify'
import type { Event } from '../types'

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Evento di un giorno intero in formato iCalendar (RFC 5545), da aggiungere al calendario
export function eventIcs(event: Event, now: Date = new Date()): string {
  const [y, m, d] = event.date.split('-').map(Number)
  const nextDay = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  const { city, province } = event.location
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tapasciate.it//IT',
    'BEGIN:VEVENT',
    `UID:evento-${event.id}@tapasciate.it`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}`,
    `DTEND;VALUE=DATE:${nextDay.replace(/-/g, '')}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(`${city} (${province})`)}`,
    `URL:${eventUrl(event)}`,
    `DESCRIPTION:${escapeIcs(eventDescription(event))}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function eventIcsHref(event: Event): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(eventIcs(event))}`
}

export function eventIcsFilename(event: Event): string {
  return `${slugify(event.title) || 'tapasciata'}.ics`
}

export function eventMapsUrl(event: Event): string {
  const { city, province_name, province } = event.location
  const query = `${city}, ${province_name ?? province}, Italia`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

// Condivisione nativa (telefono) o, se non disponibile, link copiato negli appunti.
// Restituisce 'copied' quando ha copiato il link, così la UI può confermarlo.
export async function shareEvent(event: Event): Promise<'shared' | 'copied' | 'failed'> {
  const url = eventUrl(event)
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: event.title, text: eventDescription(event), url })
      return 'shared'
    } catch {
      // Condivisione annullata dall'utente
      return 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
