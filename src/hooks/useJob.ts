import { useState, useEffect } from 'react';
import type { Job } from './useJobs';

interface UseJobResult {
  job: Job | null;
  isLoading: boolean;
  error: string | null;
}

export function useJob(id: string | undefined): UseJobResult {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError('No job ID provided');
      return;
    }

    const fetchJob = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/jobs/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Job not found');
          }
          throw new Error(`Failed to fetch job: ${response.statusText}`);
        }

        const data = await response.json();
        setJob(data.job);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job');
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  return { job, isLoading, error };
}
