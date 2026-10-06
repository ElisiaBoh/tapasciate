import { inPeriod, periodRange } from '../utils/period'

// 2026-10-07 è un mercoledì, 2026-10-11 una domenica
const wednesday = new Date(2026, 9, 7)
const sunday = new Date(2026, 9, 11)

describe('periodRange', () => {
  it('"tutte" parte da oggi senza fine', () => {
    expect(periodRange('all', wednesday)).toEqual({ from: '2026-10-07', to: null })
  })

  it('"questa settimana" va da oggi a domenica', () => {
    expect(periodRange('this-week', wednesday)).toEqual({ from: '2026-10-07', to: '2026-10-11' })
    expect(periodRange('this-week', sunday)).toEqual({ from: '2026-10-11', to: '2026-10-11' })
  })

  it('"prossima settimana" va da lunedì a domenica successivi', () => {
    expect(periodRange('next-week', wednesday)).toEqual({ from: '2026-10-12', to: '2026-10-18' })
    expect(periodRange('next-week', sunday)).toEqual({ from: '2026-10-12', to: '2026-10-18' })
  })

  it('attraversa il cambio di mese', () => {
    expect(periodRange('next-week', new Date(2026, 9, 28))).toEqual({ from: '2026-11-02', to: '2026-11-08' })
  })
})

describe('inPeriod', () => {
  it('include gli estremi', () => {
    expect(inPeriod('2026-10-11', 'this-week', wednesday)).toBe(true)
    expect(inPeriod('2026-10-12', 'this-week', wednesday)).toBe(false)
    expect(inPeriod('2026-10-06', 'all', wednesday)).toBe(false)
    expect(inPeriod('2030-01-01', 'all', wednesday)).toBe(true)
  })
})
