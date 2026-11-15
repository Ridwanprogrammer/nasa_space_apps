import { Loader2 } from 'lucide-react';

export default function LoadingSkeleton({ message = 'Acquiring NASA observations and running trend tests…' }) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-xl border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
        <span>{message}</span>
      </div>
      <div className="mt-4 animate-pulse space-y-3" aria-hidden="true">
        <div className="h-7 w-2/3 rounded bg-raised" />
        <div className="h-4 w-1/3 rounded bg-raised/70" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-20 rounded-lg bg-base" />
          ))}
        </div>
      </div>
    </section>
  );
}
