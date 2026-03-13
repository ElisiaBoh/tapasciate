import { useReducer, useEffect, useMemo } from 'react'
import { fetchEvents } from '../services/eventsService'

const INITIAL_STATE = {
  status: 'loading',
  events: [],
  error: null,
  selectedProvince: '',
}

function eventsReducer(state, action) {
  switch (action.type) {
    case 'FETCH_SUCCESS':
      return { ...state, status: 'success', events: action.payload, error: null }
    case 'FETCH_ERROR':
      return { ...state, status: 'error', error: action.payload }
    case 'SET_PROVINCE':
      return { ...state, selectedProvince: action.payload }
    default:
      return state
  }
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function useEvents() {
  const [state, dispatch] = useReducer(eventsReducer, INITIAL_STATE)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  useEffect(() => {
    fetchEvents()
      .then(data => dispatch({ type: 'FETCH_SUCCESS', payload: data }))
      .catch(err => dispatch({ type: 'FETCH_ERROR', payload: err.message }))
  }, [])

  const filteredEvents = useMemo(() =>
    state.selectedProvince
      ? state.events.filter(e => e.location.province === state.selectedProvince)
      : state.events,
    [state.events, state.selectedProvince]
  )

  const groupedEvents = useMemo(() =>
    filteredEvents
      .filter(e => parseDate(e.date) >= today)
      .reduce((groups, event) => {
        if (!groups[event.date]) groups[event.date] = []
        groups[event.date].push(event)
        return groups
      }, {}),
    [filteredEvents, today]
  )

  const sortedDates = useMemo(() =>
    Object.keys(groupedEvents).sort(),
    [groupedEvents]
  )

  const provinces = useMemo(() =>
    Object.values(
      state.events
        .filter(e => parseDate(e.date) >= today)
        .reduce((acc, e) => {
          const { province, province_name } = e.location
          if (!acc[province]) acc[province] = { code: province, name: province_name || province }
          return acc
        }, {})
    ).sort((a, b) => a.name.localeCompare(b.name)),
    [state.events, today]
  )

  return {
    status: state.status,
    error: state.error,
    groupedEvents,
    sortedDates,
    provinces,
    selectedProvince: state.selectedProvince,
    setProvince: (p) => dispatch({ type: 'SET_PROVINCE', payload: p }),
  }
}
