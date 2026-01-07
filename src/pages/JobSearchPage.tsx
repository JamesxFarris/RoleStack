import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/ui/SearchBar';
import { FilterPanel, type Filters } from '../components/ui/FilterPanel';
import { JobCard } from '../components/ui/JobCard';
import { JobCardSkeleton } from '../components/ui/JobCardSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { mockJobs } from '../data/jobs';

const defaultFilters: Filters = {
  workType: 'all',
  employmentType: 'all',
  salaryRange: 'all',
};

// Parse salary string to number for comparison
function parseSalary(salary?: string): number | null {
  if (!salary) return null;
  const match = salary.match(/\$?([\d,]+)/);
  if (!match) return null;
  return parseInt(match[1].replace(/,/g, ''), 10);
}

function matchesSalaryRange(salary: string | undefined, range: string): boolean {
  if (range === 'all') return true;
  const parsed = parseSalary(salary);
  if (parsed === null) return false;

  switch (range) {
    case '0-50k':
      return parsed < 50000;
    case '50k-100k':
      return parsed >= 50000 && parsed < 100000;
    case '100k-150k':
      return parsed >= 100000 && parsed < 150000;
    case '150k+':
      return parsed >= 150000;
    default:
      return true;
  }
}

export function JobSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state from URL params
  const [jobTitle, setJobTitle] = useState(() => searchParams.get('q') || '');
  const [location, setLocation] = useState(() => searchParams.get('location') || '');
  const [filters, setFilters] = useState<Filters>(() => ({
    workType: (searchParams.get('workType') as Filters['workType']) || 'all',
    employmentType: (searchParams.get('employmentType') as Filters['employmentType']) || 'all',
    salaryRange: (searchParams.get('salaryRange') as Filters['salaryRange']) || 'all',
  }));

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (jobTitle) params.set('q', jobTitle);
    if (location) params.set('location', location);
    if (filters.workType !== 'all') params.set('workType', filters.workType);
    if (filters.employmentType !== 'all') params.set('employmentType', filters.employmentType);
    if (filters.salaryRange !== 'all') params.set('salaryRange', filters.salaryRange);

    setSearchParams(params, { replace: true });
  }, [jobTitle, location, filters, setSearchParams]);

  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      // Work type filter
      if (filters.workType !== 'all' && job.workType !== filters.workType) {
        return false;
      }

      // Employment type filter
      if (filters.employmentType !== 'all' && job.employmentType !== filters.employmentType) {
        return false;
      }

      // Salary range filter
      if (!matchesSalaryRange(job.salary, filters.salaryRange)) {
        return false;
      }

      // Search filters
      const searchJobTitle = jobTitle.toLowerCase();
      const searchLocation = location.toLowerCase();

      if (searchJobTitle) {
        const matchesTitle =
          job.title.toLowerCase().includes(searchJobTitle) ||
          job.company.toLowerCase().includes(searchJobTitle);
        if (!matchesTitle) return false;
      }

      if (searchLocation) {
        const matchesLocation =
          job.location.toLowerCase().includes(searchLocation) ||
          (searchLocation.includes('remote') && job.workType === 'remote');
        if (!matchesLocation) return false;
      }

      return true;
    });
  }, [jobTitle, location, filters]);

  const handleSearch = () => {
    // Search is handled reactively via useMemo
    // This can be used for analytics or future enhancements
  };

  const hasActiveFilters =
    filters.workType !== 'all' ||
    filters.employmentType !== 'all' ||
    filters.salaryRange !== 'all' ||
    jobTitle !== '' ||
    location !== '';

  return (
    <div className="container-responsive py-6 sm:py-10">
      {/* Hero section */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-text-primary mb-3">Find Your Next Role</h1>
        <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
          Discover opportunities that match your skills. All applications go directly to company
          career pages.
        </p>
      </div>

      {/* Search section */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
        <SearchBar
          jobTitle={jobTitle}
          location={location}
          onJobTitleChange={setJobTitle}
          onLocationChange={setLocation}
          onSearch={handleSearch}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 sm:mb-8">
        <FilterPanel filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Results count */}
      <div className="mb-4 sm:mb-6">
        <p className="text-text-muted text-sm">
          Showing <span className="text-text-primary font-medium">{filteredJobs.length}</span>{' '}
          {filteredJobs.length === 1 ? 'job' : 'jobs'}
          {hasActiveFilters && ' matching your criteria'}
        </p>
      </div>

      {/* Job listings */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No jobs found"
          description="Try adjusting your search or filters to find more opportunities."
          actionLabel="Clear all filters"
          onAction={() => {
            setJobTitle('');
            setLocation('');
            setFilters(defaultFilters);
          }}
        />
      )}
    </div>
  );
}
