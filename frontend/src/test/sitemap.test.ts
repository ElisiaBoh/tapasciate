import { eventPath } from '../utils/eventPath'
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
})
