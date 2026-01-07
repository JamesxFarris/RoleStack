import { Moon, Sun, Monitor } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

export function ThemeToggle() {
  const { theme, setTheme } = useDarkMode();

  return (
    <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg border border-border">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light'
            ? 'bg-surface text-accent'
            : 'text-text-muted hover:text-text-primary'
        }`}
        aria-label="Light mode"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark'
            ? 'bg-surface text-accent'
            : 'text-text-muted hover:text-text-primary'
        }`}
        aria-label="Dark mode"
      >
        <Moon size={18} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'system'
            ? 'bg-surface text-accent'
            : 'text-text-muted hover:text-text-primary'
        }`}
        aria-label="System preference"
      >
        <Monitor size={18} />
      </button>
    </div>
  );
}
