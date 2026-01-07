import { createContext, useContext, ReactNode } from 'react';
import { useSavedJobs } from '../hooks/useSavedJobs';

type SavedJobsContextType = ReturnType<typeof useSavedJobs>;

const SavedJobsContext = createContext<SavedJobsContextType | null>(null);

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const savedJobs = useSavedJobs();

  return (
    <SavedJobsContext.Provider value={savedJobs}>
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobsContext() {
  const context = useContext(SavedJobsContext);
  if (!context) {
    throw new Error('useSavedJobsContext must be used within a SavedJobsProvider');
  }
  return context;
}
