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

  it('non mostra il pulsante poster se poster è null', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.queryByRole('link', { name: /poster/i })).not.toBeInTheDocument()
  })

  it('mostra il pulsante poster se poster è fornito', () => {
    const event = { ...baseEvent, poster: 'https://example.com/poster.pdf' }
    render(<EventCard event={event} />)
    expect(screen.getByRole('link', { name: /poster/i })).toBeInTheDocument()
  })

  it('il link poster apre l\'url in una nuova tab', () => {
    const event = { ...baseEvent, poster: 'https://example.com/poster.pdf' }
    render(<EventCard event={event} />)
    const link = screen.getByRole('link', { name: /poster/i })
    expect(link).toHaveAttribute('href', 'https://example.com/poster.pdf')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('il titolo è un link alla pagina di dettaglio', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByRole('link', { name: 'Tapasciata dei Colli' })).toHaveAttribute('href', '/evento/1-tapasciata-dei-colli')
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
