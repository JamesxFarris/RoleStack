import { SearchX, Bookmark, Briefcase } from 'lucide-react';

type EmptyStateVariant = 'no-results' | 'no-saved' | 'default';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const icons: Record<EmptyStateVariant, React.ReactNode> = {
  'no-results': <SearchX size={48} className="text-text-muted" strokeWidth={1.5} />,
  'no-saved': <Bookmark size={48} className="text-text-muted" strokeWidth={1.5} />,
  'default': <Briefcase size={48} className="text-text-muted" strokeWidth={1.5} />,
};

export function EmptyState({
  variant = 'default',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 p-4 rounded-full bg-surface-hover">
        {icons[variant]}
      </div>
      <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-text-muted max-w-md mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
