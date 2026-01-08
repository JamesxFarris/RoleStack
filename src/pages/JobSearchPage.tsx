import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/ui/SearchBar';
import { FilterPanel, type Filters } from '../components/ui/FilterPanel';
import { JobCard } from '../components/ui/JobCard';
import { JobCardSkeleton } from '../components/ui/JobCardSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useJobs } from '../hooks/useJobs';

const defaultFilters: Filters = {
  workType: 'all',
  employmentType: 'all',
  salaryRange: 'all',
  seniority: 'all',
};

export function JobSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [jobTitle, setJobTitle] = useState(() => searchParams.get('q') || '');
  const [location, setLocation] = useState(() => searchParams.get('location') || '');
  const [filters, setFilters] = useState<Filters>(() => ({
    workType: (searchParams.get('workType') as Filters['workType']) || 'all',
    employmentType: (searchParams.get('employmentType') as Filters['employmentType']) || 'all',
    salaryRange: (searchParams.get('salaryRange') as Filters['salaryRange']) || 'all',
    seniority: (searchParams.get('seniority') as Filters['seniority']) || 'all',
  }));

  // Fetch jobs from API
  const { jobs, isLoading, error, total } = useJobs({
    searchQuery: jobTitle,
    location,
    filters,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (jobTitle) params.set('q', jobTitle);
    if (location) params.set('location', location);
    if (filters.workType !== 'all') params.set('workType', filters.workType);
    if (filters.employmentType !== 'all') params.set('employmentType', filters.employmentType);
    if (filters.salaryRange !== 'all') params.set('salaryRange', filters.salaryRange);
    if (filters.seniority !== 'all') params.set('seniority', filters.seniority);

    setSearchParams(params, { replace: true });
  }, [jobTitle, location, filters, setSearchParams]);

  const handleSearch = () => {
    // Search is handled reactively via useJobs hook
  };

  const hasActiveFilters =
    filters.workType !== 'all' ||
    filters.employmentType !== 'all' ||
    filters.salaryRange !== 'all' ||
    filters.seniority !== 'all' ||
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
          Showing <span className="text-text-primary font-medium">{total}</span>{' '}
          {total === 1 ? 'job' : 'jobs'}
          {hasActiveFilters && ' matching your criteria'}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Job listings */}
      {!error && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {jobs.map((job) => (
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
        </>
      )}
    </div>
  );
}
