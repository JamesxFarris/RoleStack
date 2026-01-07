import { Search, MapPin } from 'lucide-react';

interface SearchBarProps {
  jobTitle: string;
  location: string;
  onJobTitleChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchBar({
  jobTitle,
  location,
  onJobTitleChange,
  onLocationChange,
  onSearch,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="search-group">
      <div className="relative flex-1">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          size={20}
        />
        <input
          type="text"
          placeholder="Job title, keywords, or company"
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
          className="input pl-12"
        />
      </div>
      <div className="relative flex-1 sm:max-w-[240px]">
        <MapPin
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          size={20}
        />
        <input
          type="text"
          placeholder="City, state, or remote"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="input pl-12"
        />
      </div>
      <button type="submit" className="btn-primary">
        <Search size={20} className="sm:hidden" />
        <span className="hidden sm:inline">Search Jobs</span>
      </button>
    </form>
  );
}
