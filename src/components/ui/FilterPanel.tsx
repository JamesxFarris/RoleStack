import { X } from 'lucide-react';

export type WorkType = 'all' | 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'all' | 'full-time' | 'part-time' | 'contract';
export type SalaryRange = 'all' | '0-50k' | '50k-100k' | '100k-150k' | '150k+';
export type Seniority = 'all' | 'entry' | 'mid' | 'senior';

export interface Filters {
  workType: WorkType;
  employmentType: EmploymentType;
  salaryRange: SalaryRange;
  seniority: Seniority;
}

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const workTypeOptions: { value: WorkType; label: string }[] = [
  { value: 'all', label: 'All Locations' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

const employmentTypeOptions: { value: EmploymentType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

const salaryRangeOptions: { value: SalaryRange; label: string }[] = [
  { value: 'all', label: 'Any Salary' },
  { value: '0-50k', label: '$0 - $50k' },
  { value: '50k-100k', label: '$50k - $100k' },
  { value: '100k-150k', label: '$100k - $150k' },
  { value: '150k+', label: '$150k+' },
];

const seniorityOptions: { value: Seniority; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
];

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const activeFiltersCount = [
    filters.workType !== 'all',
    filters.employmentType !== 'all',
    filters.salaryRange !== 'all',
    filters.seniority !== 'all',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onFilterChange({
      workType: 'all',
      employmentType: 'all',
      salaryRange: 'all',
      seniority: 'all',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Location Filter */}
      <select
        value={filters.workType}
        onChange={(e) => onFilterChange({ ...filters, workType: e.target.value as WorkType })}
        className="select"
        aria-label="Filter by location"
      >
        {workTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Employment Type Filter */}
      <select
        value={filters.employmentType}
        onChange={(e) => onFilterChange({ ...filters, employmentType: e.target.value as EmploymentType })}
        className="select"
        aria-label="Filter by employment type"
      >
        {employmentTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Salary Range Filter */}
      <select
        value={filters.salaryRange}
        onChange={(e) => onFilterChange({ ...filters, salaryRange: e.target.value as SalaryRange })}
        className="select"
        aria-label="Filter by salary range"
      >
        {salaryRangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Seniority Filter */}
      <select
        value={filters.seniority}
        onChange={(e) => onFilterChange({ ...filters, seniority: e.target.value as Seniority })}
        className="select"
        aria-label="Filter by seniority level"
      >
        {seniorityOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Clear filters button */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors ml-2"
        >
          <X size={16} />
          Clear ({activeFiltersCount})
        </button>
      )}
    </div>
  );
}
