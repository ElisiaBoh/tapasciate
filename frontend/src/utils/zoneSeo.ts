import { SITE_URL, setCanonical, setMeta } from './eventSeo'
import { zonePath } from './zonePath'
import { zoneArea, zoneTitle } from './zones'
import type { Zone } from '../types'

export function zoneDescription(zone: Zone, count: number): string {
  const events = count === 1 ? '1 manifestazione podistica non competitiva' : `${count} manifestazioni podistiche non competitive`
  return `Il calendario delle tapasciate ${zoneArea(zone)}: ${events} in programma, con date, percorsi e locandine.`
}

export function applyZoneSeo(zone: Zone, count: number): () => void {
  const url = SITE_URL + zonePath(zone)
  const title = `${zoneTitle(zone)} — Tapasciate.it`
  const description = zoneDescription(zone, count)

  const previousTitle = document.title
  document.title = title

  const restores = [
    setCanonical(url),
    setMeta('name', 'description', description),
    setMeta('property', 'og:url', url),
    setMeta('property', 'og:title', title),
    setMeta('property', 'og:description', description),
    setMeta('name', 'twitter:title', title),
    setMeta('name', 'twitter:description', description),
  ]

  return () => {
    document.title = previousTitle
    restores.forEach(restore => restore())
  }
}
