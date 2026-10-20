import { parseRoute, resolvePageZone, resolveZone, zonePath } from '../utils/zonePath'
import type { Event, RegionEntry } from '../types'

const catalog: RegionEntry[] = [
  {
    name: 'Lombardia',
    count: 3,
    provinces: [
      { code: 'BG', name: 'Bergamo', count: 2 },
      { code: 'MB', name: 'Monza e della Brianza', count: 1 },
    ],
  },
  { name: 'Friuli-Venezia Giulia', count: 1, provinces: [{ code: 'GO', name: 'Gorizia', count: 1 }] },
  { name: "Valle d'Aosta", count: 1, provinces: [{ code: 'AO', name: 'Aosta', count: 1 }] },
]

describe('zonePath', () => {
  it('costruisce gli URL delle zone', () => {
    expect(zonePath({ kind: 'italy' })).toBe('/')
    expect(zonePath({ kind: 'region', region: 'Friuli-Venezia Giulia' })).toBe('/friuli-venezia-giulia')
    expect(zonePath({ kind: 'region', region: "Valle d'Aosta" })).toBe('/valle-d-aosta')
    expect(zonePath({ kind: 'province', region: 'Lombardia', province: 'MB', provinceName: 'Monza e della Brianza' }))
      .toBe('/lombardia/monza-e-della-brianza')
  })
})

describe('parseRoute', () => {
  it('riconosce home, regione e provincia', () => {
    expect(parseRoute('/')).toEqual({ kind: 'zone', slugs: [] })
    expect(parseRoute('/lombardia')).toEqual({ kind: 'zone', slugs: ['lombardia'] })
    expect(parseRoute('/lombardia/bergamo/')).toEqual({ kind: 'zone', slugs: ['lombardia', 'bergamo'] })
  })

  it('riconosce le pagine evento', () => {
    expect(parseRoute('/evento/12-straroncola')).toEqual({ kind: 'event', id: 12 })
  })

  it('scarta i percorsi che non sono zone', () => {
    expect(parseRoute('/a/b/c')).toEqual({ kind: 'notFound' })
    expect(parseRoute('/Lombardia')).toEqual({ kind: 'notFound' })
    expect(parseRoute('/info.html')).toEqual({ kind: 'notFound' })
  })
})

describe('resolveZone', () => {
  it('risolve Italia, regione e provincia', () => {
    expect(resolveZone(catalog, [])).toEqual({ kind: 'italy' })
    expect(resolveZone(catalog, ['friuli-venezia-giulia'])).toEqual({ kind: 'region', region: 'Friuli-Venezia Giulia' })
    expect(resolveZone(catalog, ['lombardia', 'monza-e-della-brianza'])).toEqual({
      kind: 'province', region: 'Lombardia', province: 'MB', provinceName: 'Monza e della Brianza',
    })
  })

  it('restituisce null per zone sconosciute o provincia nella regione sbagliata', () => {
    expect(resolveZone(catalog, ['sardegna'])).toBeNull()
    expect(resolveZone(catalog, ['lombardia', 'gorizia'])).toBeNull()
  })

  it('zonePath e resolveZone sono inversi', () => {
    for (const region of catalog) {
      const zone = { kind: 'region' as const, region: region.name }
      expect(resolveZone(catalog, (parseRoute(zonePath(zone)) as { slugs: string[] }).slugs)).toEqual(zone)
    }
  })
})

describe('resolvePageZone', () => {
  const event: Event = {
    id: 1,
    title: 'Evento',
    date: '2030-06-15',
    location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
    posterPages: [],
    source: null,
    distances: [],
  }
  const base = { status: 'success' as const, catalog, event: undefined, fromListPath: undefined }

  it('l\'Italia è nota anche durante il caricamento', () => {
    expect(resolvePageZone({ ...base, status: 'loading', route: parseRoute('/') })).toEqual({ state: 'found', zone: { kind: 'italy' } })
  })

  it('una zona dall\'URL si risolve solo a dati caricati', () => {
    expect(resolvePageZone({ ...base, status: 'loading', route: parseRoute('/lombardia') })).toEqual({ state: 'loading' })
    expect(resolvePageZone({ ...base, route: parseRoute('/lombardia') })).toEqual({ state: 'found', zone: { kind: 'region', region: 'Lombardia' } })
    expect(resolvePageZone({ ...base, route: parseRoute('/sardegna') })).toEqual({ state: 'notFound' })
    expect(resolvePageZone({ ...base, route: parseRoute('/a/b/c') })).toEqual({ state: 'notFound' })
  })

  it('il dettaglio usa la lista di provenienza se contiene l\'evento', () => {
    const route = parseRoute('/evento/1-evento')
    expect(resolvePageZone({ ...base, route, event, fromListPath: '/lombardia' }))
      .toEqual({ state: 'found', zone: { kind: 'region', region: 'Lombardia' } })
  })

  it('altrimenti la provincia dell\'evento', () => {
    const route = parseRoute('/evento/1-evento')
    const bergamo = { kind: 'province', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' }
    expect(resolvePageZone({ ...base, route, event })).toEqual({ state: 'found', zone: bergamo })
    expect(resolvePageZone({ ...base, route, event, fromListPath: '/friuli-venezia-giulia' })).toEqual({ state: 'found', zone: bergamo })
  })
})
