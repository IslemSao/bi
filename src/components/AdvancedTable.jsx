import { useMemo, useState } from 'react';
import { ArrowUpDown, Download } from 'lucide-react';

const TEXT = 'text';
const NUMBER = 'number';
const DATE = 'date';

function defaultGetType(col) {
  return col.type || TEXT;
}

function applyColumnFilter(value, filter, type) {
  if (!filter) return true;
  if (type === TEXT) {
    const mode = filter.mode || 'contains';
    const search = (filter.value || '').toLowerCase();
    if (!search) return true;
    const v = (value == null ? '' : String(value)).toLowerCase();
    if (mode === 'startsWith') return v.startsWith(search);
    return v.includes(search);
  }
  if (type === NUMBER) {
    const v = typeof value === 'number' ? value : (value == null || value === '' ? null : Number(value));
    if (v == null || Number.isNaN(v)) return false;
    if (filter.min !== '' && filter.min != null && v < Number(filter.min)) return false;
    if (filter.max !== '' && filter.max != null && v > Number(filter.max)) return false;
    return true;
  }
  if (type === DATE) {
    if (!value) return false;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;
    if (filter.from && d < new Date(filter.from)) return false;
    if (filter.to && d > new Date(filter.to + 'T23:59:59')) return false;
    return true;
  }
  return true;
}

function sortRows(rows, sortConfig, columns) {
  if (!sortConfig.length) return rows;
  const colByKey = new Map(columns.map((c) => [c.key, c]));
  const getType = (key) => defaultGetType(colByKey.get(key) || {});
  return [...rows].sort((a, b) => {
    for (const s of sortConfig) {
      const type = getType(s.key);
      const va = a[s.key];
      const vb = b[s.key];
      let cmp = 0;
      if (type === NUMBER) {
        const na = va == null ? 0 : Number(va);
        const nb = vb == null ? 0 : Number(vb);
        cmp = na - nb;
      } else if (type === DATE) {
        const da = new Date(va);
        const db = new Date(vb);
        cmp = da.getTime() - db.getTime();
      } else {
        cmp = String(va ?? '').localeCompare(String(vb ?? ''));
      }
      if (cmp !== 0) return s.direction === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

function exportToCsv(columns, rows, filename) {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => {
      let v = row[c.key];
      if (v == null) v = '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(',')
  );
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AdvancedTable({
  data,
  columns,
  defaultSort = [],
  pageSizeOptions = [10, 25, 50],
  initialPageSize = 10,
  rowClassName,
  title,
  exportFileName,
}) {
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);

  const colByKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);

  const filteredAndSorted = useMemo(() => {
    const filtered = (data || []).filter((row) =>
      columns.every((col) => {
        const type = defaultGetType(col);
        const f = filters[col.key];
        if (!f) return true;
        return applyColumnFilter(row[col.key], f, type);
      })
    );
    return sortRows(filtered, sortConfig, columns);
  }, [data, columns, filters, sortConfig]);

  const pageCount = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filteredAndSorted.slice(start, end);

  const toggleSort = (key, shiftKey) => {
    setPage(1);
    setSortConfig((prev) => {
      const existingIndex = prev.findIndex((s) => s.key === key);
      let next;
      if (existingIndex === -1) {
        next = [...(shiftKey ? prev : []), { key, direction: 'asc' }];
      } else {
        const existing = prev[existingIndex];
        if (existing.direction === 'asc') {
          next = [...prev];
          next[existingIndex] = { ...existing, direction: 'desc' };
        } else {
          next = prev.filter((s) => s.key !== key);
        }
      }
      return next;
    });
  };

  const handleFilterChange = (key, updater) => {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...updater },
    }));
  };

  const renderSortIndicator = (key) => {
    const idx = sortConfig.findIndex((s) => s.key === key);
    if (idx === -1) return null;
    const s = sortConfig[idx];
    return (
      <span className="sort-indicator">
        {s.direction === 'asc' ? '▲' : '▼'}
        {sortConfig.length > 1 ? <span className="sort-rank">{idx + 1}</span> : null}
      </span>
    );
  };

  return (
    <div className="advanced-table-wrap">
      <div className="advanced-table-header">
        {title && <h3>{title}</h3>}
        <div className="advanced-table-header-actions">
          <span className="rows-count">{filteredAndSorted.length} lignes</span>
          {exportFileName && (
            <button
              className="btn btn-outline btn-export"
              onClick={() => exportToCsv(columns, filteredAndSorted, exportFileName)}
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={c.headerClassName}
                  onClick={(e) => toggleSort(c.key, e.shiftKey)}
                >
                  <span className="th-content">
                    {c.label}
                    <ArrowUpDown size={12} className="sort-icon" />
                    {renderSortIndicator(c.key)}
                  </span>
                </th>
              ))}
            </tr>
            <tr className="filters-row">
              {columns.map((c) => {
                const type = defaultGetType(c);
                const f = filters[c.key] || {};
                if (type === TEXT) {
                  return (
                    <th key={c.key}>
                      <div className="filter-text-cell">
                        <select
                          value={f.mode || 'contains'}
                          onChange={(e) =>
                            handleFilterChange(c.key, { mode: e.target.value })
                          }
                        >
                          <option value="contains">contient</option>
                          <option value="startsWith">commence par</option>
                        </select>
                        <input
                          type="text"
                          value={f.value || ''}
                          onChange={(e) =>
                            handleFilterChange(c.key, { value: e.target.value })
                          }
                          placeholder="Filtrer..."
                        />
                      </div>
                    </th>
                  );
                }
                if (type === NUMBER) {
                  return (
                    <th key={c.key}>
                      <div className="filter-number-cell">
                        <input
                          type="number"
                          value={f.min ?? ''}
                          onChange={(e) =>
                            handleFilterChange(c.key, { min: e.target.value })
                          }
                          placeholder="Min"
                        />
                        <input
                          type="number"
                          value={f.max ?? ''}
                          onChange={(e) =>
                            handleFilterChange(c.key, { max: e.target.value })
                          }
                          placeholder="Max"
                        />
                      </div>
                    </th>
                  );
                }
                if (type === DATE) {
                  return (
                    <th key={c.key}>
                      <div className="filter-date-cell">
                        <input
                          type="date"
                          value={f.from || ''}
                          onChange={(e) =>
                            handleFilterChange(c.key, { from: e.target.value })
                          }
                        />
                        <input
                          type="date"
                          value={f.to || ''}
                          onChange={(e) =>
                            handleFilterChange(c.key, { to: e.target.value })
                          }
                        />
                      </div>
                    </th>
                  );
                }
                return <th key={c.key} />;
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => (
              <tr
                key={idx}
                className={rowClassName ? rowClassName(row) : undefined}
              >
                {columns.map((c) => {
                  let v = row[c.key];
                  if (c.render) {
                    return (
                      <td key={c.key} className={c.className}>
                        {c.render(v, row)}
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className={c.className}>
                      {v != null && typeof v === 'number'
                        ? v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                        : v ?? ''}
                    </td>
                  );
                })}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  Aucune ligne ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination-bar">
        <div className="page-size">
          <span>Par page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPageSize(next);
              setPage(1);
            }}
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="page-controls">
          <button
            className="btn-outline page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage(1)}
          >
            «
          </button>
          <button
            className="btn-outline page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <span className="page-info">
            Page {currentPage} / {pageCount}
          </span>
          <button
            className="btn-outline page-btn"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            ›
          </button>
          <button
            className="btn-outline page-btn"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(pageCount)}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

export const ColumnTypes = { TEXT, NUMBER, DATE };

