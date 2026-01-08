import { useState, useEffect, useCallback } from 'react';
import type { Filters } from '../components/ui/FilterPanel';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  employmentType: 'full-time' | 'part-time' | 'contract';
  seniority: 'entry' | 'mid' | 'senior';
  salary?: string;
  postedAt: string;
  description: string;
  requirements: string[];
  benefits: string[];
  applyUrl: string;
  companyReviewsUrl: string;
  companyLogo?: string;
  tags?: string[];
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  source: string;
}

interface UseJobsParams {
  searchQuery?: string;
  location?: string;
  filters: Filters;
}

interface UseJobsResult {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  total: number;
  source: string;
  refetch: () => void;
}

export function useJobs({ searchQuery, location, filters }: UseJobsParams): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState('');

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (searchQuery) params.set('q', searchQuery);
      if (location) params.set('location', location);
      if (filters.workType !== 'all') params.set('workType', filters.workType);
      if (filters.employmentType !== 'all') params.set('employmentType', filters.employmentType);
      if (filters.salaryRange !== 'all') params.set('salaryRange', filters.salaryRange);
      if (filters.seniority !== 'all') params.set('seniority', filters.seniority);

      const response = await fetch(`/api/jobs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const data: JobsResponse = await response.json();

      setJobs(data.jobs);
      setTotal(data.total);
      setSource(data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      setJobs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    total,
    source,
    refetch: fetchJobs
  };
}
