import { X, Filter } from 'lucide-react';

export function FilterPanel({ filters, onFilterChange, onReset, filterFields }) {

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <Filter size={18} />
        <span>Filtres dynamiques</span>
        <button className="btn-reset" onClick={onReset} title="Réinitialiser">
          <X size={16} /> Réinitialiser
        </button>
      </div>
      <div className="filter-grid filter-grid-main">
        <div className="filter-group filter-group-date">
          <label>Date à partir de</label>
          <input
            type="date"
            value={filters.dateMin || ''}
            onChange={(e) => onFilterChange('dateMin', e.target.value)}
          />
        </div>
        <div className="filter-group filter-group-date">
          <label>Date jusqu&apos;à</label>
          <input
            type="date"
            value={filters.dateMax || ''}
            onChange={(e) => onFilterChange('dateMax', e.target.value)}
          />
        </div>
        {(filterFields || []).map(({ key, label, values }) => (
          <div key={key} className="filter-group">
            <label>{label}</label>
            <select
              value={filters[key] || ''}
              onChange={(e) => onFilterChange(key, e.target.value)}
            >
              <option value="">Tous</option>
              {values.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
