import { Search } from 'lucide-react';

const defaultFilters = {
  search: '',
  risk: 'all',
  location: '',
  date: '',
  badgeStatus: 'all',
};

export function AdminFilters({ filterForm, filtersOpen, resultCount, setFiltersOpen }) {
  const activeFilterCount = [
    filterForm.values.search,
    filterForm.values.location,
    filterForm.values.date,
    filterForm.values.risk !== 'all',
    filterForm.values.badgeStatus !== 'all'
  ].filter(Boolean).length;

  return (
    <details className="filter-toolbar admin-filters" aria-label="Dashboard filters" open={filtersOpen} onToggle={(event) => setFiltersOpen(event.currentTarget.open)}>
      <summary>
        <Search aria-hidden="true" size={18} />
        Filters
        {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
      </summary>
      <div className="filter-toolbar-header">
        <strong>{resultCount} badges shown</strong>
        <button
          type="button"
          className="secondary-button small-button"
          onClick={() => filterForm.setValues(defaultFilters)}
          disabled={activeFilterCount === 0}
        >
          Clear filters
        </button>
      </div>
      <div className="filter-toolbar-fields">
        <label>Search<input value={filterForm.values.search} onChange={(event) => filterForm.setValues({ ...filterForm.values, search: event.target.value })} placeholder="Badge, vehicle registration, holder, location, date, risk" /></label>
        <label>Risk band<select value={filterForm.values.risk} onChange={(event) => filterForm.setValues({ ...filterForm.values, risk: event.target.value })}><option value="all">All</option><option value="normal">Normal</option><option value="monitor">Monitor</option><option value="review">Officer review</option><option value="high">High priority</option></select></label>
        <label>Location<input value={filterForm.values.location} onChange={(event) => filterForm.setValues({ ...filterForm.values, location: event.target.value })} placeholder="Town, street, zone" /></label>
        <label>Date<input type="date" value={filterForm.values.date} onChange={(event) => filterForm.setValues({ ...filterForm.values, date: event.target.value })} /></label>
        <label>Badge status<select value={filterForm.values.badgeStatus} onChange={(event) => filterForm.setValues({ ...filterForm.values, badgeStatus: event.target.value })}><option value="all">All</option><option value="valid">Valid</option><option value="under review">Under review</option><option value="expired">Expired</option><option value="suspended">Suspended</option><option value="stolen">Stolen</option></select></label>
      </div>
    </details>
  );
}
