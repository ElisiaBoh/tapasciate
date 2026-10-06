// Logica pura della sitemap, separata dall'I/O per poterla testare con Jest.
// eventPath deve restare identico a src/utils/eventPath.ts (lo verifica src/test/sitemap.test.ts):
// CRA non permette a src/ di importare file esterni, quindi la funzione è duplicata.

const SITE_URL = 'https://tapasciate.it'

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/info.html', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy.html', changefreq: 'yearly', priority: '0.3' },
]

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function eventPath(event) {
  const slug = slugify(event.title)
  return slug ? `/evento/${event.id}-${slug}` : `/evento/${event.id}`
}

// Must match zonePath in src/utils/zonePath.ts (checked by src/test/sitemap.test.ts)
function zonePaths(events) {
  const paths = new Set()
  for (const e of events) {
    const region = slugify(e.region)
    paths.add(`/${region}`)
    paths.add(`/${region}/${slugify(e.provinceName || e.province)}`)
  }
  return Array.from(paths).sort()
}

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// events: [{ id, title, updatedAt }] con updatedAt ISO (può mancare)
function buildSitemap(events) {
  const urls = [
    ...STATIC_PAGES.map(p =>
      `  <url>\n    <loc>${SITE_URL}${p.path}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`),
    ...zonePaths(events.filter(e => e.region)).map(path =>
      `  <url>\n    <loc>${escapeXml(SITE_URL + path)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`),
    ...events.map(e => {
      const lastmod = e.updatedAt ? `\n    <lastmod>${e.updatedAt.slice(0, 10)}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(SITE_URL + eventPath(e))}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    }),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

module.exports = { eventPath, zonePaths, buildSitemap }
