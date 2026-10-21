import { clearSavedZonePath, getSavedZonePath, initialRedirect, saveZonePath } from '../utils/savedZone'

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

describe('initialRedirect', () => {
  it('dalla home porta alla zona salvata', () => {
    expect(initialRedirect('/', '/lombardia/bergamo')).toBe('/lombardia/bergamo')
  })

  it('non reindirizza senza zona salvata o se la zona è tutta Italia', () => {
    expect(initialRedirect('/', null)).toBeNull()
    expect(initialRedirect('/', '/')).toBeNull()
  })

  it('non reindirizza chi apre un link a una zona o a un evento', () => {
    expect(initialRedirect('/veneto', '/lombardia/bergamo')).toBeNull()
    expect(initialRedirect('/evento/12-marcia', '/lombardia/bergamo')).toBeNull()
  })
})
