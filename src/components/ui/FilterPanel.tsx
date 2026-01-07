import { Home, Building2, Wifi, Clock, Briefcase, DollarSign, X } from 'lucide-react';

export type WorkType = 'all' | 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'all' | 'full-time' | 'part-time' | 'contract';
export type SalaryRange = 'all' | '0-50k' | '50k-100k' | '100k-150k' | '150k+';

export interface Filters {
  workType: WorkType;
  employmentType: EmploymentType;
  salaryRange: SalaryRange;
}

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const workTypeOptions: { value: WorkType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Locations', icon: null },
  { value: 'remote', label: 'Remote', icon: <Wifi size={16} /> },
  { value: 'hybrid', label: 'Hybrid', icon: <Building2 size={16} /> },
  { value: 'onsite', label: 'On-site', icon: <Home size={16} /> },
];

const employmentTypeOptions: { value: EmploymentType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Types', icon: null },
  { value: 'full-time', label: 'Full-time', icon: <Briefcase size={16} /> },
  { value: 'part-time', label: 'Part-time', icon: <Clock size={16} /> },
  { value: 'contract', label: 'Contract', icon: <Clock size={16} /> },
];

const salaryRangeOptions: { value: SalaryRange; label: string }[] = [
  { value: 'all', label: 'Any Salary' },
  { value: '0-50k', label: '\$0 - \$50k' },
  { value: '50k-100k', label: '\$50k - \$100k' },
  { value: '100k-150k', label: '\$100k - \$150k' },
  { value: '150k+', label: '\$150k+' },
];

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const activeFiltersCount = [
    filters.workType !== 'all',
    filters.employmentType !== 'all',
    filters.salaryRange !== 'all',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onFilterChange({
      workType: 'all',
      employmentType: 'all',
      salaryRange: 'all',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter sections */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Work Type */}
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 px-4 sm:px-0">
            Location
          </h3>
          <div className="filter-chips">
            {workTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange({ ...filters, workType: option.value })}
                className={\`filter-chip \${filters.workType === option.value ? 'active' : ''}\`}
                aria-pressed={filters.workType === option.value}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employment Type */}
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 px-4 sm:px-0">
            Employment Type
          </h3>
          <div className="filter-chips">
            {employmentTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange({ ...filters, employmentType: option.value })}
                className={\`filter-chip \${filters.employmentType === option.value ? 'active' : ''}\`}
                aria-pressed={filters.employmentType === option.value}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 px-4 sm:px-0 flex items-center gap-1">
            <DollarSign size={14} />
            Salary Range
          </h3>
          <div className="filter-chips">
            {salaryRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange({ ...filters, salaryRange: option.value })}
                className={\`filter-chip \${filters.salaryRange === option.value ? 'active' : ''}\`}
                aria-pressed={filters.salaryRange === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear filters button */}
      {activeFiltersCount > 0 && (
        <div className="px-4 sm:px-0">
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={16} />
            Clear all filters ({activeFiltersCount})
          </button>
        </div>
      )}
    </div>
  );
}
