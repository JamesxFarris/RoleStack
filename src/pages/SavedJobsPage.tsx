import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { JobCard } from '../components/ui/JobCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useSavedJobsContext } from '../context/SavedJobsContext';
import type { Job } from '../hooks/useJobs';

export function SavedJobsPage() {
  const navigate = useNavigate();
  const { savedJobIds } = useSavedJobsContext();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (savedJobIds.size === 0) {
        setSavedJobs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch all jobs and filter by saved IDs
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const data = await response.json();
          const filtered = data.jobs.filter((job: Job) => savedJobIds.has(job.id));
          setSavedJobs(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch saved jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedJobs();
  }, [savedJobIds]);

  const jobCount = savedJobs.length;

  return (
    <div className="container-responsive py-6 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Search</span>
        </Link>
        <h1 className="text-text-primary">Saved Jobs</h1>
        <p className="text-text-secondary mt-2">
          {isLoading
            ? "Loading your saved jobs..."
            : jobCount === 0
            ? "You haven't saved any jobs yet."
            : `You have ${jobCount} saved ${jobCount === 1 ? "job" : "jobs"}.`}
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      {/* Job listings */}
      {!isLoading && jobCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {savedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && jobCount === 0 && (
        <EmptyState
          variant="no-saved"
          title="No saved jobs yet"
          description="When you find jobs you're interested in, click the bookmark icon to save them here for later."
          actionLabel="Browse Jobs"
          onAction={() => navigate('/')}
        />
      )}
    </div>
  );
}
