import { Briefcase, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ui/ThemeToggle';
import { useSavedJobsContext } from '../context/SavedJobsContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { savedCount } = useSavedJobsContext();

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border safe-area-top">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors">
              <Briefcase size={28} className="text-accent" />
              <span className="font-heading font-semibold text-xl">RoleStack</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <Link
                to="/saved"
                className="relative p-2 rounded-xl text-text-muted hover:text-accent hover:bg-surface-hover transition-all"
                aria-label="Saved jobs"
              >
                <Bookmark size={22} />
                {savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-accent rounded-full">
                    {savedCount > 9 ? '9+' : savedCount}
                  </span>
                )}
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 safe-area-bottom">
        <div className="container-responsive">
          <p className="text-center text-sm text-text-muted">
            Built for job seekers. All applications redirect to company sites.
          </p>
        </div>
      </footer>
    </div>
  );
}
