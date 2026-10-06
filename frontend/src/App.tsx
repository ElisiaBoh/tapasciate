import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useEvents, useZoneEvents } from './hooks/useEvents'
import { navigate, useHistoryState, usePathname } from './hooks/useRoute'
import { eventPath } from './utils/eventPath'
import { parseRoute, resolvePageZone, zonePath } from './utils/zonePath'
import { noEventsMessage, zoneName } from './utils/zones'
import { clearSavedZonePath, getSavedZonePath, saveZonePath } from './utils/savedZone'
import { applyNoIndex } from './utils/eventSeo'
import { applyZoneSeo } from './utils/zoneSeo'
import Header from './components/Header/Header'
import ZoneBar from './components/ZoneBar/ZoneBar'
import ZonePicker from './components/ZonePicker/ZonePicker'
import BackButton from './components/BackButton/BackButton'
import EventList from './components/EventList/EventList'
import EventDetail from './components/EventDetail/EventDetail'
import StatusMessage from './components/StatusMessage/StatusMessage'
import Footer from './components/Footer/Footer'
import type { Event, Period, Zone } from './types'
import './App.css'

function App() {
  const { status, events, upcomingEvents, catalog, today } = useEvents()
  const pathname = usePathname()
  const historyState = useHistoryState()
  const route = useMemo(() => parseRoute(pathname), [pathname])
  const [period, setPeriod] = useState<Period>('all')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [savedPath, setSavedPath] = useState(getSavedZonePath)
  const [scrolled, setScrolled] = useState(false)
  const tickingRef = useRef(false)

  const initialPathRef = useRef(pathname)
  useLayoutEffect(() => {
    if (initialPathRef.current === '/' && savedPath && savedPath !== '/') navigate(savedPath, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 1)
        tickingRef.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setPickerOpen(false), [pathname])

  const eventId = route.kind === 'event' ? route.id : null
  useEffect(() => {
    if (eventId !== null) window.scrollTo(0, 0)
  }, [eventId])

  const event = eventId !== null ? events.find(e => e.id === eventId) : undefined

  const pageZone = useMemo(
    () => resolvePageZone({ route, status, catalog, event, fromListPath: historyState.listPath }),
    [route, status, catalog, event, historyState.listPath]
  )
  const zone = pageZone.state === 'found' ? pageZone.zone : null
  const zoneNotFound = route.kind !== 'event' && pageZone.state === 'notFound'

  const { zoneEvents, periodCount, groupedEvents, sortedDates } = useZoneEvents(upcomingEvents, zone, period, today)

  useEffect(() => {
    if (!zoneNotFound) return
    if (pathname === savedPath) {
      clearSavedZonePath()
      setSavedPath(null)
    }
    return applyNoIndex()
  }, [zoneNotFound, pathname, savedPath])

  const seoZone = route.kind === 'zone' && zone?.kind !== 'italy' ? zone : null
  const seoZoneCount = zoneEvents.length
  useEffect(() => {
    if (seoZone) return applyZoneSeo(seoZone, seoZoneCount)
  }, [seoZone, seoZoneCount])

  const selectZone = useCallback((selected: Zone) => {
    const path = zonePath(selected)
    saveZonePath(path)
    setSavedPath(path)
    setPickerOpen(false)
    if (path !== window.location.pathname) {
      navigate(path)
      window.scrollTo(0, 0)
    }
  }, [])

  // Replacing the history entry keeps "back" pointing at the list
  const selectEvent = useCallback((selected: Event) => {
    navigate(eventPath(selected), { replace: true, state: window.history.state ?? {} })
  }, [])

  return (
    <div className="app">
      <div className="sticky-wrapper">
        <Header scrolled={scrolled} homePath={savedPath ?? '/'} />
      </div>

      {route.kind === 'event' ? (
        <>
          {zone && <BackButton href={zonePath(zone)} label={zoneName(zone)} />}
          <EventDetail
            status={status}
            event={event}
            sameDayEvents={event ? zoneEvents.filter(e => e.date === event.date) : []}
            zoneName={zone ? zoneName(zone) : ''}
            onSelect={selectEvent}
          />
        </>
      ) : (
        <>
          <ZoneBar
            loading={status !== 'success' && !zoneNotFound}
            zone={zone}
            period={period}
            onPeriodChange={setPeriod}
            onOpenPicker={() => setPickerOpen(true)}
            total={zoneEvents.length}
            periodCount={periodCount}
          />
          {zoneNotFound ? (
            <main className="events-container">
              <StatusMessage>Scegli una zona per vedere le tapasciate in calendario.</StatusMessage>
            </main>
          ) : (
            <EventList
              status={status}
              sortedDates={sortedDates}
              groupedEvents={groupedEvents}
              listPath={pathname}
              emptyMessage={zone ? noEventsMessage(zone, period) : ''}
            />
          )}
          {pickerOpen && (
            <ZonePicker
              catalog={catalog}
              current={zone}
              onSelect={selectZone}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </>
      )}
      <Footer />
    </div>
  )
}

export default App
