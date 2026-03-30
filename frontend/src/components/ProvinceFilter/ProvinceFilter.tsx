import type { Province, Status } from '../../types'
import './ProvinceFilter.css'

interface Props {
  status: Status
  provinces: Province[]
  selectedProvince: string
  onChange: (province: string) => void
}

export default function ProvinceFilter({ status, provinces, selectedProvince, onChange }: Props) {
  return (
    <div className="filters">
      <div className="filters-content">
        {status === 'loading' ? (
          <div className="skeleton skeleton-filter" />
        ) : (
          <select
            value={selectedProvince}
            onChange={(e) => onChange(e.target.value)}
            className="province-filter"
            aria-label="Filtra per provincia"
          >
            <option value="">Tutte le province</option>
            {provinces.map(province => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
