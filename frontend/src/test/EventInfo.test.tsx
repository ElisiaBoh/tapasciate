import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import EventInfo from '../components/EventInfo/EventInfo'
import type { Event } from '../types'

const event: Event = {
  id: 1,
  title: 'Tapasciata dei Colli',
  date: '2030-06-15',
  location: { city: 'Alzate', province: 'CO', province_name: 'Como', region: 'Lombardia' },
  poster: null,
  source: null,
  distances: ['6', '12'],
}

describe('EventInfo', () => {
  it('mostra dove, quando e percorso con le relative etichette', () => {
    render(<EventInfo event={event} layout="inline" />)
    expect(screen.getByText('Dove')).toBeInTheDocument()
    expect(screen.getByText('Alzate (CO)')).toBeInTheDocument()
    expect(screen.getByText('Quando')).toBeInTheDocument()
    expect(screen.getByText('Sabato 15 Giugno')).toBeInTheDocument()
    expect(screen.getByText('Percorso')).toBeInTheDocument()
    expect(screen.getByText('km: 6 - 12')).toBeInTheDocument()
  })

  it('omette il percorso se non ci sono distanze', () => {
    render(<EventInfo event={{ ...event, distances: [] }} layout="stacked" />)
    expect(screen.queryByText('Percorso')).not.toBeInTheDocument()
  })

  it('applica la classe del layout scelto', () => {
    const { container } = render(<EventInfo event={event} layout="stacked" />)
    expect(container.querySelector('dl')).toHaveClass('event-info--stacked')
  })
})
