export function JobCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-6 bg-surface-hover rounded-lg w-3/4 mb-2" />
            <div className="h-4 bg-surface-hover rounded-lg w-1/2" />
          </div>
          <div className="w-10 h-10 bg-surface-hover rounded-xl" />
        </div>

        {/* Location and meta */}
        <div className="flex gap-4">
          <div className="h-4 bg-surface-hover rounded-lg w-32" />
          <div className="h-4 bg-surface-hover rounded-lg w-24" />
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 bg-surface-hover rounded-lg w-20" />
          <div className="h-6 bg-surface-hover rounded-lg w-24" />
          <div className="h-6 bg-surface-hover rounded-lg w-28" />
        </div>

        {/* Button */}
        <div className="pt-2 mt-auto">
          <div className="h-11 bg-surface-hover rounded-xl w-28" />
        </div>
      </div>
    </div>
  );
}
