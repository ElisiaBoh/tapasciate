import { applyZoneSeo, zoneDescription } from '../utils/zoneSeo'
import type { Zone } from '../types'

const bergamo: Zone = { kind: 'province', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' }
const attr = (selector: string, name: string) => document.head.querySelector(selector)?.getAttribute(name)

beforeEach(() => {
  document.head.innerHTML = `
    <meta name="description" content="home">
    <link rel="canonical" href="https://tapasciate.it/">
    <meta property="og:url" content="https://tapasciate.it/">
  `
  document.title = 'Home'
})

describe('applyZoneSeo', () => {
  it('imposta title, descrizione e canonical della zona', () => {
    applyZoneSeo(bergamo, 27)
    expect(document.title).toBe('Tapasciate in provincia di Bergamo — Tapasciate.it')
    expect(attr('link[rel="canonical"]', 'href')).toBe('https://tapasciate.it/lombardia/bergamo')
    expect(attr('meta[property="og:url"]', 'content')).toBe('https://tapasciate.it/lombardia/bergamo')
    expect(attr('meta[name="description"]', 'content')).toContain('27 manifestazioni podistiche non competitive')
  })

  it('il cleanup ripristina i valori della home', () => {
    const restore = applyZoneSeo({ kind: 'region', region: 'Veneto' }, 3)
    restore()
    expect(document.title).toBe('Home')
    expect(attr('link[rel="canonical"]', 'href')).toBe('https://tapasciate.it/')
    expect(attr('meta[name="description"]', 'content')).toBe('home')
    expect(document.head.querySelector('meta[property="og:title"]')).toBeNull()
  })
})

describe('zoneDescription', () => {
  it('al singolare con un solo evento', () => {
    expect(zoneDescription({ kind: 'region', region: 'Lazio' }, 1))
      .toBe('Il calendario delle tapasciate in Lazio: 1 manifestazione podistica non competitiva in programma, con date, percorsi e locandine.')
  })
})
