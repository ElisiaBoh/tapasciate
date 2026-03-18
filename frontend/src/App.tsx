import { useEffect, useRef, useState } from 'react'
import { useEvents } from './hooks/useEvents'
import Header from './components/Header/Header'
import ProvinceFilter from './components/ProvinceFilter/ProvinceFilter'
import EventList from './components/EventList/EventList'
import Footer from './components/Footer/Footer'
import './App.css'

function App() {
  const { status, groupedEvents, sortedDates, provinces, selectedProvince, setProvince } = useEvents()
  const [scrolled, setScrolled] = useState(false)
  const tickingRef = useRef(false)

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

  return (
    <div className="app">
      <div className="sticky-wrapper">
        <Header scrolled={scrolled} />
        <ProvinceFilter
          status={status}
          provinces={provinces}
          selectedProvince={selectedProvince}
          onChange={setProvince}
        />
      </div>
      <EventList
        status={status}
        sortedDates={sortedDates}
        groupedEvents={groupedEvents}
      />
      <Footer />
    </div>
  )
}

export default App
