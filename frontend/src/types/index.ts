export interface Location {
  city: string
  province: string
  province_name: string | null
  region: string
}

export interface PosterPage {
  url: string
  width: number
  height: number
}

export interface Event {
  id: number
  title: string
  date: string // YYYY-MM-DD
  location: Location
  // Pagine della locandina come immagini (generate dallo scraper)
  posterPages: PosterPage[]
  source: string | null
  distances: string[]
}

export type Zone =
  | { kind: 'italy' }
  | { kind: 'region'; region: string }
  | { kind: 'province'; region: string; province: string; provinceName: string }

export type Period = 'all' | 'this-week' | 'next-week'

export interface ProvinceEntry {
  code: string
  name: string
  count: number
}

export interface RegionEntry {
  name: string
  count: number
  provinces: ProvinceEntry[]
}

export type Status = 'loading' | 'success' | 'error'
