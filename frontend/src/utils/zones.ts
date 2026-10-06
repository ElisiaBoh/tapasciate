import type { Event, RegionEntry, Zone } from '../types'

export const ITALY: Zone = { kind: 'italy' }

function provinceName(event: Event): string {
  return event.location.province_name ?? event.location.province
}

// Regioni ordinate per numero di eventi (a parità, per nome), province in ordine alfabetico
export function buildCatalog(events: Event[]): RegionEntry[] {
  const regions = new Map<string, RegionEntry>()
  for (const event of events) {
    const { region, province } = event.location
    let entry = regions.get(region)
    if (!entry) {
      entry = { name: region, count: 0, provinces: [] }
      regions.set(region, entry)
    }
    entry.count++
    const prov = entry.provinces.find(p => p.code === province)
    if (prov) prov.count++
    else entry.provinces.push({ code: province, name: provinceName(event), count: 1 })
  }
  const catalog = Array.from(regions.values())
  catalog.forEach(r => r.provinces.sort((a, b) => a.name.localeCompare(b.name)))
  return catalog.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function inZone(event: Event, zone: Zone): boolean {
  switch (zone.kind) {
    case 'italy': return true
    case 'region': return event.location.region === zone.region
    case 'province': return event.location.province === zone.province
  }
}

export function provinceZoneOf(event: Event): Zone {
  return {
    kind: 'province',
    region: event.location.region,
    province: event.location.province,
    provinceName: provinceName(event),
  }
}

export function sameZone(a: Zone, b: Zone): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'region' && b.kind === 'region') return a.region === b.region
  if (a.kind === 'province' && b.kind === 'province') return a.province === b.province
  return true
}

// "Tutta Italia" / "Lombardia" / "Bergamo"
export function zoneName(zone: Zone): string {
  switch (zone.kind) {
    case 'italy': return 'Tutta Italia'
    case 'region': return zone.region
    case 'province': return zone.provinceName
  }
}

// "in Italia" / "in Lombardia" / "in provincia di Bergamo"
export function zoneArea(zone: Zone): string {
  switch (zone.kind) {
    case 'italy': return 'in Italia'
    case 'region': return `in ${zone.region}`
    case 'province': return `in provincia di ${zone.provinceName}`
  }
}

// Titolo della pagina lista
export function zoneTitle(zone: Zone): string {
  return `Tapasciate ${zoneArea(zone)}`
}

// Complemento di luogo per le frasi: "in Italia" / "in Lombardia" / "a Bergamo"
export function zonePlace(zone: Zone): string {
  switch (zone.kind) {
    case 'italy': return 'in Italia'
    case 'region': return `in ${zone.region}`
    case 'province': return `a ${zone.provinceName}`
  }
}
