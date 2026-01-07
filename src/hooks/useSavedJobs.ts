import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'rolestack_saved_jobs';

export function useSavedJobs() {
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...savedJobIds]));
    } catch (e) {
      console.error('Failed to save jobs to localStorage:', e);
    }
  }, [savedJobIds]);

  const saveJob = useCallback((jobId: string) => {
    setSavedJobIds((prev) => new Set([...prev, jobId]));
  }, []);

  const unsaveJob = useCallback((jobId: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  }, []);

  const toggleSaveJob = useCallback((jobId: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }, []);

  const isJobSaved = useCallback((jobId: string) => {
    return savedJobIds.has(jobId);
  }, [savedJobIds]);

  const savedCount = savedJobIds.size;

  return {
    savedJobIds,
    savedCount,
    saveJob,
    unsaveJob,
    toggleSaveJob,
    isJobSaved,
  };
}
