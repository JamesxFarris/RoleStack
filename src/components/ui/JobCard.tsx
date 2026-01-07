import { MapPin, Clock, Building2, Wifi, Home, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSavedJobsContext } from '../../context/SavedJobsContext';
import type { Job } from '../../data/jobs';

interface JobCardProps {
  job: Job;
}

const workTypeConfig = {
  remote: { label: 'Remote', icon: Wifi, className: 'tag-accent' },
  hybrid: { label: 'Hybrid', icon: Building2, className: 'tag' },
  onsite: { label: 'On-site', icon: Home, className: 'tag' },
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
            className={\`p-2 rounded-lg transition-all duration-200 \${
              saved
                ? 'text-accent bg-accent-light'
                : 'text-text-muted hover:text-accent hover:bg-surface-hover'
            }\`}
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
          <span className="tag">{job.employmentType}</span>
          {job.salary && <span className="tag">{job.salary}</span>}
        </div>

        {/* Action */}
        <div className="pt-2 mt-auto">
          <Link
            to={\`/job/\${job.id}\`}
            className="btn-secondary w-full sm:w-auto"
          >
            View Job
          </Link>
        </div>
      </div>
    </div>
  );
}
