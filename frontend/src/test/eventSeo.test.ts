import { applyEventSeo, applyNoIndex, eventJsonLd } from '../utils/eventSeo'
import type { Event } from '../types'

const event: Event = {
  id: 42,
  title: 'Straroncola',
  date: '2030-10-12',
  location: { city: 'Roncola', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
  posterPages: [{ url: 'https://example.com/p1.webp', width: 1200, height: 1697 }],
  source: 'GS Roncola',
  distances: ['6', '12'],
}

const HOME_HEAD = `
  <meta name="description" content="home">
  <link rel="canonical" href="https://tapasciate.it/">
  <meta property="og:url" content="https://tapasciate.it/">
  <meta property="og:title" content="Tapasciate.it">
`

const attr = (selector: string, name: string) => document.head.querySelector(selector)?.getAttribute(name)

beforeEach(() => {
  document.head.innerHTML = HOME_HEAD
  document.title = 'Home'
})

describe('eventJsonLd', () => {
  it('descrive l\'evento con i campi schema.org', () => {
    expect(eventJsonLd(event)).toMatchObject({
      '@type': 'Event',
      name: 'Straroncola',
      startDate: '2030-10-12',
      url: 'https://tapasciate.it/evento/42-straroncola',
      location: { address: { addressLocality: 'Roncola', addressRegion: 'Bergamo', addressCountry: 'IT' } },
      image: ['https://example.com/p1.webp'],
      organizer: { name: 'GS Roncola' },
    })
  })

  it('omette organizzatore e immagine se mancano', () => {
    const ld = eventJsonLd({ ...event, source: null, posterPages: [] })
    expect(ld).not.toHaveProperty('organizer')
    expect(ld).not.toHaveProperty('image')
  })
})

describe('applyEventSeo', () => {
  it('imposta canonical, meta e JSON-LD della pagina evento', () => {
    applyEventSeo(event)
    const url = 'https://tapasciate.it/evento/42-straroncola'
    expect(document.title).toBe('Straroncola — Tapasciate.it')
    expect(attr('link[rel="canonical"]', 'href')).toBe(url)
    expect(attr('meta[property="og:url"]', 'content')).toBe(url)
    expect(attr('meta[property="og:image"]', 'content')).toBe('https://example.com/p1.webp')
    expect(attr('meta[name="description"]', 'content'))
      .toBe('Straroncola: tapasciata non competitiva a Roncola (BG) il 12 ottobre 2030. Percorsi: 6 - 12 km.')
    const script = document.head.querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(script!.textContent!)).toMatchObject({ '@type': 'Event', name: 'Straroncola' })
  })

  it('il cleanup ripristina i valori della home', () => {
    applyEventSeo(event)()
    expect(document.title).toBe('Home')
    const head = document.head.innerHTML.replace('<title>Home</title>', '')
    expect(head.replace(/\s/g, '')).toBe(HOME_HEAD.replace(/\s/g, ''))
  })
})

describe('applyNoIndex', () => {
  it('aggiunge e poi rimuove il meta robots noindex', () => {
    const restore = applyNoIndex()
    expect(attr('meta[name="robots"]', 'content')).toBe('noindex')
    restore()
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })
})
