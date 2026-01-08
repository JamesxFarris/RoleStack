import { MapPin, Clock, Building2, Wifi, Home, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSavedJobsContext } from '../../context/SavedJobsContext';
import type { Job } from '../../hooks/useJobs';

interface JobCardProps {
  job: Job;
}

const workTypeConfig = {
  remote: { label: 'Remote', icon: Wifi, className: 'tag-remote' },
  hybrid: { label: 'Hybrid', icon: Building2, className: 'tag-hybrid' },
  onsite: { label: 'On-site', icon: Home, className: 'tag-onsite' },
};

const seniorityConfig = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
};

export function JobCard({ job }: JobCardProps) {
  const { isJobSaved, toggleSaveJob } = useSavedJobsContext();
  const saved = isJobSaved(job.id);
  const workType = workTypeConfig[job.workType];
  const WorkTypeIcon = workType.icon;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaveJob(job.id);
  };

  return (
    <div className="card-interactive group">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
              {job.title}
            </h3>
            <p className="text-text-secondary font-medium mt-0.5">{job.company}</p>
          </div>
          <button
            onClick={handleSaveClick}
            className={`p-2 rounded-lg transition-all duration-200 ${
              saved
                ? 'text-accent bg-accent-light'
                : 'text-text-muted hover:text-accent hover:bg-surface-hover'
            }`}
            aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
          >
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Location and meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin size={16} />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={16} />
            {job.postedAt}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className={workType.className}>
            <WorkTypeIcon size={14} className="mr-1" />
            {workType.label}
          </span>
          <span className="tag">{seniorityConfig[job.seniority]}</span>
          <span className="tag">{job.employmentType}</span>
          {job.salary && <span className="tag">{job.salary}</span>}
        </div>

        {/* Action */}
        <div className="pt-2 mt-auto flex items-center gap-2">
          <Link
            to={`/job/${job.id}`}
            className="btn-secondary flex-1 sm:flex-none sm:w-auto"
          >
            View Job
          </Link>
          <a
            href={job.companyReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl border border-border bg-surface-elevated text-text-muted
                       hover:border-[#0caa41] hover:text-[#0caa41] hover:bg-[#0caa41]/5
                       transition-all duration-200"
            aria-label={`View ${job.company} reviews on Glassdoor`}
            title="Company reviews on Glassdoor"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.144 20.572H6.856c-.264 0-.48-.216-.48-.48V3.908c0-.264.216-.48.48-.48h10.288c.264 0 .48.216.48.48v16.184c0 .264-.216.48-.48.48zM6.856 0C5.008 0 3.512 1.496 3.512 3.344v17.312C3.512 22.504 5.008 24 6.856 24h10.288c1.848 0 3.344-1.496 3.344-3.344V3.344C20.488 1.496 18.992 0 17.144 0H6.856z"/>
              <path d="M14.4 7.2h-4.8c-.264 0-.48.216-.48.48v8.64c0 .264.216.48.48.48h4.8c.264 0 .48-.216.48-.48V7.68c0-.264-.216-.48-.48-.48z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
