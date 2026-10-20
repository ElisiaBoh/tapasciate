import { periodSummary } from '../../utils/period'
import { zoneTitle } from '../../utils/zones'
import Skeleton from '../Skeleton/Skeleton'
import type { Period, Zone } from '../../types'
import './ZoneTitle.css'

interface Props {
  loading: boolean
  zone: Zone | null
  period: Period
  total: number
  periodCount: number
}

export default function ZoneTitle({ loading, zone, period, total, periodCount }: Props) {
  return (
    <div className="zone-title">
      <div className="zone-title-content">
        {loading ? (
          <>
            <Skeleton className="skeleton-zone-title" />
            <Skeleton className="skeleton-zone-subtitle" />
          </>
        ) : (
          <>
            <h1>{zone ? zoneTitle(zone) : 'Zona non trovata'}</h1>
            {zone && <p>{periodSummary(period, total, periodCount)}</p>}
          </>
        )}
      </div>
    </div>
  )
}
