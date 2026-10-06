import { renderHook, waitFor } from '@testing-library/react'
import { useEvents, useZoneEvents } from '../hooks/useEvents'
import { fetchEvents } from '../services/eventsService'
import type { Event, Zone } from '../types'

jest.mock('../services/eventsService')
const mockFetchEvents = fetchEvents as jest.MockedFunction<typeof fetchEvents>

const FUTURE_DATE = '2030-06-15'
const PAST_DATE = '2020-01-01'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    title: 'Test Event',
    date: FUTURE_DATE,
    location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
    posterPages: [],
    source: null,
    distances: [],
    ...overrides,
  }
}

const milano = { city: 'Milano', province: 'MI', province_name: 'Milano', region: 'Lombardia' }
const roma = { city: 'Roma', province: 'RM', province_name: 'Roma', region: 'Lazio' }

describe('useEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('parte in stato loading', () => {
    mockFetchEvents.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useEvents())
    expect(result.current.status).toBe('loading')
  })

  it('passa a success dopo il fetch', async () => {
    mockFetchEvents.mockResolvedValue([makeEvent()])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))
  })

  it('passa a error se il fetch fallisce', async () => {
    mockFetchEvents.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Network error')
  })

  it('upcomingEvents esclude gli eventi passati ed è ordinato per data', async () => {
    mockFetchEvents.mockResolvedValue([
      makeEvent({ id: 1, date: '2031-01-01' }),
      makeEvent({ id: 2, date: PAST_DATE }),
      makeEvent({ id: 3, date: FUTURE_DATE }),
    ])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.upcomingEvents.map(e => e.id)).toEqual([3, 1])
    expect(result.current.events).toHaveLength(3)
  })

  it('il catalogo delle zone conta solo gli eventi futuri', async () => {
    mockFetchEvents.mockResolvedValue([
      makeEvent({ id: 1 }),
      makeEvent({ id: 2, location: milano }),
      makeEvent({ id: 3, date: PAST_DATE, location: roma }),
    ])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.catalog).toEqual([
      { name: 'Lombardia', count: 2, provinces: [{ code: 'BG', name: 'Bergamo', count: 1 }, { code: 'MI', name: 'Milano', count: 1 }] },
    ])
  })
})

describe('useZoneEvents', () => {
  const wednesday = new Date(2026, 9, 7)
  const events = [
    makeEvent({ id: 1, date: '2026-10-10' }),
    makeEvent({ id: 2, date: '2026-10-11', location: milano }),
    makeEvent({ id: 3, date: '2026-10-11' }),
    makeEvent({ id: 4, date: '2026-10-18', location: roma }),
  ]
  const lombardia: Zone = { kind: 'region', region: 'Lombardia' }
  const bergamo: Zone = { kind: 'province', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' }

  it('filtra per zona e raggruppa per data', () => {
    const { result } = renderHook(() => useZoneEvents(events, lombardia, 'all', wednesday))
    expect(result.current.zoneEvents.map(e => e.id)).toEqual([1, 2, 3])
    expect(result.current.sortedDates).toEqual(['2026-10-10', '2026-10-11'])
    expect(result.current.groupedEvents['2026-10-11'].map(e => e.id)).toEqual([2, 3])
  })

  it('filtra per provincia', () => {
    const { result } = renderHook(() => useZoneEvents(events, bergamo, 'all', wednesday))
    expect(result.current.zoneEvents.map(e => e.id)).toEqual([1, 3])
  })

  it('filtra per periodo mantenendo il totale della zona', () => {
    const { result } = renderHook(() => useZoneEvents(events, { kind: 'italy' }, 'next-week', wednesday))
    expect(result.current.zoneEvents).toHaveLength(4)
    expect(result.current.periodCount).toBe(1)
    expect(result.current.sortedDates).toEqual(['2026-10-18'])
  })

  it('senza zona non restituisce eventi', () => {
    const { result } = renderHook(() => useZoneEvents(events, null, 'all', wednesday))
    expect(result.current.zoneEvents).toEqual([])
    expect(result.current.sortedDates).toEqual([])
  })
})
