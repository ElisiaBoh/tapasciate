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
  // PDF legacy: usato solo finché lo scraper non ha convertito la locandina in immagini
  poster: string | null
  source: string | null
  distances: string[]
}

export interface Province {
  code: string
  name: string
}

export type Status = 'loading' | 'success' | 'error'
