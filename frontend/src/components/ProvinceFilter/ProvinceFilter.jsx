import './ProvinceFilter.css'

export default function ProvinceFilter({ status, provinces, selectedProvince, onChange }) {
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
