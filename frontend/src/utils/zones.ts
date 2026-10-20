import { periodPhrase } from './period'
import type { Event, Period, RegionEntry, Zone } from '../types'

export const ITALY: Zone = { kind: 'italy' }

function provinceName(event: Event): string {
  return event.location.province_name ?? event.location.province
}

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

export function zoneName(zone: Zone): string {
  switch (zone.kind) {
    case 'italy': return 'Tutta Italia'
    case 'region': return zone.region
    case 'province': return zone.provinceName
  }
}

const MALE_REGIONS = new Set(['Abruzzo', 'Friuli-Venezia Giulia', 'Lazio', 'Molise', 'Piemonte', 'Trentino-Alto Adige', 'Veneto'])

export function regionAll(region: string): string {
  if (region === 'Marche') return 'Tutte le Marche'
  const male = MALE_REGIONS.has(region)
  const article = /^[AEIOU]/.test(region) ? "l'" : male ? 'il ' : 'la '
  return `${male ? 'Tutto' : 'Tutta'} ${article}${region}`
}

function inRegion(region: string): string {
  return region === 'Marche' ? 'nelle Marche' : `in ${region}`
}

export function zoneArea(zone: Zone): string {
  switch (zone.kind) {
    case 'italy': return 'in Italia'
    case 'region': return inRegion(zone.region)
    case 'province': return `in provincia di ${zone.provinceName}`
  }
}

export function zoneTitle(zone: Zone): string {
  return `Tapasciate ${zoneArea(zone)}`
}

export function zonePlace(zone: Zone): string {
  switch (zone.kind) {
    case 'italy': return 'in Italia'
    case 'region': return inRegion(zone.region)
    case 'province': return `a ${zone.provinceName}`
  }
}

export function noEventsMessage(zone: Zone, period: Period): string {
  const phrase = periodPhrase(period)
  return phrase
    ? `Nessuna tapasciata ${zonePlace(zone)} ${phrase}`
    : `Nessuna tapasciata in calendario ${zonePlace(zone)}`
}
