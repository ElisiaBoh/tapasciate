import { useEvents } from './hooks/useEvents'
import Header from './components/Header/Header'
import ProvinceFilter from './components/ProvinceFilter/ProvinceFilter'
import EventList from './components/EventList/EventList'
import Footer from './components/Footer/Footer'
import './App.css'

function App() {
  const { status, groupedEvents, sortedDates, provinces, selectedProvince, setProvince } = useEvents()

  return (
    <div className="app">
      <Header />
      <ProvinceFilter
        status={status}
        provinces={provinces}
        selectedProvince={selectedProvince}
        onChange={setProvince}
      />
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
