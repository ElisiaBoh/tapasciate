import { isViewerHistoryState, posterAlt, posterSlides, withViewerHistoryState } from '../utils/poster'
import type { Event } from '../types'

const event: Event = {
  id: 1,
  title: 'Tapasciata dei Colli',
  date: '2030-06-15',
  location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
  posterPages: [
    { url: 'https://example.com/p1.webp', width: 1200, height: 1697 },
    { url: 'https://example.com/p2.webp', width: 1200, height: 850 },
  ],
  organizer: null,
  distances: [],
}

describe('posterAlt', () => {
  it('numera le pagine solo se sono più di una', () => {
    expect(posterAlt('Colli', 0, 1)).toBe('Locandina Colli')
    expect(posterAlt('Colli', 1, 3)).toBe('Locandina Colli, pagina 2 di 3')
  })
})

describe('posterSlides', () => {
  it('crea una slide per pagina con dimensioni e placeholder', () => {
    expect(posterSlides(event)).toEqual([
      { src: 'https://example.com/p1.webp', msrc: 'https://example.com/p1.webp', width: 1200, height: 1697, alt: 'Locandina Tapasciata dei Colli, pagina 1 di 2' },
      { src: 'https://example.com/p2.webp', msrc: 'https://example.com/p2.webp', width: 1200, height: 850, alt: 'Locandina Tapasciata dei Colli, pagina 2 di 2' },
    ])
  })
})

describe('viewer history state', () => {
  it('aggiunge il segnale del viewer mantenendo lo stato della pagina', () => {
    const state = withViewerHistoryState({ listPath: '/lombardia' })
    expect(state).toEqual({ listPath: '/lombardia', posterViewer: true })
    expect(isViewerHistoryState(state)).toBe(true)
  })

  it('riconosce gli stati senza viewer', () => {
    expect(withViewerHistoryState(null)).toEqual({ posterViewer: true })
    expect(isViewerHistoryState(null)).toBe(false)
    expect(isViewerHistoryState({ listPath: '/' })).toBe(false)
  })
})
