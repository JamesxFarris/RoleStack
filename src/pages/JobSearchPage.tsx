import { useState, useMemo } from 'react';
import { SearchBar } from '../components/ui/SearchBar';
import { FilterPanel, type WorkType } from '../components/ui/FilterPanel';
import { JobCard } from '../components/ui/JobCard';
import { mockJobs } from '../data/jobs';

export function JobSearchPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkType>('all');

  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      // Work type filter
      if (workTypeFilter !== 'all' && job.workType !== workTypeFilter) {
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
  }, [jobTitle, location, workTypeFilter]);

  const handleSearch = () => {
    // Real-time filtering is already handled by useMemo
    // This can be used for analytics or future enhancements
  };

  return (
    <div className="container-responsive py-6 sm:py-10">
      {/* Hero section */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-text-primary mb-3">
          Find Your Next Role
        </h1>
        <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
          Discover opportunities that match your skills. All applications go directly to company career pages.
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
        <FilterPanel
          selectedFilter={workTypeFilter}
          onFilterChange={setWorkTypeFilter}
        />
      </div>

      {/* Results count */}
      <div className="mb-4 sm:mb-6">
        <p className="text-text-muted text-sm">
          Showing <span className="text-text-primary font-medium">{filteredJobs.length}</span> jobs
        </p>
      </div>

      {/* Job listings */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-muted text-lg">
            No jobs found matching your criteria.
          </p>
          <p className="text-text-muted text-sm mt-2">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
