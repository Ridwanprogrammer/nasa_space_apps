import { BookOpen, Database } from 'lucide-react';
import BrandMark from './BrandMark';
import earthAtNight from '../assets/nasa-earth-at-night.jpg';

function EngineStatus({ status }) {
  const config = {
    online: { label: 'Analysis engine online', dot: 'bg-accent', text: 'text-ink', pulse: false },
    checking: { label: 'Checking engine', dot: 'bg-muted', text: 'text-muted', pulse: true },
    offline: { label: 'Engine offline', dot: 'bg-danger', text: 'text-danger', pulse: false }
  }[status] || { label: 'Checking engine', dot: 'bg-muted', text: 'text-muted', pulse: true };

  return (
    <span
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface/80 px-3 text-[11px] font-medium"
      title="Status of the local EarthScope analysis API"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className={config.text}>{config.label}</span>
    </span>
  );
}

export default function Header({ onOpenMethodology, engineStatus, provenance }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-base/90 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block" aria-hidden="true">
        <img
          src={earthAtNight}
          alt=""
          className="h-full w-full object-cover opacity-30 [mask-image:linear-gradient(to_left,black_10%,transparent_92%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/55 to-transparent" />
      </div>

      <div className="relative mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark size={38} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[17px] font-semibold tracking-tight text-ink">EarthScope</span>
              <span className="hidden rounded-full border border-line bg-surface/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent sm:inline">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="truncate text-[11px] text-muted">Earth system trend detective</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {provenance && (
            <div className="hidden max-w-[230px] items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[11px] text-muted xl:flex">
              <Database className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span className="truncate">
                {provenance.source_mission.replace(' (via NASA POWER)', '')}
              </span>
              <span className="shrink-0 rounded-full border border-line bg-base px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                {provenance.is_cached ? 'Cached' : 'Live'}
              </span>
            </div>
          )}

          <div className="hidden sm:block">
            <EngineStatus status={engineStatus} />
          </div>

          <button
            type="button"
            onClick={onOpenMethodology}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface/80 px-3 text-[11px] font-medium text-ink transition hover:border-accent/60 hover:bg-raised"
            title="Read the scientific methodology, statistical methods, and caveats"
          >
            <BookOpen className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span className="hidden sm:inline">Methods</span>
          </button>
        </div>
      </div>
    </header>
  );
}
