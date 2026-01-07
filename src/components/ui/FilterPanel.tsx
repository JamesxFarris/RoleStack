import { Home, Building2, Wifi } from 'lucide-react';

export type WorkType = 'all' | 'remote' | 'hybrid' | 'onsite';

interface FilterPanelProps {
  selectedFilter: WorkType;
  onFilterChange: (filter: WorkType) => void;
}

const filters: { value: WorkType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Jobs', icon: null },
  { value: 'remote', label: 'Remote', icon: <Wifi size={16} /> },
  { value: 'hybrid', label: 'Hybrid', icon: <Building2 size={16} /> },
  { value: 'onsite', label: 'On-site', icon: <Home size={16} /> },
];

export function FilterPanel({ selectedFilter, onFilterChange }: FilterPanelProps) {
  return (
    <div className="filter-chips">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`filter-chip ${selectedFilter === filter.value ? 'active' : ''}`}
        >
          {filter.icon}
          {filter.label}
        </button>
      ))}
    </div>
  );
}
