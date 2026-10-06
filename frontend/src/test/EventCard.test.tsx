import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import EventCard from '../components/EventCard/EventCard'
import type { Event } from '../types'

const baseEvent: Event = {
  id: 1,
  title: 'Tapasciata dei Colli',
  date: '2026-06-15',
  location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
  posterPages: [],
  source: null,
  distances: [],
}

describe('EventCard', () => {
  it('mostra titolo, città e provincia', () => {
    render(<EventCard event={baseEvent} listPath="/lombardia/bergamo" />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Tapasciata dei Colli')
    expect(screen.getByText('Bergamo (BG)')).toBeInTheDocument()
  })

  it('tutta la card è il link al dettaglio', () => {
    render(<EventCard event={baseEvent} listPath="/" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/evento/1-tapasciata-dei-colli')
    expect(link).toHaveTextContent('Tapasciata dei Colli')
    expect(link).not.toHaveAttribute('target')
  })

  it('aprendo il dettaglio ricorda la lista di provenienza', () => {
    render(<EventCard event={baseEvent} listPath="/lombardia" />)
    fireEvent.click(screen.getByRole('link'))
    expect(window.location.pathname).toBe('/evento/1-tapasciata-dei-colli')
    expect(window.history.state).toEqual({ fromList: true, listPath: '/lombardia' })
  })

  it('mostra le distanze quando presenti', () => {
    render(<EventCard event={{ ...baseEvent, distances: ['10', '21'] }} listPath="/" />)
    expect(screen.getByText('10 - 21 km')).toBeInTheDocument()
  })

  it('non mostra le distanze se assenti', () => {
    render(<EventCard event={baseEvent} listPath="/" />)
    expect(screen.queryByText(/km$/)).not.toBeInTheDocument()
  })
})
