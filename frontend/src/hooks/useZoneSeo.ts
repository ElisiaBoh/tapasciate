import { useEffect } from 'react'
import { applyNoIndex } from '../utils/eventSeo'
import { applyZoneSeo } from '../utils/zoneSeo'
import type { Zone } from '../types'

export function useZoneSeo(zone: Zone | null, eventCount: number, notFound: boolean): void {
  useEffect(() => {
    if (notFound) return applyNoIndex()
  }, [notFound])

  useEffect(() => {
    if (zone) return applyZoneSeo(zone, eventCount)
  }, [zone, eventCount])
}
