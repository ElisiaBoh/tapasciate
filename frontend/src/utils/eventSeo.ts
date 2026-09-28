import { eventPath } from './eventPath'
import type { Event } from '../types'

export const SITE_URL = 'https://tapasciate.it'

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
              'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

export function eventUrl(event: Event): string {
  return SITE_URL + eventPath(event)
}

export function eventDescription(event: Event): string {
  const [year, month, day] = event.date.split('-').map(Number)
  const { city, province } = event.location
  const distances = event.distances.length > 0 ? ` Percorsi: ${event.distances.join(' - ')} km.` : ''
  return `${event.title}: tapasciata non competitiva a ${city} (${province}) il ${day} ${MESI[month - 1]} ${year}.${distances}`
}

// Dati strutturati schema.org/Event: permettono a Google di mostrare l'evento nei risultati arricchiti
export function eventJsonLd(event: Event): Record<string, unknown> {
  const { city, province, province_name } = event.location
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: eventDescription(event),
    url: eventUrl(event),
    location: {
      '@type': 'Place',
      name: city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: province_name ?? province,
        addressCountry: 'IT',
      },
    },
    ...(event.posterPages.length > 0 ? { image: event.posterPages.map(p => p.url) } : {}),
    ...(event.source ? { organizer: { '@type': 'Organization', name: event.source } } : {}),
  }
}

// Imposta un attributo su un tag del <head> (creandolo se manca) e restituisce la funzione che lo ripristina
function setHeadTag(selector: string, create: () => HTMLElement, attr: string, value: string): () => void {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    el.setAttribute(attr, value)
    document.head.appendChild(el)
    const created = el
    return () => created.remove()
  }
  const previous = el.getAttribute(attr)
  el.setAttribute(attr, value)
  const existing = el
  return () => {
    if (previous === null) existing.removeAttribute(attr)
    else existing.setAttribute(attr, previous)
  }
}

function setMeta(key: 'name' | 'property', name: string, content: string): () => void {
  return setHeadTag(`meta[${key}="${name}"]`, () => {
    const meta = document.createElement('meta')
    meta.setAttribute(key, name)
    return meta
  }, 'content', content)
}

function setCanonical(href: string): () => void {
  return setHeadTag('link[rel="canonical"]', () => {
    const link = document.createElement('link')
    link.rel = 'canonical'
    return link
  }, 'href', href)
}

// Title, canonical, anteprime social e JSON-LD della pagina evento. Restituisce il cleanup
// che rimette i valori della home (definiti in public/index.html).
export function applyEventSeo(event: Event): () => void {
  const url = eventUrl(event)
  const title = `${event.title} — Tapasciate.it`
  const description = eventDescription(event)

  const previousTitle = document.title
  document.title = title

  const restores = [
    setCanonical(url),
    setMeta('name', 'description', description),
    setMeta('property', 'og:type', 'event'),
    setMeta('property', 'og:url', url),
    setMeta('property', 'og:title', title),
    setMeta('property', 'og:description', description),
    setMeta('name', 'twitter:title', title),
    setMeta('name', 'twitter:description', description),
  ]
  if (event.posterPages.length > 0) {
    restores.push(setMeta('property', 'og:image', event.posterPages[0].url))
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.dataset.seo = 'event'
  script.textContent = JSON.stringify(eventJsonLd(event))
  document.head.appendChild(script)

  return () => {
    document.title = previousTitle
    restores.forEach(restore => restore())
    script.remove()
  }
}

// Pagina evento inesistente (es. evento passato e cancellato): evita che Google indicizzi un "non trovato"
export function applyNoIndex(): () => void {
  return setMeta('name', 'robots', 'noindex')
}
