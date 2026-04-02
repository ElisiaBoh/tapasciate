import { formatDate } from '../utils/formatDate'

describe('formatDate', () => {
  it('formatta correttamente un mercoledì', () => {
    expect(formatDate('2026-04-01')).toBe('Mercoledì 1 Aprile')
  })

  it('formatta correttamente una domenica', () => {
    expect(formatDate('2026-04-05')).toBe('Domenica 5 Aprile')
  })

  it('formatta correttamente gennaio', () => {
    expect(formatDate('2026-01-01')).toBe('Giovedì 1 Gennaio')
  })

  it('formatta correttamente dicembre', () => {
    expect(formatDate('2026-12-25')).toBe('Venerdì 25 Dicembre')
  })

  it('gestisce correttamente giorni con zero iniziale nella stringa', () => {
    expect(formatDate('2026-03-08')).toBe('Domenica 8 Marzo')
  })
})
