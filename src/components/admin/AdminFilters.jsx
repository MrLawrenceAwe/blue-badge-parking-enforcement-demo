import { Search } from 'lucide-react';

export function AdminFilters({ filters, filtersOpen, setFiltersOpen }) {
  return (
    <details className="toolbar admin-filters" aria-label="Dashboard filters" open={filtersOpen} onToggle={(event) => setFiltersOpen(event.currentTarget.open)}>
      <summary><Search aria-hidden="true" size={18} /> Filters</summary>
      <div className="toolbar-fields">
        <label>Search<input value={filters.values.search} onChange={(event) => filters.setValues({ ...filters.values, search: event.target.value })} placeholder="Badge, VRM, holder, location, date, risk" /></label>
        <label>Risk level<select value={filters.values.risk} onChange={(event) => filters.setValues({ ...filters.values, risk: event.target.value })}><option value="all">All</option><option value="normal">Normal</option><option value="monitor">Monitor</option><option value="review">Officer review</option><option value="high">High priority</option></select></label>
        <label>Location<input value={filters.values.location} onChange={(event) => filters.setValues({ ...filters.values, location: event.target.value })} placeholder="Town, street, zone" /></label>
        <label>Date<input type="date" value={filters.values.date} onChange={(event) => filters.setValues({ ...filters.values, date: event.target.value })} /></label>
        <label>Badge status<select value={filters.values.badgeStatus} onChange={(event) => filters.setValues({ ...filters.values, badgeStatus: event.target.value })}><option value="all">All</option><option value="valid">Valid</option><option value="under review">Under review</option><option value="expired">Expired</option><option value="suspended">Suspended</option><option value="stolen">Stolen</option></select></label>
      </div>
    </details>
  );
}
