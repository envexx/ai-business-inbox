export default function Loading() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-label="Loading">
      <div className="h-7 w-56 animate-pulse rounded bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-line bg-surface" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg border border-line bg-surface" />
      <span className="sr-only">Loading data</span>
    </div>
  );
}
