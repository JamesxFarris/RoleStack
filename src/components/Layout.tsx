import { Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ui/ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
            <ThemeToggle />
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
