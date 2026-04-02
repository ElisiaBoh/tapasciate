import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { useEvents } from '../hooks/useEvents'
import { fetchEvents } from '../services/eventsService'
import type { Event } from '../types'

jest.mock('../services/eventsService')
const mockFetchEvents = fetchEvents as jest.MockedFunction<typeof fetchEvents>

const FUTURE_DATE = '2030-06-15'
const PAST_DATE = '2020-01-01'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    title: 'Test Event',
    date: FUTURE_DATE,
    location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
    poster: null,
    source: null,
    distances: [],
    ...overrides,
  }
}

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

  it('esclude gli eventi passati da groupedEvents', async () => {
    mockFetchEvents.mockResolvedValue([
      makeEvent({ date: PAST_DATE }),
      makeEvent({ date: FUTURE_DATE }),
    ])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.sortedDates).not.toContain(PAST_DATE)
    expect(result.current.sortedDates).toContain(FUTURE_DATE)
  })

  it('filtra gli eventi per provincia selezionata', async () => {
    mockFetchEvents.mockResolvedValue([
      makeEvent({ location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' } }),
      makeEvent({ location: { city: 'Milano', province: 'MI', province_name: 'Milano', region: 'Lombardia' } }),
    ])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))

    act(() => result.current.setProvince('BG'))

    const events = Object.values(result.current.groupedEvents).flat()
    expect(events.every(e => e.location.province === 'BG')).toBe(true)
  })

  it('mostra tutti gli eventi se nessuna provincia è selezionata', async () => {
    mockFetchEvents.mockResolvedValue([
      makeEvent({ location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' } }),
      makeEvent({ location: { city: 'Milano', province: 'MI', province_name: 'Milano', region: 'Lombardia' } }),
    ])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))

    const events = Object.values(result.current.groupedEvents).flat()
    expect(events).toHaveLength(2)
  })

  it('calcola le province solo dagli eventi futuri', async () => {
    mockFetchEvents.mockResolvedValue([
      makeEvent({ date: FUTURE_DATE, location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' } }),
      makeEvent({ date: PAST_DATE, location: { city: 'Roma', province: 'RM', province_name: 'Roma', region: 'Lazio' } }),
    ])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))

    const codes = result.current.provinces.map(p => p.code)
    expect(codes).toContain('BG')
    expect(codes).not.toContain('RM')
  })

  it('ordina le province alfabeticamente per nome', async () => {
    mockFetchEvents.mockResolvedValue([
      makeEvent({ location: { city: 'Torino', province: 'TO', province_name: 'Torino', region: 'Piemonte' } }),
      makeEvent({ location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' } }),
    ])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))

    const names = result.current.provinces.map(p => p.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it('deduplica le province con più eventi nella stessa provincia', async () => {
    mockFetchEvents.mockResolvedValue([
      makeEvent({ title: 'Evento 1', location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' } }),
      makeEvent({ title: 'Evento 2', location: { city: 'Dalmine', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' } }),
    ])
    const { result } = renderHook(() => useEvents())
    await waitFor(() => expect(result.current.status).toBe('success'))

    expect(result.current.provinces.filter(p => p.code === 'BG')).toHaveLength(1)
  })
})
