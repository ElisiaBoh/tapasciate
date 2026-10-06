import { slugify } from './slugify'
import { parseEventId } from './eventPath'
import { ITALY } from './zones'
import type { RegionEntry, Zone } from '../types'

export function zonePath(zone: Zone): string {
  switch (zone.kind) {
    case 'italy': return '/'
    case 'region': return `/${slugify(zone.region)}`
    case 'province': return `/${slugify(zone.region)}/${slugify(zone.provinceName)}`
  }
}

export type Route =
  | { kind: 'event'; id: number }
  // slugs: [] per l'Italia, [regione] o [regione, provincia]
  | { kind: 'zone'; slugs: string[] }
  | { kind: 'notFound' }

export function parseRoute(pathname: string): Route {
  const id = parseEventId(pathname)
  if (id !== null) return { kind: 'event', id }
  const slugs = pathname.split('/').filter(Boolean)
  if (slugs.length <= 2 && slugs.every(s => /^[a-z0-9-]+$/.test(s))) return { kind: 'zone', slugs }
  return { kind: 'notFound' }
}

// Zona corrispondente agli slug dell'URL, o null se non esiste tra quelle con eventi
export function resolveZone(catalog: RegionEntry[], slugs: string[]): Zone | null {
  if (slugs.length === 0) return ITALY
  const region = catalog.find(r => slugify(r.name) === slugs[0])
  if (!region) return null
  if (slugs.length === 1) return { kind: 'region', region: region.name }
  const province = region.provinces.find(p => slugify(p.name) === slugs[1])
  if (!province) return null
  return { kind: 'province', region: region.name, province: province.code, provinceName: province.name }
}
