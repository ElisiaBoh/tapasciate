import { useReducer, useEffect, useMemo } from 'react'
import { fetchEvents } from '../services/eventsService'
import { buildCatalog, inZone } from '../utils/zones'
import { inPeriod, toIsoDate } from '../utils/period'
import type { Event, Period, RegionEntry, Status, Zone } from '../types'

interface EventsState {
  status: Status
  events: Event[]
  error: string | null
}

type EventsAction =
  | { type: 'FETCH_SUCCESS'; payload: Event[] }
  | { type: 'FETCH_ERROR'; payload: string }

const INITIAL_STATE: EventsState = {
  status: 'loading',
  events: [],
  error: null,
}

function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case 'FETCH_SUCCESS':
      return { ...state, status: 'success', events: action.payload, error: null }
    case 'FETCH_ERROR':
      return { ...state, status: 'error', error: action.payload }
  }
}

export interface UseEventsResult {
  status: Status
  error: string | null
  events: Event[]
  upcomingEvents: Event[]
  catalog: RegionEntry[]
  today: Date
}

export function useEvents(): UseEventsResult {
  const [state, dispatch] = useReducer(eventsReducer, INITIAL_STATE)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  useEffect(() => {
    fetchEvents()
      .then(data => dispatch({ type: 'FETCH_SUCCESS', payload: data }))
      .catch((err: Error) => dispatch({ type: 'FETCH_ERROR', payload: err.message }))
  }, [])

  const upcomingEvents = useMemo(() => {
    const from = toIsoDate(today)
    return state.events
      .filter(e => e.date >= from)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [state.events, today])

  const catalog = useMemo(() => buildCatalog(upcomingEvents), [upcomingEvents])

  return {
    status: state.status,
    error: state.error,
    events: state.events,
    upcomingEvents,
    catalog,
    today,
  }
}

export interface ZoneEvents {
  zoneEvents: Event[]
  periodCount: number
  groupedEvents: Record<string, Event[]>
  sortedDates: string[]
}

export function useZoneEvents(upcomingEvents: Event[], zone: Zone | null, period: Period, today: Date): ZoneEvents {
  const zoneEvents = useMemo(
    () => (zone ? upcomingEvents.filter(e => inZone(e, zone)) : []),
    [upcomingEvents, zone]
  )

  return useMemo(() => {
    const periodEvents = zoneEvents.filter(e => inPeriod(e.date, period, today))
    const groupedEvents = periodEvents.reduce<Record<string, Event[]>>((groups, event) => {
      if (!groups[event.date]) groups[event.date] = []
      groups[event.date].push(event)
      return groups
    }, {})
    return {
      zoneEvents,
      periodCount: periodEvents.length,
      groupedEvents,
      sortedDates: Object.keys(groupedEvents).sort(),
    }
  }, [zoneEvents, period, today])
}
