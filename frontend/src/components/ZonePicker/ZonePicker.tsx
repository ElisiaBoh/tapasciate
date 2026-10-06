import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { ITALY, sameZone } from '../../utils/zones'
import { zonePath } from '../../utils/zonePath'
import Icon from '../Icon/Icon'
import Tile from '../Tile/Tile'
import type { RegionEntry, Zone } from '../../types'
import './ZonePicker.css'

interface Props {
  catalog: RegionEntry[]
  // Zona attuale (evidenziata); null se l'URL non corrisponde a nessuna zona
  current: Zone | null
  onSelect: (zone: Zone) => void
  onClose: () => void
}

function ZoneOption({ zone, label, count, current, className, onSelect }: {
  zone: Zone
  label: string
  count: number
  current: Zone | null
  className: string
  onSelect: (zone: Zone) => void
}) {
  const selected = current !== null && sameZone(zone, current)
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onSelect(zone)
  }
  return (
    <a href={zonePath(zone)} onClick={onClick} aria-current={selected ? 'true' : undefined}
      className={`${className}${selected ? ' zp-on' : ''}`}>
      <span className="zp-label">{label}</span>
      <span className="zp-count">{count}</span>
      {selected && <Icon name="check" size={18} />}
    </a>
  )
}

export default function ZonePicker({ catalog, current, onSelect, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const currentRegion = current && current.kind !== 'italy' ? current.region : null
  const [openRegion, setOpenRegion] = useState<string | null>(currentRegion)
  const total = catalog.reduce((sum, r) => sum + r.count, 0)

  // Focus sul pulsante di chiusura all'apertura, restituito a chi ha aperto alla chiusura; pagina sotto bloccata
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !dialogRef.current) return
    // Il Tab resta dentro la finestra
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="zp-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="zp-dialog" role="dialog" aria-modal="true" aria-labelledby="zp-title"
        ref={dialogRef} onKeyDown={onKeyDown}>
        <div className="zp-head">
          <h2 id="zp-title">Scegli la zona</h2>
          <button type="button" className="zp-close" aria-label="Chiudi" ref={closeRef} onClick={onClose}>
            <Tile icon="close" />
          </button>
        </div>

        <div className="zp-list">
          <div className="zp-row zp-near" aria-disabled="true">
            <Icon name="pin" size={20} />
            <span className="zp-label">Vicino a me</span>
            <span className="zp-soon">presto</span>
          </div>

          <ZoneOption zone={ITALY} label="Tutta Italia" count={total} current={current}
            className="zp-row" onSelect={onSelect} />

          {catalog.map(region => {
            const open = openRegion === region.name
            const panelId = `zp-region-${region.name.replace(/\W+/g, '-')}`
            return (
              <div key={region.name}>
                <button type="button" className={`zp-region${open ? ' zp-region--open' : ''}`}
                  aria-expanded={open} aria-controls={panelId}
                  onClick={() => setOpenRegion(open ? null : region.name)}>
                  <span className="zp-label">{region.name}</span>
                  <span className="zp-count">{region.count}</span>
                  <Tile icon={open ? 'chevron-up' : 'chevron-down'} />
                </button>
                {open && (
                  <div id={panelId} className="zp-provinces">
                    <ZoneOption zone={{ kind: 'region', region: region.name }} label={`Tutta la ${region.name}`}
                      count={region.count} current={current} className="zp-opt" onSelect={onSelect} />
                    {region.provinces.map(p => (
                      <ZoneOption key={p.code}
                        zone={{ kind: 'province', region: region.name, province: p.code, provinceName: p.name }}
                        label={p.name} count={p.count} current={current} className="zp-opt" onSelect={onSelect} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
