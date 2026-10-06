import { buildCatalog, inZone, provinceZoneOf, sameZone, zoneName, zonePlace, zoneTitle, ITALY } from '../utils/zones'
import type { Event, Zone } from '../types'

function makeEvent(city: string, province: string, provinceName: string | null, region: string): Event {
  return {
    id: 1,
    title: 'Evento',
    date: '2030-06-15',
    location: { city, province, province_name: provinceName, region },
    posterPages: [],
    source: null,
    distances: [],
  }
}

const bergamo = makeEvent('Bergamo', 'BG', 'Bergamo', 'Lombardia')
const dalmine = makeEvent('Dalmine', 'BG', 'Bergamo', 'Lombardia')
const como = makeEvent('Como', 'CO', 'Como', 'Lombardia')
const schio = makeEvent('Schio', 'VI', 'Vicenza', 'Veneto')
const roma = makeEvent('Roma', 'RM', null, 'Lazio')

const lombardia: Zone = { kind: 'region', region: 'Lombardia' }
const provBG: Zone = { kind: 'province', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' }

describe('buildCatalog', () => {
  it('conta gli eventi per regione e provincia', () => {
    const catalog = buildCatalog([bergamo, dalmine, como, schio])
    expect(catalog).toEqual([
      { name: 'Lombardia', count: 3, provinces: [{ code: 'BG', name: 'Bergamo', count: 2 }, { code: 'CO', name: 'Como', count: 1 }] },
      { name: 'Veneto', count: 1, provinces: [{ code: 'VI', name: 'Vicenza', count: 1 }] },
    ])
  })

  it('ordina le regioni per numero di eventi e poi per nome', () => {
    const catalog = buildCatalog([schio, roma, bergamo, dalmine])
    expect(catalog.map(r => r.name)).toEqual(['Lombardia', 'Lazio', 'Veneto'])
  })

  it('ordina le province alfabeticamente e usa la sigla se manca il nome', () => {
    const catalog = buildCatalog([como, bergamo, roma])
    expect(catalog.find(r => r.name === 'Lombardia')!.provinces.map(p => p.name)).toEqual(['Bergamo', 'Como'])
    expect(catalog.find(r => r.name === 'Lazio')!.provinces[0].name).toBe('RM')
  })
})

describe('inZone', () => {
  it('filtra per Italia, regione e provincia', () => {
    expect(inZone(schio, ITALY)).toBe(true)
    expect(inZone(como, lombardia)).toBe(true)
    expect(inZone(schio, lombardia)).toBe(false)
    expect(inZone(dalmine, provBG)).toBe(true)
    expect(inZone(como, provBG)).toBe(false)
  })
})

describe('provinceZoneOf / sameZone', () => {
  it('ricava la provincia di un evento', () => {
    expect(provinceZoneOf(dalmine)).toEqual(provBG)
  })

  it('confronta le zone', () => {
    expect(sameZone(ITALY, { kind: 'italy' })).toBe(true)
    expect(sameZone(lombardia, { kind: 'region', region: 'Lombardia' })).toBe(true)
    expect(sameZone(lombardia, provBG)).toBe(false)
    expect(sameZone(provBG, provinceZoneOf(como))).toBe(false)
  })
})

describe('testi della zona', () => {
  it('nome, titolo e complemento di luogo', () => {
    expect([zoneName(ITALY), zoneName(lombardia), zoneName(provBG)]).toEqual(['Tutta Italia', 'Lombardia', 'Bergamo'])
    expect(zoneTitle(ITALY)).toBe('Tapasciate in Italia')
    expect(zoneTitle(lombardia)).toBe('Tapasciate in Lombardia')
    expect(zoneTitle(provBG)).toBe('Tapasciate in provincia di Bergamo')
    expect([zonePlace(ITALY), zonePlace(lombardia), zonePlace(provBG)]).toEqual(['in Italia', 'in Lombardia', 'a Bergamo'])
  })
})
