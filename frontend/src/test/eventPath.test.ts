import { eventPath, parseEventId } from '../utils/eventPath'

describe('eventPath', () => {
  it('costruisce il path con id e slug del titolo', () => {
    expect(eventPath({ id: 42, title: 'Tapasciata dei Colli' })).toBe('/evento/42-tapasciata-dei-colli')
  })

  it('rimuove accenti e caratteri speciali', () => {
    expect(eventPath({ id: 7, title: "52ª Sgambada de Lònguel – L'Acqua" })).toBe('/evento/7-52-sgambada-de-longuel-l-acqua')
  })

  it('usa solo l\'id se il titolo non produce uno slug', () => {
    expect(eventPath({ id: 3, title: '°°°' })).toBe('/evento/3')
  })
})

describe('parseEventId', () => {
  it('estrae l\'id dal path con slug', () => {
    expect(parseEventId('/evento/42-tapasciata-dei-colli')).toBe(42)
  })

  it('estrae l\'id dal path senza slug o con slash finale', () => {
    expect(parseEventId('/evento/42')).toBe(42)
    expect(parseEventId('/evento/42-colli/')).toBe(42)
  })

  it('restituisce null per path che non sono di un evento', () => {
    expect(parseEventId('/')).toBeNull()
    expect(parseEventId('/evento/')).toBeNull()
    expect(parseEventId('/evento/abc')).toBeNull()
    expect(parseEventId('/info.html')).toBeNull()
  })
})
