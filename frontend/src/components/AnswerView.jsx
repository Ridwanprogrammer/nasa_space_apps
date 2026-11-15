import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronLeft, Download, FileJson, Link2, Loader2, RotateCcw, ArrowRight } from 'lucide-react';
import ResultSummary from './ResultSummary';
import TimeSeriesChart from './TimeSeriesChart';
import SpatialMap from './SpatialMap';
import FindingsPanel from './FindingsPanel';
import ProvenanceDrawer from './ProvenanceDrawer';
import {
  ResultSummarySkeleton,
  ChartSkeleton,
  MapSkeleton,
  FindingsSkeleton,
  ActionBarSkeleton
} from './SkeletonLoader';
import { formatCoord } from '../utils/format';

export default function AnswerView({
  result,
  selection,
  variables,
  catalog,
  presets,
  onRun,
  onReset,
  onSelectRecent,
  recentRuns,
  engineStatus,
  isLoading,
  stale,
  dirty,
}) {
  const [, navigate] = useLocation();
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const variableMeta = variables.find(v => v.id === selection.variable) || null;
  const provenance = result?.provenance;

  const handleCopyLink = async () => {
    const params = new URLSearchParams(window.location.search);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportCsv = () => {
    if (!result?.annual_data) return;
    const headers = ['year', 'annual_mean', 'units', 'valid_months', 'is_complete'];
    const rows = result.annual_data.map(d => [d.year, d.value, provenance.units, d.valid_months, d.is_complete]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earthscope_${(selection.place || 'custom').toLowerCase().replace(/\s+/g, '-')}_${selection.variable}_${selection.startYear}-${selection.endYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = {
      generator: 'EarthScope NASA Space Apps 2026',
      exported_at: new Date().toISOString(),
      request: selection,
      provenance: result.provenance,
      statistics: {
        mann_kendall: result.mann_kendall,
        sens_slope: result.sens_slope,
        linear_regression: result.linear_regression,
      },
      findings: result.findings,
      limitations: result.limitations,
      annual_data: result.annual_data,
      monthly_data: result.monthly_data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earthscope_${(selection.place || 'custom').toLowerCase().replace(/\s+/g, '-')}_${selection.variable}_${selection.startYear}-${selection.endYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewInvestigation = () => {
    navigate('/');
  };

  const handleChangeVariable = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('variable');
    navigate(`/?${params.toString()}`);
  };

  const handleChangeLocation = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('lat');
    params.delete('lon');
    params.delete('place');
    navigate(`/?${params.toString()}`);
  };

  const handleChangePeriod = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('start');
    params.delete('end');
    navigate(`/?${params.toString()}`);
  };

  const showSkeleton = !result || isLoading;
  const units = provenance?.units || '';
  const directionLabel = result?.mann_kendall?.trend_direction === 'no trend'
    ? 'No trend'
    : result?.mann_kendall?.trend_direction?.charAt(0).toUpperCase() + result?.mann_kendall?.trend_direction?.slice(1);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Context Pills */}
        <div className="mb-6 flex flex-wrap items-center gap-2" role="navigation" aria-label="Investigation context">
          <button
            type="button"
            onClick={handleChangeVariable}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-base px-3 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
          >
            {variableMeta?.name || selection.variable}
          </button>
          <span className="text-muted">·</span>
          <button
            type="button"
            onClick={handleChangeLocation}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-base px-3 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
          >
            {selection.place || 'Custom point'}
          </button>
          <span className="text-muted">·</span>
          <button
            type="button"
            onClick={handleChangePeriod}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-base px-3 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
          >
            {selection.startYear}–{selection.endYear}
          </button>
        </div>

        {/* Result Summary */}
        {showSkeleton ? (
          <ResultSummarySkeleton />
        ) : (
          <>
            <ResultSummary
              result={result}
              selection={selection}
              isLoading={isLoading}
              stale={stale || dirty}
              copied={copied}
              onCopyLink={handleCopyLink}
              onExportCsv={handleExportCsv}
              onExportJson={handleExportJson}
              onOpenProvenance={() => setProvenanceOpen(true)}
            />

            {provenanceOpen && (
              <ProvenanceDrawer
                provenance={provenance}
                onClose={() => setProvenanceOpen(false)}
              />
            )}
          </>
        )}

        {/* Chart & Map Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          {showSkeleton ? (
            <>
              <ChartSkeleton />
              <MapSkeleton />
            </>
          ) : (
            <>
              <section aria-labelledby="chart-heading" className="rounded-xl border border-line bg-surface">
                <TimeSeriesChart
                  annualData={result.annual_data}
                  monthlyData={result.monthly_data}
                  sensSlope={result.sens_slope}
                  linearRegression={result.linear_regression}
                  variableMeta={{
                    units,
                    name: variableMeta?.name || selection.variable,
                  }}
                />
              </section>

              <section aria-labelledby="map-heading" className="rounded-xl border border-line bg-surface">
                <SpatialMap
                  latitude={selection.latitude}
                  longitude={selection.longitude}
                  onSelectCoords={() => {}}
                  spatialMeaning={provenance?.spatial_meaning}
                  variableMeta={{
                    lat_resolution: provenance?.lat_resolution,
                    lon_resolution: provenance?.lon_resolution,
                  }}
                  place={selection.place}
                  isPreview={false}
                />
              </section>
            </>
          )}
        </div>

        {/* Findings & Provenance */}
        {showSkeleton ? (
          <FindingsSkeleton />
        ) : (
          <div className="mt-6 space-y-4">
            <FindingsPanel
              findings={result.findings}
              mannKendall={result.mann_kendall}
              sensSlope={result.sens_slope}
              linearRegression={result.linear_regression}
              provenance={provenance}
              limitations={result.limitations}
            />
          </div>
        )}

        {/* Action Bar */}
        {showSkeleton ? (
          <ActionBarSkeleton />
        ) : (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line/50 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-lg border border-line bg-base text-[11px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
                title="Copy a shareable link to this investigation"
              >
                {copied ? (
                  <>
                    <ArrowRight className="h-3.5 w-3.5 text-significant" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Link2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    Copy link
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-lg border border-line bg-base text-[11px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
                title="Download data as CSV"
              >
                <Download className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-lg border border-line bg-base text-[11px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
                title="Download full results as JSON"
              >
                <FileJson className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNewInvestigation}
              className="inline-flex items-center gap-1.5 min-h-10 px-5 rounded-lg bg-accent text-inverse font-semibold text-[11px] transition hover:bg-accent-deep"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              Start new investigation
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-line/50 bg-base/50 px-4 py-4 text-center text-[10px] text-muted">
          <a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer" className="text-accent hover:underline">
            Data source: NASA POWER
          </a> · Imagery: NASA GIBS VIIRS Black Marble
        </footer>
      </main>
    </div>
  );
}