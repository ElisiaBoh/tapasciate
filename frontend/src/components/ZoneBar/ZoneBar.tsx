import { PERIODS, periodPhrase } from '../../utils/period'
import { zoneName, zoneTitle } from '../../utils/zones'
import Skeleton from '../Skeleton/Skeleton'
import Tile from '../Tile/Tile'
import type { Period, Zone } from '../../types'
import './ZoneBar.css'

interface Props {
  loading: boolean
  zone: Zone | null
  period: Period
  onPeriodChange: (period: Period) => void
  onOpenPicker: () => void
  total: number
  periodCount: number
}

function subtitle(period: Period, total: number, periodCount: number): string {
  const phrase = periodPhrase(period)
  return phrase ? `${periodCount} ${phrase} · ${total} in calendario` : `${total} in calendario`
}

export default function ZoneBar({ loading, zone, period, onPeriodChange, onOpenPicker, total, periodCount }: Props) {
  const name = zone ? zoneName(zone) : 'Scegli la zona'
  return (
    <div className="zone-bar">
      <div className="zone-bar-content">
        <div className="zone-bar-controls">
          <button type="button" className="zone-button" onClick={onOpenPicker} disabled={loading}
            aria-haspopup="dialog" aria-label={zone ? `Cambia zona, attuale: ${name}` : 'Scegli la zona'}>
            {loading ? <Skeleton className="skeleton-zone-name" /> : <span className="zone-button-label">{name}</span>}
            <Tile icon="chevron-down" />
          </button>
          {zone && (
            <div className="period" role="group" aria-label="Periodo">
              {PERIODS.map(p => (
                <button key={p.value} type="button" aria-pressed={p.value === period}
                  className={`period-button${p.value === period ? ' period-button--on' : ''}`}
                  onClick={() => onPeriodChange(p.value)}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="zone-bar-title">
          {loading ? (
            <>
              <Skeleton className="skeleton-zone-title" />
              <Skeleton className="skeleton-zone-subtitle" />
            </>
          ) : (
            <>
              <h1>{zone ? zoneTitle(zone) : 'Zona non trovata'}</h1>
              {zone && <p>{subtitle(period, total, periodCount)}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
