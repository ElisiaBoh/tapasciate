import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEvents, useZoneEvents } from './hooks/useEvents'
import { navigate, useHistoryState, usePathname } from './hooks/useRoute'
import { useSavedZone } from './hooks/useSavedZone'
import { useScrolled } from './hooks/useScrolled'
import { useZoneSeo } from './hooks/useZoneSeo'
import { eventPath } from './utils/eventPath'
import { parseRoute, resolvePageZone, zonePath } from './utils/zonePath'
import { noEventsMessage, zoneName } from './utils/zones'
import Header from './components/Header/Header'
import ZoneBar from './components/ZoneBar/ZoneBar'
import ZoneTitle from './components/ZoneTitle/ZoneTitle'
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
  const scrolled = useScrolled()

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

  const { savedPath, saveZone } = useSavedZone(pathname, zoneNotFound)
  useZoneSeo(route.kind === 'zone' && zone?.kind !== 'italy' ? zone : null, zoneEvents.length, zoneNotFound)

  const selectZone = useCallback((selected: Zone) => {
    const path = zonePath(selected)
    saveZone(path)
    setPickerOpen(false)
    if (path !== window.location.pathname) {
      navigate(path)
      window.scrollTo(0, 0)
    }
  }, [saveZone])

  // Replacing the history entry keeps "back" pointing at the list
  const selectEvent = useCallback((selected: Event) => {
    navigate(eventPath(selected), { replace: true, state: window.history.state ?? {} })
  }, [])

  const zoneLoading = status !== 'success' && !zoneNotFound

  return (
    <div className="app">
      <div className="sticky-wrapper">
        <Header scrolled={scrolled} homePath={savedPath ?? '/'} />
        {route.kind === 'event' ? (
          zone && <BackButton href={zonePath(zone)} label={zoneName(zone)} />
        ) : (
          <ZoneBar
            loading={zoneLoading}
            zone={zone}
            period={period}
            onPeriodChange={setPeriod}
            onOpenPicker={() => setPickerOpen(true)}
          />
        )}
      </div>

      {route.kind === 'event' ? (
        <EventDetail
          status={status}
          event={event}
          sameDayEvents={event ? zoneEvents.filter(e => e.date === event.date) : []}
          zoneName={zone ? zoneName(zone) : ''}
          onSelect={selectEvent}
        />
      ) : (
        <>
          <ZoneTitle
            loading={zoneLoading}
            zone={zone}
            period={period}
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
