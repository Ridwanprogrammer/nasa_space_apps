import { Loader2 } from 'lucide-react';

export function SkeletonLoader({ className = '' }) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Loading investigation results"
      className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
        <span>Loading investigation results...</span>
      </div>
      <div className="mt-4 animate-pulse space-y-3" aria-hidden="true">
        <div className="h-7 w-3/4 rounded bg-raised" />
        <div className="h-4 w-1/2 rounded bg-raised/70" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-20 rounded-lg bg-base" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResultSummarySkeleton({ className = '' }) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Loading result summary"
      className={`relative rounded-xl border border-line bg-surface shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" aria-hidden="true" />
      <div className="p-4 sm:p-5 animate-pulse">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-4 w-16 rounded bg-raised" />
            </div>
            <div className="mt-1 h-5 w-3/4 rounded bg-raised" />
            <div className="mt-1 h-3 w-1/2 rounded bg-raised/70" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="h-9 w-20 rounded bg-raised" />
            <div className="h-9 w-16 rounded bg-raised" />
            <div className="h-9 w-16 rounded bg-raised" />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-base/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded bg-raised" />
              <div>
                <div className="h-4 w-3/4 rounded bg-raised" />
                <div className="mt-0.5 h-3 w-1/2 rounded bg-raised/70" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-16 rounded bg-raised" />
              <div className="h-5 w-16 rounded bg-raised" />
              <div className="h-5 w-20 rounded bg-raised" />
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="mt-3 w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 rounded-lg border border-line bg-base px-3 py-2 text-[11px] font-medium text-muted opacity-50"
        >
          <div className="h-3.5 w-3.5 rounded bg-raised" />
          <div className="h-3.5 w-20 rounded bg-raised" />
        </button>

        <div className="mt-3">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-base/70 p-3 h-20">
                <div className="h-2 w-1/3 rounded bg-raised" />
                <div className="mt-2 h-4 w-1/2 rounded bg-raised" />
                <div className="mt-1 h-3 w-1/3 rounded bg-raised/70" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-start gap-1.5">
          <div className="h-3 w-3 rounded bg-accent" />
          <div className="flex-1 h-4 w-3/4 rounded bg-raised" />
        </div>
      </div>
    </section>
  );
}

export function ChartSkeleton({ className = '' }) {
  return (
    <section aria-labelledby="chart-heading" className={`rounded-xl border border-line bg-surface ${className}`}>
      <div className="p-4 sm:p-5 animate-pulse">
        <div className="h-4 w-24 rounded bg-raised mb-4" />
        <div className="h-[300px] rounded-lg bg-base" />
      </div>
    </section>
  );
}

export function MapSkeleton({ className = '' }) {
  return (
    <section aria-labelledby="map-heading" className={`rounded-xl border border-line bg-surface ${className}`}>
      <div className="p-4 sm:p-5 animate-pulse">
        <div className="h-4 w-24 rounded bg-raised mb-4" />
        <div className="h-[300px] rounded-lg bg-base" />
      </div>
    </section>
  );
}

export function FindingsSkeleton({ className = '' }) {
  return (
    <div className={`space-y-4 ${className}`} aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-line bg-base/50 p-4">
          <div className="h-4 w-1/4 rounded bg-raised mb-2" />
          <div className="h-3 w-3/4 rounded bg-raised/70" />
          <div className="mt-2 h-3 w-1/2 rounded bg-raised/70" />
        </div>
      ))}
    </div>
  );
}

export function ActionBarSkeleton({ className = '' }) {
  return (
    <div className={`mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line/50 pt-6 ${className}`} aria-hidden="true">
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-10 w-24 rounded bg-raised" />
        <div className="h-10 w-16 rounded bg-raised" />
        <div className="h-10 w-16 rounded bg-raised" />
      </div>
      <div className="h-10 w-32 rounded bg-raised" />
    </div>
  );
}