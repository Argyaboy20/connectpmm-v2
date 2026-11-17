export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted size-10 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
              <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
            </div>
          </div>
          <div className="bg-muted h-40 animate-pulse rounded-xl" />
          <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}