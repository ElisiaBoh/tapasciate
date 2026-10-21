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
    organizer: null,
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

function setupDetail(props: Partial<Parameters<typeof EventDetail>[0]> = {}) {
  const onSelect = jest.fn()
  render(
    <EventDetail status="success" event={second} sameDayEvents={events} zoneName="Bergamo" onSelect={onSelect} {...props} />
  )
  return onSelect
}

describe('EventDetail', () => {
  it('mostra titolo, luogo, data e posizione nella lista', () => {
    setupDetail()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Secondo')
    expect(screen.getByText('Bergamo (BG)')).toBeInTheDocument()
    expect(screen.getByText('Sabato 15 Giugno')).toBeInTheDocument()
    expect(screen.getByText('Sabato 15 giugno 2030')).toBeInTheDocument()
    expect(screen.getByText('Bergamo · 2 di 3')).toBeInTheDocument()
  })

  it('mostra le distanze', () => {
    setupDetail()
    expect(screen.getByText('6 - 12 km')).toBeInTheDocument()
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
    setupDetail({ event: withPages })
    const images = screen.getAllByRole('img', { name: /Locandina Secondo/ })
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/p1.webp')
    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[1]).toHaveAttribute('loading', 'lazy')
    expect(images[1]).toHaveAccessibleName('Locandina Secondo, pagina 2 di 2')
  })

  it('la locandina si apre a schermo intero e si chiude con Esc', () => {
    setupDetail()
    fireEvent.click(screen.getByRole('button', { name: 'Apri la locandina a schermo intero' }))
    const viewer = screen.getByRole('dialog', { name: 'Locandina Secondo' })
    expect(viewer).toHaveFocus()
    fireEvent.keyDown(viewer, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('con la locandina aperta le frecce da tastiera non cambiano evento', () => {
    const onSelect = setupDetail()
    fireEvent.click(screen.getByRole('button', { name: 'Apri la locandina a schermo intero' }))
    fireEvent.keyDown(screen.getByRole('button', { name: 'Chiudi la locandina' }), { key: 'ArrowRight' })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('senza locandina mostra il segnaposto', () => {
    setupDetail({ event: first })
    expect(screen.getByText('non disponibile')).toBeInTheDocument()
  })

  it('non offre link per aprire o scaricare la locandina', () => {
    setupDetail()
    expect(screen.queryByRole('link', { name: /locandina/i })).not.toBeInTheDocument()
  })

  it('offre solo la condivisione', () => {
    setupDetail()
    expect(screen.getByRole('button', { name: 'Condividi' })).toBeInTheDocument()
    expect(screen.queryByText('Calendario')).not.toBeInTheDocument()
    expect(screen.queryByText('Mappa')).not.toBeInTheDocument()
  })

  it('fuori dalla lista della zona non mostra la posizione e disabilita le frecce', () => {
    setupDetail({ sameDayEvents: [] })
    expect(screen.queryByText(/di \d/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /precedente/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /successiva/i })).toBeDisabled()
  })

  it('nasconde le distanze quando assenti', () => {
    setupDetail({ event: first })
    expect(screen.queryByText(/km$/)).not.toBeInTheDocument()
  })

  it('le frecce selezionano l\'evento precedente e successivo', () => {
    const onSelect = setupDetail()
    fireEvent.click(screen.getByRole('button', { name: /precedente/i }))
    expect(onSelect).toHaveBeenLastCalledWith(first)
    fireEvent.click(screen.getByRole('button', { name: /successiva/i }))
    expect(onSelect).toHaveBeenLastCalledWith(third)
  })

  it('supporta i tasti freccia', () => {
    const onSelect = setupDetail()
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith(third)
  })

  it('disabilita le frecce al primo e all\'ultimo evento', () => {
    setupDetail({ event: first })
    expect(screen.getByRole('button', { name: /precedente/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /successiva/i })).toBeEnabled()
  })

  it('mostra un messaggio se l\'evento non esiste', () => {
    setupDetail({ event: undefined })
    expect(screen.getByText(/Tapasciata non trovata/)).toBeInTheDocument()
  })
})
