export interface Location {
  city: string
  province: string
  province_name: string | null
  region: string
}

export interface Event {
  title: string
  date: string // YYYY-MM-DD
  location: Location
  poster: string | null
  source: string | null
  distances: string[]
}

export interface Province {
  code: string
  name: string
}

export type Status = 'loading' | 'success' | 'error'
