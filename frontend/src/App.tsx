import { useCallback, useEffect, useRef, useState } from 'react'
import { useEvents } from './hooks/useEvents'
import { navigate, usePathname } from './hooks/useRoute'
import { eventPath, parseEventId } from './utils/eventPath'
import Header from './components/Header/Header'
import ProvinceFilter from './components/ProvinceFilter/ProvinceFilter'
import BackButton from './components/BackButton/BackButton'
import EventList from './components/EventList/EventList'
import EventDetail from './components/EventDetail/EventDetail'
import Footer from './components/Footer/Footer'
import type { Event } from './types'
import './App.css'

function App() {
  const {
    status, events, upcomingEvents, groupedEvents, sortedDates,
    provinces, selectedProvince, setProvince,
  } = useEvents()
  const [scrolled, setScrolled] = useState(false)
  const tickingRef = useRef(false)
  const eventId = parseEventId(usePathname())

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

  useEffect(() => {
    if (eventId !== null) window.scrollTo(0, 0)
  }, [eventId])

  // Scorrere tra gli eventi sostituisce la voce di history: "indietro" riporta sempre alla lista
  const selectEvent = useCallback((event: Event) => {
    navigate(eventPath(event), { replace: true, state: window.history.state ?? {} })
  }, [])

  return (
    <div className="app">
      <div className="sticky-wrapper">
        <Header scrolled={scrolled} isHome={eventId === null} />
        <ProvinceFilter
          status={status}
          provinces={provinces}
          selectedProvince={selectedProvince}
          onChange={setProvince}
        >
          {eventId !== null && <BackButton />}
        </ProvinceFilter>
      </div>
      {eventId === null ? (
        <EventList
          status={status}
          sortedDates={sortedDates}
          groupedEvents={groupedEvents}
          listPath="/"
          emptyMessage="Nessuna tapasciata in calendario"
        />
      ) : (
        <EventDetail
          status={status}
          event={events.find(e => e.id === eventId)}
          events={upcomingEvents}
          selectedProvince={selectedProvince}
          onSelect={selectEvent}
        />
      )}
      <Footer />
    </div>
  )
}

export default App
