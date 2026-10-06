import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useEvents, useZoneEvents } from './hooks/useEvents'
import { navigate, useHistoryState, usePathname } from './hooks/useRoute'
import { eventPath } from './utils/eventPath'
import { parseRoute, resolveZone, zonePath } from './utils/zonePath'
import { inZone, provinceZoneOf, zoneName, zonePlace, ITALY } from './utils/zones'
import { periodPhrase } from './utils/period'
import { clearSavedZonePath, getSavedZonePath, saveZonePath } from './utils/savedZone'
import { applyNoIndex } from './utils/eventSeo'
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

function emptyMessage(zone: Zone, period: Period): string {
  const phrase = periodPhrase(period)
  return phrase
    ? `Nessuna tapasciata ${zonePlace(zone)} ${phrase}`
    : `Nessuna tapasciata in calendario ${zonePlace(zone)}`
}

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

  // All'apertura di "/" si va alla zona scelta l'ultima volta (prima del primo paint, senza lampi)
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

  const eventId = route.kind === 'event' ? route.id : null
  useEffect(() => {
    if (eventId !== null) window.scrollTo(0, 0)
  }, [eventId])

  const event = eventId !== null ? events.find(e => e.id === eventId) : undefined

  // Zona della pagina. Lista: dall'URL (undefined finché i dati non bastano a risolverla, null se
  // non esiste). Dettaglio: la lista da cui si arriva se contiene l'evento, altrimenti la sua provincia.
  const zone = useMemo((): Zone | null | undefined => {
    if (route.kind === 'notFound') return null
    if (route.kind === 'zone') {
      if (route.slugs.length === 0) return ITALY
      return status === 'success' ? resolveZone(catalog, route.slugs) : undefined
    }
    if (!event) return undefined
    const from = historyState.zonePath ? parseRoute(historyState.zonePath) : null
    const fromZone = from?.kind === 'zone' ? resolveZone(catalog, from.slugs) : null
    return fromZone && inZone(event, fromZone) ? fromZone : provinceZoneOf(event)
  }, [route, status, catalog, event, historyState.zonePath])

  const { zoneEvents, periodCount, groupedEvents, sortedDates } = useZoneEvents(upcomingEvents, zone ?? null, period, today)

  // URL che non corrisponde a nessuna zona: non va indicizzato, e se era la zona ricordata la si dimentica
  const zoneNotFound = route.kind !== 'event' && zone === null && (route.kind === 'notFound' || status === 'success')
  useEffect(() => {
    if (!zoneNotFound) return
    if (pathname === savedPath) {
      clearSavedZonePath()
      setSavedPath(null)
    }
    return applyNoIndex()
  }, [zoneNotFound, pathname, savedPath])

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

  // Scorrere tra gli eventi sostituisce la voce di history: "indietro" riporta sempre alla lista
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
            siblings={event ? zoneEvents.filter(e => e.date === event.date) : []}
            zoneName={zone ? zoneName(zone) : ''}
            onSelect={selectEvent}
          />
        </>
      ) : (
        <>
          <ZoneBar
            loading={status !== 'success' && zone !== null}
            zone={zone ?? null}
            period={period}
            onPeriodChange={setPeriod}
            onOpenPicker={() => setPickerOpen(true)}
            total={zoneEvents.length}
            periodCount={periodCount}
          />
          {zone === null ? (
            <main className="events-container">
              <StatusMessage>Scegli una zona per vedere le tapasciate in calendario.</StatusMessage>
            </main>
          ) : (
            <EventList
              status={status}
              sortedDates={sortedDates}
              groupedEvents={groupedEvents}
              listPath={pathname}
              emptyMessage={zone ? emptyMessage(zone, period) : ''}
            />
          )}
          {pickerOpen && (
            <ZonePicker
              catalog={catalog}
              current={zone ?? null}
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
