import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import EventCard from '../components/EventCard/EventCard'
import type { Event } from '../types'

const baseEvent: Event = {
  id: 1,
  title: 'Tapasciata dei Colli',
  date: '2026-06-15',
  location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
  poster: null,
  source: null,
  distances: [],
}

describe('EventCard', () => {
  it('mostra il titolo dell\'evento', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByText('Tapasciata dei Colli')).toBeInTheDocument()
  })

  it('mostra città e provincia', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByText('Bergamo (BG)')).toBeInTheDocument()
  })

  it('mostra il pulsante dettagli anche senza locandina', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByRole('link', { name: 'dettagli' })).toBeInTheDocument()
  })

  it('il pulsante dettagli porta alla pagina di dettaglio', () => {
    const event = { ...baseEvent, poster: 'https://example.com/poster.pdf' }
    render(<EventCard event={event} />)
    const link = screen.getByRole('link', { name: 'dettagli' })
    expect(link).toHaveAttribute('href', '/evento/1-tapasciata-dei-colli')
    expect(link).not.toHaveAttribute('target')
  })

  it('il titolo non è un link: il dettaglio si apre solo dal pulsante', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.queryByRole('link', { name: 'Tapasciata dei Colli' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('mostra le distanze quando presenti', () => {
    const event = { ...baseEvent, distances: ['10', '21'] }
    render(<EventCard event={event} />)
    expect(screen.getByText('km: 10 - 21')).toBeInTheDocument()
  })

  it('non mostra la sezione distanze se l\'array è vuoto', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.queryByText(/^km:/)).not.toBeInTheDocument()
  })
})
