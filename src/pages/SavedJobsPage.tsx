import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { JobCard } from '../components/ui/JobCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useSavedJobsContext } from '../context/SavedJobsContext';
import { mockJobs } from '../data/jobs';

export function SavedJobsPage() {
  const navigate = useNavigate();
  const { savedJobIds } = useSavedJobsContext();

  const savedJobs = mockJobs.filter((job) => savedJobIds.has(job.id));
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
          {jobCount === 0
            ? "You haven't saved any jobs yet."
            : "You have " + jobCount + " saved " + (jobCount === 1 ? "job" : "jobs") + "."}
        </p>
      </div>

      {/* Job listings */}
      {jobCount > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {savedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
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
