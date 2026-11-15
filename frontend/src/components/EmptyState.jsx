import { ArrowRight, MapPin, Search, Sparkles } from 'lucide-react';
import earthAtNight from '../assets/nasa-earth-at-night.jpg';

const steps = [
  { title: 'Choose an Earth variable', body: 'Temperature, precipitation, or solar irradiance from NASA POWER.' },
  { title: 'Set a place and period', body: 'Search the offline gazetteer, use your location, or pick a benchmark site.' },
  { title: 'Read the evidence', body: 'Mann–Kendall significance, Sen’s robust rate, and honest caveats.' }
];

export default function EmptyState({ onRunBenchmark, onOpenSetup }) {
  return (
    <section
      aria-labelledby="empty-heading"
      className="relative overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]"
    >
      <img
        src={earthAtNight}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-base via-base/90 to-base/30" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-base/80 via-transparent to-transparent" aria-hidden="true" />

      <div className="relative p-5 sm:p-8">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Start here
        </p>
        <h2 id="empty-heading" className="mt-2 max-w-xl text-balance text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          Investigate a long-term trend in the Earth system
        </h2>
        <p className="mt-2 max-w-lg text-[12px] leading-relaxed text-muted sm:text-[13px]">
          EarthScope retrieves real NASA POWER observations for a single grid cell, builds complete annual
          means, and runs two independent trend tests. Nothing is simulated.
        </p>

        <ol className="mt-5 grid gap-2 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-line/80 bg-base/60 p-3 backdrop-blur-sm">
              <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
              <p className="mt-1 text-[11px] font-medium text-ink">{step.title}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRunBenchmark}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-inverse shadow-[0_10px_30px_-12px_rgba(242,169,59,0.55)] transition hover:bg-accent-deep"
          >
            Run the Abuja benchmark
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onOpenSetup}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-base/70 px-4 text-[12px] font-medium text-ink backdrop-blur-sm transition hover:border-accent/50 hover:bg-raised"
          >
            <Search className="h-4 w-4 text-accent" aria-hidden="true" />
            Search a location
          </button>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-[9px] text-muted/80">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          Decorative imagery: NASA Earth at Night (VIIRS City Lights 2012) via NASA GIBS. Not a data layer.
        </p>
      </div>
    </section>
  );
}
