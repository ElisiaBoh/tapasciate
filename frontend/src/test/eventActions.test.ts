import { eventIcs, eventIcsFilename, eventMapsUrl, shareEvent } from '../utils/eventActions'
import type { Event } from '../types'

const event: Event = {
  id: 7,
  title: 'Marcia, della Valle; 2026',
  date: '2026-10-31',
  location: { city: 'Soncino', province: 'CR', province_name: 'Cremona', region: 'Lombardia' },
  posterPages: [],
  source: null,
  distances: ['8', '14'],
}

describe('eventIcs', () => {
  const ics = eventIcs(event, new Date('2026-10-06T10:20:30.000Z'))

  it('è un evento di un giorno intero', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20261031\r\n')
    expect(ics).toContain('DTEND;VALUE=DATE:20261101\r\n')
    expect(ics).toContain('DTSTAMP:20261006T102030Z\r\n')
    expect(ics).toContain('UID:evento-7@tapasciate.it\r\n')
  })

  it('fa l\'escape di virgole e punti e virgola', () => {
    expect(ics).toContain('SUMMARY:Marcia\\, della Valle\; 2026\r\n')
    expect(ics).toContain('LOCATION:Soncino (CR)\r\n')
    expect(ics).toContain('URL:https://tapasciate.it/evento/7-marcia-della-valle-2026\r\n')
  })

  it('nome del file dallo slug del titolo', () => {
    expect(eventIcsFilename(event)).toBe('marcia-della-valle-2026.ics')
  })
})

describe('eventMapsUrl', () => {
  it('cerca la località su Google Maps', () => {
    expect(eventMapsUrl(event)).toBe('https://www.google.com/maps/search/?api=1&query=Soncino%2C%20Cremona%2C%20Italia')
  })
})

describe('shareEvent', () => {
  const original = { share: navigator.share, clipboard: navigator.clipboard }
  afterEach(() => {
    Object.assign(navigator, original)
  })

  it('usa la condivisione nativa se disponibile', async () => {
    const share = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share })
    await expect(shareEvent(event)).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://tapasciate.it/evento/7-marcia-della-valle-2026' }))
  })

  it('altrimenti copia il link', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share: undefined, clipboard: { writeText } })
    await expect(shareEvent(event)).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://tapasciate.it/evento/7-marcia-della-valle-2026')
  })
})
