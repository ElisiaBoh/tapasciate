import { shareEvent } from '../utils/eventActions'
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
