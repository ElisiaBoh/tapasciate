import { slugify } from './slugify'
import { parseEventId } from './eventPath'
import { ITALY, inZone, provinceZoneOf } from './zones'
import type { Event, RegionEntry, Status, Zone } from '../types'

export function zonePath(zone: Zone): string {
  switch (zone.kind) {
    case 'italy': return '/'
    case 'region': return `/${slugify(zone.region)}`
    case 'province': return `/${slugify(zone.region)}/${slugify(zone.provinceName)}`
  }
}

export type Route =
  | { kind: 'event'; id: number }
  | { kind: 'zone'; slugs: string[] }
  | { kind: 'notFound' }

export function parseRoute(pathname: string): Route {
  const id = parseEventId(pathname)
  if (id !== null) return { kind: 'event', id }
  const slugs = pathname.split('/').filter(Boolean)
  if (slugs.length <= 2 && slugs.every(s => /^[a-z0-9-]+$/.test(s))) return { kind: 'zone', slugs }
  return { kind: 'notFound' }
}

export function resolveZone(catalog: RegionEntry[], slugs: string[]): Zone | null {
  if (slugs.length === 0) return ITALY
  const region = catalog.find(r => slugify(r.name) === slugs[0])
  if (!region) return null
  if (slugs.length === 1) return { kind: 'region', region: region.name }
  const province = region.provinces.find(p => slugify(p.name) === slugs[1])
  if (!province) return null
  return { kind: 'province', region: region.name, province: province.code, provinceName: province.name }
}

export type PageZone =
  | { state: 'loading' }
  | { state: 'notFound' }
  | { state: 'found'; zone: Zone }

interface PageZoneInput {
  route: Route
  status: Status
  catalog: RegionEntry[]
  event: Event | undefined
  fromListPath: string | undefined
}

function fromSlugs(catalog: RegionEntry[], slugs: string[]): PageZone {
  const zone = resolveZone(catalog, slugs)
  return zone ? { state: 'found', zone } : { state: 'notFound' }
}

function eventPageZone(catalog: RegionEntry[], event: Event, fromListPath: string | undefined): Zone {
  const fromRoute = fromListPath ? parseRoute(fromListPath) : null
  const fromZone = fromRoute?.kind === 'zone' ? resolveZone(catalog, fromRoute.slugs) : null
  return fromZone && inZone(event, fromZone) ? fromZone : provinceZoneOf(event)
}

export function resolvePageZone({ route, status, catalog, event, fromListPath }: PageZoneInput): PageZone {
  if (route.kind === 'notFound') return { state: 'notFound' }
  if (route.kind === 'zone' && route.slugs.length === 0) return { state: 'found', zone: ITALY }
  if (status !== 'success') return { state: 'loading' }
  if (route.kind === 'zone') return fromSlugs(catalog, route.slugs)
  return event ? { state: 'found', zone: eventPageZone(catalog, event, fromListPath) } : { state: 'notFound' }
}
