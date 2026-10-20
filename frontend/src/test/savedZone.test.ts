import { clearSavedZonePath, getSavedZonePath, saveZonePath } from '../utils/savedZone'

describe('savedZone', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()
  })

  it('salva, legge e cancella la zona', () => {
    expect(getSavedZonePath()).toBeNull()
    saveZonePath('/lombardia/bergamo')
    expect(getSavedZonePath()).toBe('/lombardia/bergamo')
    clearSavedZonePath()
    expect(getSavedZonePath()).toBeNull()
  })

  it('non lancia eccezioni se localStorage non è disponibile', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => saveZonePath('/veneto')).not.toThrow()
    expect(getSavedZonePath()).toBeNull()
  })
})
