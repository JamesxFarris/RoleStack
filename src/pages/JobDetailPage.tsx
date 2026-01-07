import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  Wifi,
  Home,
  ExternalLink,
  Star,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { mockJobs } from '../data/jobs';

const workTypeConfig = {
  remote: { label: 'Remote', icon: Wifi },
  hybrid: { label: 'Hybrid', icon: Building2 },
  onsite: { label: 'On-site', icon: Home },
};

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const job = mockJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="container-responsive py-12 text-center">
        <h2 className="text-xl text-text-primary mb-4">Job not found</h2>
        <Link to="/" className="btn-primary">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const workType = workTypeConfig[job.workType];
  const WorkTypeIcon = workType.icon;

  return (
    <div className="container-responsive py-6 sm:py-10">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        <span>Back to Jobs</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="card">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-text-primary">
                  {job.title}
                </h1>
                <p className="text-lg text-text-secondary mt-1">{job.company}</p>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-text-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin size={18} />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={18} />
                  Posted {job.postedAt}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="tag-accent">
                  <WorkTypeIcon size={14} className="mr-1" />
                  {workType.label}
                </span>
                <span className="tag">{job.employmentType}</span>
                {job.salary && <span className="tag">{job.salary}</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              About this role
            </h2>
            <p className="text-text-secondary leading-relaxed">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="card">
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-accent" />
              Requirements
            </h2>
            <ul className="space-y-3">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-3 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="card">
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Gift size={20} className="text-success" />
              Benefits
            </h2>
            <ul className="space-y-3">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 space-y-4">
            <h3 className="font-heading font-semibold text-text-primary">
              Interested in this role?
            </h3>
            <p className="text-sm text-text-muted">
              Applications are handled directly by {job.company}. Click below to apply on their career site.
            </p>
            
            {/* Apply button - external link */}
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              Apply on Company Site
              <ExternalLink size={16} className="ml-2" />
            </a>

            {/* Reviews link - external only */}
            <a
              href={job.companyReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full"
            >
              <Star size={16} className="mr-2" />
              View Company Reviews
              <ExternalLink size={16} className="ml-2" />
            </a>

            <p className="text-xs text-text-muted text-center pt-2">
              Reviews open in a new tab on an external site
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
