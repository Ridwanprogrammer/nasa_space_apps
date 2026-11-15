import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileJson,
  Link2,
  Loader2,
  Minus,
  TrendingUp
} from 'lucide-react';
import { formatCoord, formatPValue, formatSigned } from '../utils/format';
import InfoTip from './InfoTip';
import { useState } from 'react';

function DirectionGlyph({ direction }) {
  if (direction === 'increasing') return <ArrowUpRight className="h-4 w-4 text-accent" aria-hidden="true" />;
  if (direction === 'decreasing') return <ArrowDownRight className="h-4 w-4 text-accent" aria-hidden="true" />;
  return <Minus className="h-4 w-4 text-muted" aria-hidden="true" />;
}

function Metric({ label, value, unit, sub, tone = 'ink', children }) {
  const toneClass = {
    ink: 'text-ink',
    accent: 'text-accent',
    significant: 'text-significant',
    muted: 'text-muted'
  }[tone];

  return (
    <div className="bg-base/70 p-3">
      <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        {label}
        {children}
      </dt>
      <dd className={`numeric mt-1.5 font-mono text-[15px] font-semibold leading-tight ${toneClass}`}>
        {value}
        {unit && (
          <span className="ml-1 whitespace-nowrap text-[10px] font-medium opacity-85">{unit}</span>
        )}
      </dd>
      {sub && <p className="mt-1 text-[10px] leading-snug text-muted">{sub}</p>}
    </div>
  );
}

export default function ResultSummary({
  result,
  selection,
  isLoading,
  stale,
  copied,
  onCopyLink,
  onExportCsv,
  onExportJson,
  onOpenProvenance
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!result) return null;

  const { provenance, mann_kendall: mannKendall, sens_slope: sensSlope, findings } = result;

  // Guard against incomplete result data
  if (!provenance || !mannKendall || !sensSlope || !findings) return null;

  const units = provenance.units;
  const totalCalendarYears = provenance.end_year - provenance.start_year + 1;
  const significant = mannKendall.is_significant;
  const directionLabel =
    mannKendall.trend_direction === 'no trend'
      ? 'No trend'
      : mannKendall.trend_direction.charAt(0).toUpperCase() + mannKendall.trend_direction.slice(1);
  const latestCompleteYear = provenance.latest_complete_year ?? 2025;

  return (
    <section
      aria-labelledby="summary-heading"
      className="relative rounded-xl border border-line bg-surface shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" aria-hidden="true" />
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">02 · Result</p>
              {stale && (
                <span className="rounded-full border border-accent/60 bg-accent/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                  Stale · last successful run
                </span>
              )}
              {isLoading && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-base px-2 py-0.5 text-[9px] uppercase tracking-wide text-muted">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
                  Updating
                </span>
              )}
            </div>
            <h2
              id="summary-heading"
              className="mt-1 break-words text-[17px] font-semibold leading-snug tracking-tight text-ink sm:text-xl"
            >
              {selection.place || 'Custom point'}
              <span className="mx-2 font-normal text-muted">·</span>
              <span className="font-normal text-ink/90">{provenance.variable_name}</span>
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
              <span className="numeric font-mono">
                {formatCoord(provenance.latitude, 'lat')}, {formatCoord(provenance.longitude, 'lon')}
              </span>
              <span aria-hidden="true">·</span>
              <span className="numeric font-mono">
                {provenance.start_year}–{provenance.end_year}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {provenance.lat_resolution}° × {provenance.lon_resolution}° NASA POWER cell
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onCopyLink}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-base px-2.5 text-[10px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
              title="Copy a reproducible link to this investigation"
              aria-label="Copy link to this investigation"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-significant" aria-hidden="true" />
              ) : (
                <Link2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy link'}</span>
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-base px-2.5 text-[10px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
              title="Download annual observations as CSV"
              aria-label="Download annual observations as CSV"
            >
              <Download className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-base px-2.5 text-[10px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
              title="Download the full result, method, and provenance as JSON"
              aria-label="Download full result as JSON"
            >
              <FileJson className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            {onOpenProvenance && (
              <button
                type="button"
                onClick={onOpenProvenance}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-base px-2.5 text-[10px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
                title="View data source, resolution, and limitations"
                aria-label="View data source and limitations"
              >
                <FileJson className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span className="hidden sm:inline">Data source</span>
              </button>
            )}
          </div>
        </div>

        {/* Plain-language answer card — shown by default */}
        <div className="mt-4 rounded-lg border border-line bg-base/50 p-4" role="region" aria-label="Plain-language summary">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <DirectionGlyph direction={mannKendall.trend_direction} className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-ink">
                  {directionLabel === 'No trend'
                    ? 'No clear trend detected.'
                    : `${directionLabel} trend at ${formatSigned(sensSlope.slope_per_decade, 2)} ${units}/decade`}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {significant
                    ? 'Statistically significant — very unlikely to be chance.'
                    : 'Not statistically significant — could be natural variability.'}
                  {' '}
                  Based on {provenance.annual_observations_count} complete year{provenance.annual_observations_count !== 1 ? 's' : ''} of data.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                significant ? 'bg-significant/15 text-significant border border-significant/30' : 'bg-muted/15 text-muted border border-line'
              }`}>
                {significant ? 'Significant' : 'Not significant'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-line bg-base px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                {provenance.is_cached ? 'Cached' : 'Live'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-line bg-base px-2 py-0.5 text-[9px] text-muted">
                Latest complete year: {latestCompleteYear}
              </span>
            </div>
          </div>
        </div>

        {/* Statistical details — behind toggle */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          aria-controls="statistical-details"
          className="mt-3 w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 rounded-lg border border-line bg-base px-3 py-2 text-[11px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              Hide statistical details
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              Show statistical details
            </>
          )}
        </button>

        <div id="statistical-details" className="mt-3" hidden={!showDetails} role="region" aria-label="Statistical details">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 xl:grid-cols-5">
            <Metric label="Direction" value={directionLabel} sub="Mann–Kendall monotonic test">
              <DirectionGlyph direction={mannKendall.trend_direction} />
              <InfoTip label="Mann–Kendall test">
                A non-parametric rank test for a monotonic trend. It does not assume normally distributed
                data and reports a two-sided p-value at α = 0.05.
              </InfoTip>
            </Metric>

            <Metric
              label="Rate of change"
              value={formatSigned(sensSlope.slope_per_decade, 3)}
              unit={`${units}/decade`}
              sub={`Sen's robust slope · 95% CI ${formatSigned(sensSlope.slope_min_ci, 2)} to ${formatSigned(
                sensSlope.slope_max_ci,
                2
              )} ${units}/decade`}
              tone="accent"
            />

            <Metric
              label="Significance"
              value={significant ? 'Significant' : 'Not significant'}
              sub={`p = ${formatPValue(mannKendall.p_value)} · α = 0.05`}
              tone={significant ? 'significant' : 'muted'}
            >
              <InfoTip label="p-value">
                The probability of seeing a trend this strong if no monotonic trend existed. Below 0.05 is
                reported as statistically significant; it is not a measure of effect size or causation.
              </InfoTip>
            </Metric>

            <Metric
              label="Complete years"
              value={`${provenance.annual_observations_count} / ${totalCalendarYears}`}
              sub="Years with all 12 months valid"
            />

            <Metric
              label="Source"
              value={provenance.is_cached ? 'Cached' : 'Live'}
              sub={provenance.source_mission.replace(' (via NASA POWER)', '')}
            />
          </dl>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
          <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
          <span>{findings.plain_language_summary}</span>
        </p>
      </div>
    </section>
  );
}