import { eventPath } from '../utils/eventPath'
import { zonePath } from '../utils/zonePath'
// eslint-disable-next-line import/no-relative-packages
const sitemap = require('../../scripts/sitemap')

describe('sitemap', () => {
  it('eventPath degli script coincide con quello dell\'app', () => {
    const cases = [
      { id: 1, title: 'Straroncola' },
      { id: 2, title: 'Corsa all\'alba – Cernobbio 2026' },
      { id: 3, title: 'Città più Bella è!' },
      { id: 4, title: '***' },
    ]
    cases.forEach(e => expect(sitemap.eventPath(e)).toBe(eventPath(e)))
  })

  it('include pagine statiche ed eventi con lastmod', () => {
    const xml: string = sitemap.buildSitemap([{ id: 7, title: 'A & B', updatedAt: '2026-09-20T10:00:00+00:00' }])
    expect(xml).toContain('<loc>https://tapasciate.it/</loc>')
    expect(xml).toContain('<loc>https://tapasciate.it/info.html</loc>')
    expect(xml).toContain('<loc>https://tapasciate.it/evento/7-a-b</loc>')
    expect(xml).toContain('<lastmod>2026-09-20</lastmod>')
  })

  it('zonePaths coincide con zonePath dell\'app', () => {
    const cases = [
      { region: 'Friuli-Venezia Giulia', province: 'GO', provinceName: 'Gorizia' },
      { region: "Valle d'Aosta", province: 'AO', provinceName: 'Aosta' },
      { region: 'Lombardia', province: 'MB', provinceName: 'Monza e della Brianza' },
    ]
    for (const c of cases) {
      const paths: string[] = sitemap.zonePaths([c])
      expect(paths).toContain(zonePath({ kind: 'region', region: c.region }))
      expect(paths).toContain(zonePath({ kind: 'province', region: c.region, province: c.province, provinceName: c.provinceName }))
    }
  })

  it('include regioni e province una sola volta', () => {
    const xml: string = sitemap.buildSitemap([
      { id: 1, title: 'A', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' },
      { id: 2, title: 'B', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' },
      { id: 3, title: 'C', region: 'Lazio', province: 'RM', provinceName: null },
    ])
    expect(xml.match(/<loc>https:\/\/tapasciate.it\/lombardia<\/loc>/g)).toHaveLength(1)
    expect(xml).toContain('<loc>https://tapasciate.it/lombardia/bergamo</loc>')
    expect(xml).toContain('<loc>https://tapasciate.it/lazio/rm</loc>')
  })
})
