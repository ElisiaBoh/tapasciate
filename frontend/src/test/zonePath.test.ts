import { parseRoute, resolveZone, zonePath } from '../utils/zonePath'
import type { RegionEntry } from '../types'

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
