function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`bg-white/[0.06] rounded animate-pulse ${className ?? ""}`}
      style={{
        backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s linear infinite, pulse 2s ease-in-out infinite",
      }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Metric cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Score card */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-end gap-6">
              <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
          </div>

          {/* Fix list */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <Skeleton className="h-4 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-t border-white/5">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="glass rounded-2xl p-6 space-y-3">
            <Skeleton className="h-4 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
