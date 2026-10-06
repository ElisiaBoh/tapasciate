import type { Period } from '../types'

export const PERIODS: { value: Period; label: string }[] = [
  { value: 'all', label: 'Tutte' },
  { value: 'this-week', label: 'Questa settimana' },
  { value: 'next-week', label: 'Prossima settimana' },
]

// "questa settimana" / "la prossima settimana" per le frasi; null per "tutte"
export function periodPhrase(period: Period): string | null {
  switch (period) {
    case 'all': return null
    case 'this-week': return 'questa settimana'
    case 'next-week': return 'la prossima settimana'
  }
}

export function toIsoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// Intervallo di date (YYYY-MM-DD, estremi inclusi) del periodo. "Questa settimana" va da oggi
// a domenica, "prossima settimana" da lunedì a domenica successivi.
export function periodRange(period: Period, today: Date): { from: string; to: string | null } {
  const daysToSunday = (7 - today.getDay()) % 7
  switch (period) {
    case 'all':
      return { from: toIsoDate(today), to: null }
    case 'this-week':
      return { from: toIsoDate(today), to: toIsoDate(addDays(today, daysToSunday)) }
    case 'next-week':
      return { from: toIsoDate(addDays(today, daysToSunday + 1)), to: toIsoDate(addDays(today, daysToSunday + 7)) }
  }
}

export function inPeriod(date: string, period: Period, today: Date): boolean {
  const { from, to } = periodRange(period, today)
  return date >= from && (to === null || date <= to)
}
