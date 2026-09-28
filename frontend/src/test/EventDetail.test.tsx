import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import EventDetail from '../components/EventDetail/EventDetail'
import type { Event } from '../types'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    title: 'Tapasciata dei Colli',
    date: '2030-06-15',
    location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
    posterPages: [],
    source: null,
    distances: [],
    ...overrides,
  }
}

const first = makeEvent({ id: 1, title: 'Primo' })
const second = makeEvent({
  id: 2,
  title: 'Secondo',
  distances: ['6', '12'],
  posterPages: [{ url: 'https://example.com/p1.webp', width: 1200, height: 1697 }],
})
const third = makeEvent({ id: 3, title: 'Terzo' })
const events = [first, second, third]

function renderDetail(props: Partial<Parameters<typeof EventDetail>[0]> = {}) {
  const onSelect = jest.fn()
  render(
    <EventDetail status="success" event={second} events={events} selectedProvince="" onSelect={onSelect} {...props} />
  )
  return onSelect
}

describe('EventDetail', () => {
  it('mostra titolo, luogo, data e posizione nella lista', () => {
    renderDetail()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Secondo')
    expect(screen.getByText('Bergamo (BG)')).toBeInTheDocument()
    expect(screen.getAllByText('Sabato 15 Giugno')).toHaveLength(2)
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('mostra le distanze', () => {
    renderDetail()
    expect(screen.getByText('km: 6 - 12')).toBeInTheDocument()
  })

  it('mostra le pagine della locandina come immagini', () => {
    const withPages = makeEvent({
      id: 2,
      title: 'Secondo',
      posterPages: [
        { url: 'https://example.com/p1.webp', width: 1200, height: 1697 },
        { url: 'https://example.com/p2.webp', width: 1200, height: 1697 },
      ],
    })
    renderDetail({ event: withPages })
    const images = screen.getAllByRole('img', { name: /Locandina Secondo/ })
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/p1.webp')
    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[1]).toHaveAttribute('loading', 'lazy')
    expect(images[1]).toHaveAccessibleName('Locandina Secondo, pagina 2 di 2')
  })

  it('senza locandina mostra il segnaposto', () => {
    renderDetail({ event: first })
    expect(screen.getByText('non disponibile')).toBeInTheDocument()
  })

  it('non offre link per aprire o scaricare la locandina', () => {
    renderDetail()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('nasconde le distanze quando assenti', () => {
    renderDetail({ event: first })
    expect(screen.queryByText(/^km:/)).not.toBeInTheDocument()
  })

  it('le frecce selezionano l\'evento precedente e successivo', () => {
    const onSelect = renderDetail()
    fireEvent.click(screen.getByRole('button', { name: /precedente/i }))
    expect(onSelect).toHaveBeenLastCalledWith(first)
    fireEvent.click(screen.getByRole('button', { name: /successiva/i }))
    expect(onSelect).toHaveBeenLastCalledWith(third)
  })

  it('supporta i tasti freccia', () => {
    const onSelect = renderDetail()
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith(third)
  })

  it('disabilita le frecce al primo e all\'ultimo evento', () => {
    renderDetail({ event: first })
    expect(screen.getByRole('button', { name: /precedente/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /successiva/i })).toBeEnabled()
  })

  it('mostra un messaggio se l\'evento non esiste', () => {
    renderDetail({ event: undefined })
    expect(screen.getByText(/Tapasciata non trovata/)).toBeInTheDocument()
  })

  it('passa al primo evento della nuova provincia se quello corrente non è incluso', () => {
    const onSelect = jest.fn()
    const milano = makeEvent({ id: 9, title: 'Milano', location: { city: 'Milano', province: 'MI', province_name: 'Milano', region: 'Lombardia' } })
    const { rerender } = render(
      <EventDetail status="success" event={second} events={events} selectedProvince="" onSelect={onSelect} />
    )
    rerender(<EventDetail status="success" event={second} events={[milano]} selectedProvince="MI" onSelect={onSelect} />)
    expect(onSelect).toHaveBeenCalledWith(milano)
  })
})
