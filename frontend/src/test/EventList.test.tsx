import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import EventList from '../components/EventList/EventList'
import type { Event } from '../types'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    title: 'Test Event',
    date: '2026-06-15',
    location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
    poster: null,
    source: null,
    distances: [],
    ...overrides,
  }
}

describe('EventList', () => {
  it('mostra gli skeleton durante il caricamento', () => {
    render(<EventList status="loading" sortedDates={[]} groupedEvents={{}} />)
    expect(document.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('non mostra la lista eventi durante il caricamento', () => {
    render(<EventList status="loading" sortedDates={[]} groupedEvents={{}} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('mostra il messaggio di errore quando status è error', () => {
    render(<EventList status="error" sortedDates={[]} groupedEvents={{}} />)
    expect(screen.getByText(/Errore nel caricamento degli eventi/)).toBeInTheDocument()
  })

  it('mostra il messaggio di stato vuoto quando non ci sono eventi', () => {
    render(<EventList status="success" sortedDates={[]} groupedEvents={{}} />)
    expect(screen.getByText(/Nessun evento trovato per questa provincia/)).toBeInTheDocument()
  })

  it('mostra gli eventi raggruppati per data', () => {
    const groupedEvents = { '2026-06-15': [makeEvent()] }
    render(
      <EventList status="success" sortedDates={['2026-06-15']} groupedEvents={groupedEvents} />
    )
    expect(screen.getByText('Test Event')).toBeInTheDocument()
  })

  it('mostra il conteggio degli eventi per data', () => {
    const groupedEvents = {
      '2026-06-15': [makeEvent(), makeEvent({ title: 'Secondo Evento' })],
    }
    render(
      <EventList status="success" sortedDates={['2026-06-15']} groupedEvents={groupedEvents} />
    )
    expect(screen.getByText(/2 tapasciate/)).toBeInTheDocument()
  })

  it('mostra più sezioni data', () => {
    const groupedEvents = {
      '2026-06-15': [makeEvent()],
      '2026-07-01': [makeEvent({ title: 'Evento di Luglio' })],
    }
    render(
      <EventList
        status="success"
        sortedDates={['2026-06-15', '2026-07-01']}
        groupedEvents={groupedEvents}
      />
    )
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('Evento di Luglio')).toBeInTheDocument()
  })

  it('mostra l\'intestazione della data in italiano', () => {
    const groupedEvents = { '2026-04-01': [makeEvent()] }
    render(
      <EventList status="success" sortedDates={['2026-04-01']} groupedEvents={groupedEvents} />
    )
    expect(screen.getByText('Mercoledì 1 Aprile')).toBeInTheDocument()
  })
})
