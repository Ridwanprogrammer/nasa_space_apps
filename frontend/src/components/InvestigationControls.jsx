import {
  AlertCircle,
  CalendarRange,
  Clock,
  Database,
  Loader2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import LocationSearch from './LocationSearch';
import NumericInput from './NumericInput';
import InfoTip from './InfoTip';

const PRESET_LABELS = {
  'abuja-nigeria': 'Abuja',
  'lagos-nigeria': 'Lagos',
  'sahel-niamey': 'Sahel',
  'svalbard-arctic': 'Svalbard',
  'manaus-amazon': 'Manaus'
};

function PeriodButton({ label, range, active, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex min-h-[48px] flex-col items-start justify-center rounded-lg border px-2.5 py-1.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? 'border-accent/70 bg-accent/10 text-ink'
          : 'border-line bg-base text-muted hover:border-accent/40 hover:text-ink'
      }`}
    >
      <span className="text-[11px] font-medium">{label}</span>
      <span className={`numeric font-mono text-[9px] ${active ? 'text-accent' : 'text-muted/80'}`}>{range}</span>
    </button>
  );
}

export default function InvestigationControls({
  variables,
  catalog,
  selectedVariable,
  onChangeVariable,
  presets,
  onSelectPreset,
  latitude,
  longitude,
  place,
  onChangeLocation,
  startYear,
  endYear,
  onYearsChange,
  onRun,
  isLoading,
  validation = { latitudeInvalid: false, longitudeInvalid: false, startInvalid: false, endInvalid: false, message: null, valid: false },
  onReset,
  dirty,
  stale,
  recentRuns = [],
  onSelectRecent,
  isMobileOpen,
  onCloseMobile
}) {
  const variableMeta = variables.find((item) => item.id === selectedVariable) || null;
  const minYear = variableMeta?.min_year ?? catalog?.min_year ?? 1981;
  const maxYear = variableMeta?.max_year ?? catalog?.max_year ?? 2026;
  const latestComplete = catalog?.latest_complete_year ?? maxYear;
  const periodLength = Math.max(0, endYear - startYear + 1);

  const quickRanges = [
    { label: 'Full record', start: minYear, end: maxYear },
    { label: 'Last 30 years', start: Math.max(minYear, latestComplete - 29), end: latestComplete },
    { label: 'Last 20 years', start: Math.max(minYear, latestComplete - 19), end: latestComplete }
  ];

  const includesPartialYear = endYear > latestComplete;

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close investigation setup"
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden ${
          isMobileOpen ? 'block' : 'hidden'
        }`}
      />

      <aside
        id="investigation-panel"
        aria-label="Investigation setup"
        role={isMobileOpen ? 'dialog' : undefined}
        aria-modal={isMobileOpen ? 'true' : undefined}
        className={`fixed inset-y-0 left-0 z-50 w-[92%] max-w-[360px] overflow-y-auto border-r border-line bg-surface transition-transform duration-300 lg:sticky lg:top-16 lg:z-0 lg:block lg:h-[calc(100vh-4rem)] lg:w-auto lg:max-w-none lg:translate-x-0 lg:visible ${
          isMobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold text-ink">Investigation setup</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-grid h-10 w-10 place-items-center rounded-lg border border-line bg-base text-muted transition hover:text-ink"
            aria-label="Close investigation setup"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">01 · Query</p>
              <h2 className="mt-0.5 hidden text-[15px] font-semibold tracking-tight text-ink lg:block">
                Investigation setup
              </h2>
            </div>
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-base px-2.5 text-[10px] font-medium text-muted transition hover:border-accent/50 hover:text-ink disabled:opacity-50"
              title="Reset to the Abuja challenge benchmark"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset
            </button>
          </div>

          {/* Variable */}
          <section aria-labelledby="variable-heading">
            <div className="mb-1.5 flex items-center justify-between">
              <h3 id="variable-heading" className="text-[11px] font-medium text-muted">
                NASA variable
              </h3>
              {variableMeta && (
                <span className="rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[9px] text-accent">
                  {variableMeta.units}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {variables.map((variable) => {
                const selected = variable.id === selectedVariable;
                return (
                  <label
                    key={variable.id}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition focus-within:ring-2 focus-within:ring-accent/40 ${
                      selected
                        ? 'border-accent/70 bg-accent/10'
                        : 'border-line bg-base hover:border-accent/35 hover:bg-raised/60'
                    } ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <input
                      type="radio"
                      name="earthscope-variable"
                      value={variable.id}
                      checked={selected}
                      disabled={isLoading}
                      onChange={() => onChangeVariable(variable.id)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${selected ? 'bg-accent' : 'bg-line'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-ink">{variable.name}</span>
                      <span className="mt-0.5 block font-mono text-[9px] text-muted">
                        {variable.id} · {variable.units}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {variableMeta && (
              <div className="mt-2 space-y-1 rounded-lg border border-line/70 bg-base/60 p-2.5 text-[10px] leading-relaxed text-muted">
                <p className="flex items-start gap-1.5">
                  <Database className="mt-0.5 h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    {variableMeta.source.replace(' (via NASA POWER)', '')} ·{' '}
                    <span className="font-mono text-ink">
                      {variableMeta.lat_resolution}° × {variableMeta.lon_resolution}°
                    </span>{' '}
                    grid
                  </span>
                </p>
                <p className="line-clamp-2">{variableMeta.description}</p>
              </div>
            )}
          </section>

          {/* Location */}
          <section aria-labelledby="location-heading" className="border-t border-line/70 pt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <h3 id="location-heading" className="text-[11px] font-medium text-muted">
                Benchmark sites
              </h3>
              <span className="text-[9px] text-muted/80">or search below</span>
            </div>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  disabled={isLoading}
                  title={preset.context}
                  className="min-h-8 rounded-full border border-line bg-base px-2.5 text-[10px] font-medium text-muted transition hover:border-accent/50 hover:text-ink disabled:opacity-50"
                >
                  {PRESET_LABELS[preset.id] || preset.name.split(',')[0]}
                </button>
              ))}
            </div>
            <LocationSearch
              latitude={latitude}
              longitude={longitude}
              place={place}
              onSelect={onChangeLocation}
              disabled={isLoading}
            />
          </section>

          {/* Coordinates */}
          <section aria-labelledby="coords-heading" className="border-t border-line/70 pt-4">
            <div className="mb-1.5 flex items-center gap-1">
              <h3 id="coords-heading" className="text-[11px] font-medium text-muted">
                Coordinates
              </h3>
              <InfoTip label="decimal coordinates">
                Coordinates are decimal degrees. Latitude is positive north of the equator and negative
                south; longitude is positive east of Greenwich and negative west. The map cell is centered
                on the nearest native NASA POWER grid point.
              </InfoTip>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumericInput
                id="latitude-input"
                label="Latitude"
                value={latitude}
                onChange={(next) => onChangeLocation({ latitude: next, longitude, place: null })}
                digits={4}
                hint="−90…90 · N+/S−"
                invalid={validation.latitudeInvalid}
                disabled={isLoading}
              />
              <NumericInput
                id="longitude-input"
                label="Longitude"
                value={longitude}
                onChange={(next) => onChangeLocation({ latitude, longitude: next, place: null })}
                digits={4}
                hint="−180…180 · E+/W−"
                invalid={validation.longitudeInvalid}
                disabled={isLoading}
              />
            </div>
          </section>

          {/* Period */}
          <section aria-labelledby="period-heading" className="border-t border-line/70 pt-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <h3 id="period-heading" className="flex items-center gap-1 text-[11px] font-medium text-muted">
                <CalendarRange className="h-3 w-3 text-accent" aria-hidden="true" />
                Period
              </h3>
              <span className="numeric text-[10px] text-muted">
                {periodLength > 0 ? `${periodLength} calendar yrs` : 'Invalid range'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {quickRanges.map((range) => (
                <PeriodButton
                  key={range.label}
                  label={range.label}
                  range={`${range.start}–${range.end}`}
                  active={startYear === range.start && endYear === range.end}
                  onClick={() => onYearsChange(range.start, range.end)}
                  disabled={isLoading}
                />
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <NumericInput
                id="start-year-input"
                label="Start year"
                value={startYear}
                onChange={(next) => onYearsChange(next, endYear)}
                hint={`${minYear}–${maxYear}`}
                invalid={validation.startInvalid}
                disabled={isLoading}
                inputMode="numeric"
              />
              <NumericInput
                id="end-year-input"
                label="End year"
                value={endYear}
                onChange={(next) => onYearsChange(startYear, next)}
                hint={`${minYear}–${maxYear}`}
                invalid={validation.endInvalid}
                disabled={isLoading}
                inputMode="numeric"
              />
            </div>

            <p className="mt-2 text-[10px] leading-relaxed text-muted/90">
              Data available <span className="font-mono text-ink">{minYear}–{maxYear}</span>.{' '}
              {includesPartialYear ? (
                <span className="text-accent">
                  {endYear} is partial; incomplete years are excluded from trend statistics.
                </span>
              ) : (
                <>Annual statistics use complete 12-month years only.</>
              )}
            </p>
          </section>

          {/* Validation + run */}
          <div className="border-t border-line/70 pt-4">
            <div aria-live="polite" className="min-h-[16px]">
              {validation.message ? (
                <p className="mb-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-danger">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>{validation.message}</span>
                </p>
              ) : (
                <p className="mb-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
                  <SlidersHorizontal className="mt-0.5 h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    Runs two independent trend tests on {variableMeta?.lat_resolution ?? 0.5}° grid-cell
                    data.
                  </span>
                </p>
              )}
            </div>

            {dirty && !validation.message && (
              <p className="mb-2 text-[10px] text-accent">Inputs changed since the last run.</p>
            )}
            {stale && !dirty && (
              <p className="mb-2 text-[10px] text-accent">Showing the last successful result.</p>
            )}

            <button
              type="button"
              onClick={onRun}
              disabled={isLoading || !validation.valid}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-inverse shadow-[0_10px_30px_-12px_rgba(242,169,59,0.55)] transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Acquiring &amp; analyzing…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Run investigation
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[9px] text-muted/80">
              Real NASA POWER observations · no mock or synthetic values
            </p>
          </div>

          {/* Recent */}
          {recentRuns.length > 0 && (
            <section aria-labelledby="recent-heading" className="border-t border-line/70 pt-4">
              <h3
                id="recent-heading"
                className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
              >
                <Clock className="h-3 w-3 text-accent" aria-hidden="true" />
                Recent runs
              </h3>
              <ul className="space-y-1">
                {recentRuns.slice(0, 3).map((run) => (
                  <li key={`${run.variable}-${run.latitude}-${run.longitude}-${run.startYear}-${run.endYear}`}>
                    <button
                      type="button"
                      onClick={() => onSelectRecent(run)}
                      className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-[10px] text-muted transition hover:border-line hover:bg-base hover:text-ink"
                    >
                      <span className="truncate">
                        <span className="font-mono text-accent">{run.variable}</span> · {run.place || 'Custom point'}
                      </span>
                      <span className="numeric shrink-0 font-mono text-[9px] text-muted/80">
                        {run.startYear}–{run.endYear}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
