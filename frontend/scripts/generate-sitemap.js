// Eseguito dopo `react-scripts build`: sovrascrive build/sitemap.xml aggiungendo le pagine evento.
// Se Supabase non risponde la build non fallisce: resta la sitemap statica di public/.

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { buildSitemap } = require('./sitemap')

// Stessi valori pubblici di src/supabaseClient.ts
const SUPABASE_URL = 'https://zwypodzchumtuitkhkta.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Yeo_ij8JWe7fVfqUw3VIfA_lvb5DO3t'

const OUT = path.join(__dirname, '..', 'build', 'sitemap.xml')

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('events')
    .select('id, name, updated_at')
    .is('removed_at', null)
    .gte('date', today)
    .order('date', { ascending: true })
  if (error) throw error

  const events = data.map(e => ({ id: e.id, title: e.name, updatedAt: e.updated_at }))
  fs.writeFileSync(OUT, buildSitemap(events))
  console.log(`Sitemap: ${events.length} eventi → ${OUT}`)
}

main().catch(err => {
  console.warn(`Sitemap non generata, resta quella statica: ${err.message ?? err}`)
})
