import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Download, FileJson, Link2, Settings2, X } from 'lucide-react';
import Header from './components/Header';
import InvestigationControls from './components/InvestigationControls';
import SpatialMap from './components/SpatialMap';
import TimeSeriesChart from './components/TimeSeriesChart';
import FindingsPanel from './components/FindingsPanel';
import ProvenanceDrawer from './components/ProvenanceDrawer';
import MethodologyModal from './components/MethodologyModal';
import ResultSummary from './components/ResultSummary';
import EmptyState from './components/EmptyState';
import LoadingSkeleton from './components/LoadingSkeleton';
import { fetchCatalog, fetchPresets, runInvestigation } from './utils/api';
import { BENCHMARK, buildShareUrl, sameSelection, selectionFromUrl, writeSelectionToUrl } from './utils/url';
import { downloadFile, slugify, toCsv } from './utils/format';
import { findLocationForCoords } from './data/locations';

const RECENT_KEY = 'earthscope.recent.v1';

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function normalizeSelection(selection, variables, catalog) {
  const meta = variables.find((item) => item.id === selection.variable) || variables[0];
  if (!meta) return selection;
  const minYear = meta.min_year ?? catalog?.min_year ?? 1981;
  const maxYear = meta.max_year ?? catalog?.max_year ?? 2026;
  return {
    ...selection,
    variable: meta.id,
    latitude: Number(clamp(selection.latitude, -90, 90, BENCHMARK.latitude).toFixed(4)),
    longitude: Number(clamp(selection.longitude, -180, 180, BENCHMARK.longitude).toFixed(4)),
    startYear: Math.round(clamp(selection.startYear, minYear, maxYear, BENCHMARK.startYear)),
    endYear: Math.round(clamp(selection.endYear, minYear, maxYear, BENCHMARK.endYear))
  };
}

function getValidation(selection, meta, catalog) {
  const result = {
    valid: false,
    message: null,
    latitudeInvalid: false,
    longitudeInvalid: false,
    startInvalid: false,
    endInvalid: false
  };

  if (!meta) {
    result.message = 'The NASA variable catalog is still loading.';
    return result;
  }

  const minPeriod = catalog?.min_period_years ?? 5;

  if (!Number.isFinite(selection.latitude) || selection.latitude < -90 || selection.latitude > 90) {
    result.latitudeInvalid = true;
    result.message = 'Latitude must be between −90° and +90°.';
    return result;
  }
  if (!Number.isFinite(selection.longitude) || selection.longitude < -180 || selection.longitude > 180) {
    result.longitudeInvalid = true;
    result.message = 'Longitude must be between −180° and +180°.';
    return result;
  }
  if (!Number.isInteger(selection.startYear) || selection.startYear < meta.min_year || selection.startYear > meta.max_year) {
    result.startInvalid = true;
    result.message = `${selection.variable} is available from ${meta.min_year} to ${meta.max_year}.`;
    return result;
  }
  if (!Number.isInteger(selection.endYear) || selection.endYear < meta.min_year || selection.endYear > meta.max_year) {
    result.endInvalid = true;
    result.message = `${selection.variable} is available from ${meta.min_year} to ${meta.max_year}.`;
    return result;
  }
  if (selection.startYear > selection.endYear) {
    result.startInvalid = true;
    result.endInvalid = true;
    result.message = 'The start year cannot be after the end year.';
    return result;
  }
  const span = selection.endYear - selection.startYear + 1;
  if (span < minPeriod) {
    result.startInvalid = true;
    result.endInvalid = true;
    result.message = `The analysis period must span at least ${minPeriod} calendar years (currently ${span}).`;
    return result;
  }

  result.valid = true;
  return result;
}

function readRecentRuns() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function persistRecentRuns(runs) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(runs));
  } catch {
    // Recent runs are a convenience; storage may be unavailable in private mode.
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard access was denied.');
}

export default function App() {
  const [variables, setVariables] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [presets, setPresets] = useState([]);
  const [selection, setSelection] = useState(() => selectionFromUrl() || { ...BENCHMARK });
  const [result, setResult] = useState(null);
  const [resultSelection, setResultSelection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState(null);
  const [linkError, setLinkError] = useState(null);
  const [stale, setStale] = useState(false);
  const [engineStatus, setEngineStatus] = useState('checking');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentRuns, setRecentRuns] = useState(readRecentRuns);
  const [announcement, setAnnouncement] = useState('');
  const [configAttempt, setConfigAttempt] = useState(0);

  const resultRef = useRef(null);
  const abortRef = useRef(null);
  const requestSeq = useRef(0);
  const autoRan = useRef(false);
  const copiedTimer = useRef(null);

  const variableMeta = useMemo(
    () => variables.find((item) => item.id === selection.variable) || null,
    [variables, selection.variable]
  );

  const validation = useMemo(
    () => getValidation(selection, variableMeta, catalog),
    [selection, variableMeta, catalog]
  );

  const dirty = Boolean(resultSelection) && !sameSelection(selection, resultSelection);

  const resultVariableMeta = useMemo(
    () => variables.find((item) => item.id === result?.provenance?.variable_id) || null,
    [result, variables]
  );

  // Load the variable catalog, availability metadata, and benchmark presets.
  useEffect(() => {
    const controller = new AbortController();
    let loadedCatalog = false;

    (async () => {
      try {
        const [catalogResponse, presetResponse] = await Promise.all([
          fetchCatalog({ signal: controller.signal }),
          fetchPresets({ signal: controller.signal })
        ]);
        if (controller.signal.aborted) return;
        loadedCatalog = catalogResponse.variables.length > 0;
        setVariables(catalogResponse.variables);
        setCatalog(catalogResponse.catalog);
        setPresets(presetResponse);
        setEngineStatus('online');
        setError(null);
      } catch (loadError) {
        if (loadError.name === 'AbortError') return;
        setEngineStatus('offline');
        setError(loadError.message || 'Failed to load the application configuration.');
      } finally {
        // When the catalog loaded, keep the bootstrapping state until the
        // automatic first investigation starts or is rejected.
        if (!controller.signal.aborted && !loadedCatalog) setIsBootstrapping(false);
      }
    })();

    return () => controller.abort();
  }, [configAttempt]);

  // Keep the investigation reproducible in the URL.
  useEffect(() => {
    if (variables.length === 0) return;
    writeSelectionToUrl(selection);
  }, [selection, variables.length]);

  // Abort an in-flight request when the component unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  // Lock background scrolling, contain focus, and support Escape for the
  // mobile control drawer, which behaves as a modal dialog.
  useEffect(() => {
    if (!mobileControlsOpen) return undefined;
    if (window.matchMedia('(min-width: 1024px)').matches) return undefined;
    const panel = document.getElementById('investigation-panel');
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusable = () =>
      panel
        ? Array.from(
            panel.querySelectorAll(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((element) => element.getClientRects().length > 0)
        : [];

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileControlsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused !== document.body) {
        previouslyFocused.focus();
      } else {
        document.getElementById('open-setup')?.focus();
      }
    };
  }, [mobileControlsOpen]);

  const enqueueInvestigation = useCallback(async (target) => {
    const requestId = ++requestSeq.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setLinkError(null);
    setStale(false);
    setAnnouncement('Running investigation. Acquiring NASA POWER observations and trend tests.');

    try {
      const data = await runInvestigation(
        {
          variable: target.variable,
          latitude: Number(target.latitude),
          longitude: Number(target.longitude),
          start_year: target.startYear,
          end_year: target.endYear
        },
        { signal: controller.signal }
      );

      if (requestId !== requestSeq.current) return;

      resultRef.current = data;
      setResult(data);
      setResultSelection(target);
      setStale(false);
      setEngineStatus('online');
      setAnnouncement(
        `Investigation complete. ${data.findings.direction} trend with ${data.mann_kendall.is_significant ? 'a statistically significant' : 'no statistically significant'} monotonic change.`
      );

      const recentEntry = {
        variable: target.variable,
        latitude: Number(target.latitude),
        longitude: Number(target.longitude),
        startYear: target.startYear,
        endYear: target.endYear,
        place: target.place || 'Custom point',
        timestamp: Date.now()
      };
      setRecentRuns((previous) => {
        const next = [
          recentEntry,
          ...previous.filter((entry) => !sameSelection(entry, target))
        ].slice(0, 5);
        persistRecentRuns(next);
        return next;
      });
    } catch (runError) {
      if (runError.name === 'AbortError' || requestId !== requestSeq.current) return;
      setError(runError.message || 'The investigation failed.');
      setStale(Boolean(resultRef.current));
      if (runError.kind === 'network') setEngineStatus('offline');
      setAnnouncement('The investigation failed.');
    } finally {
      if (requestId === requestSeq.current) {
        setIsLoading(false);
        setIsBootstrapping(false);
        abortRef.current = null;
      }
    }
  }, []);

  // Run the URL-selected investigation (or the benchmark) once the catalog is ready.
  useEffect(() => {
    if (autoRan.current || variables.length === 0) return;
    autoRan.current = true;

    // Validate the raw link values before normalization. Clamping an invalid
    // shared link (for example latitude 95) would silently analyze a different
    // place than the one the link claims.
    const requestedMeta = variables.find((item) => item.id === selection.variable);
    if (!requestedMeta) {
      // oxlint-disable-next-line react/set-state-in-effect -- malformed share link; release the loading skeleton
      setIsBootstrapping(false);
      setLinkError(
        `This link requests "${selection.variable}", which is not in the NASA POWER catalog. Choose a variable in Setup or load the benchmark.`
      );
      setAnnouncement('The shared link requests an unknown NASA variable.');
      return;
    }

    const targetValidation = getValidation(selection, requestedMeta, catalog);
    if (!targetValidation.valid) {
      setIsBootstrapping(false);
      setLinkError(`This shared link is not a valid investigation. ${targetValidation.message}`);
      setAnnouncement('The investigation settings in this link are not valid.');
      return;
    }

    const target = normalizeSelection(selection, variables, catalog);
    setSelection(target);
    enqueueInvestigation(target);
  }, [variables, catalog, selection, enqueueInvestigation]);

  const handleRun = useCallback(() => {
    if (!validation.valid) return;
    setMobileControlsOpen(false);
    enqueueInvestigation(selection);
  }, [enqueueInvestigation, selection, validation.valid]);

  const handleRunBenchmark = useCallback(() => {
    const target = normalizeSelection({ ...BENCHMARK }, variables, catalog);
    setSelection(target);
    setMobileControlsOpen(false);
    enqueueInvestigation(target);
  }, [catalog, enqueueInvestigation, variables]);

  const handleVariableChange = useCallback(
    (variableId) => {
      setSelection((previous) => normalizeSelection({ ...previous, variable: variableId }, variables, catalog));
    },
    [catalog, variables]
  );

  const handleSelectPreset = useCallback(
    (presetId) => {
      const preset = presets.find((item) => item.id === presetId);
      if (!preset) return;
      const match = findLocationForCoords(preset.latitude, preset.longitude);
      const place = match ? `${match.name}, ${match.admin}` : preset.name.replace(/\s*\(.*\)\s*$/, '');
      setSelection((previous) =>
        normalizeSelection(
          {
            ...previous,
            latitude: preset.latitude,
            longitude: preset.longitude,
            startYear: preset.default_start,
            endYear: preset.default_end,
            place
          },
          variables,
          catalog
        )
      );
    },
    [catalog, presets, variables]
  );

  const handleLocationChange = useCallback((next) => {
    setSelection((previous) => ({
      ...previous,
      latitude: Number(clamp(next.latitude, -90, 90, previous.latitude).toFixed(4)),
      longitude: Number(clamp(next.longitude, -180, 180, previous.longitude).toFixed(4)),
      place: next.place ?? null
    }));
  }, []);

  const handleMapSelect = useCallback((latitude, longitude) => {
    setSelection((previous) => ({
      ...previous,
      latitude,
      longitude,
      place: null
    }));
  }, []);

  const handleYearsChange = useCallback((startYear, endYear) => {
    setSelection((previous) => ({
      ...previous,
      startYear: Math.round(startYear),
      endYear: Math.round(endYear)
    }));
  }, []);

  const handleReset = useCallback(() => {
    setSelection(normalizeSelection({ ...BENCHMARK }, variables, catalog));
    setError(null);
    setLinkError(null);
  }, [catalog, variables]);

  const handleOpenSetup = useCallback(() => {
    if (!window.matchMedia('(min-width: 1024px)').matches) setMobileControlsOpen(true);
    window.setTimeout(() => document.getElementById('location-search-input')?.focus(), 90);
  }, []);

  const closeMethodology = useCallback(() => setMethodologyOpen(false), []);

  const retryConfig = useCallback(() => {
    setError(null);
    setIsBootstrapping(true);
    setEngineStatus('checking');
    setConfigAttempt((attempt) => attempt + 1);
  }, []);

  const handleSelectRecent = useCallback(
    (run) => {
      const target = normalizeSelection(
        { ...run, place: run.place === 'Custom point' ? null : run.place },
        variables,
        catalog
      );
      setSelection(target);
      setMobileControlsOpen(false);
      const meta = variables.find((item) => item.id === target.variable) || null;
      if (getValidation(target, meta, catalog).valid) enqueueInvestigation(target);
    },
    [catalog, enqueueInvestigation, variables]
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await copyText(buildShareUrl(resultSelection || selection));
      setCopied(true);
      setAnnouncement('Reproducible link copied to the clipboard.');
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch (copyError) {
      setError(copyError.message || 'Could not copy the link.');
    }
  }, [resultSelection, selection]);

  const fileBase = useMemo(() => {
    const source = resultSelection || selection;
    return [
      'earthscope',
      slugify(source.place || 'custom-point'),
      source.variable,
      `${source.startYear}-${source.endYear}`
    ].join('_');
  }, [resultSelection, selection]);

  const handleExportCsv = useCallback(() => {
    if (!result) return;
    const rows = result.annual_data.map((entry) => ({
      year: entry.year,
      annual_mean: entry.value,
      units: result.provenance.units,
      valid_months: entry.valid_months,
      is_complete: entry.is_complete
    }));
    const csv = toCsv(['year', 'annual_mean', 'units', 'valid_months', 'is_complete'], rows);
    downloadFile(`${fileBase}.csv`, `\ufeff${csv}`, 'text/csv;charset=utf-8');
    setAnnouncement('Annual data CSV downloaded.');
  }, [fileBase, result]);

  const handleExportJson = useCallback(() => {
    if (!result) return;
    const payload = {
      generator: 'EarthScope · NASA Space Apps 2026',
      exported_at: new Date().toISOString(),
      request: result.request,
      provenance: result.provenance,
      statistics: {
        linear_regression: result.linear_regression,
        mann_kendall: result.mann_kendall,
        sens_slope: result.sens_slope
      },
      findings: result.findings,
      limitations: result.limitations,
      annual_data: result.annual_data,
      monthly_data: result.monthly_data
    };
    downloadFile(`${fileBase}.json`, JSON.stringify(payload, null, 2), 'application/json');
    setAnnouncement('Full result JSON downloaded.');
  }, [fileBase, result]);

  const showInitialLoading = isBootstrapping || (isLoading && !result);
  const isUiBusy = isBootstrapping || isLoading;
  const retry = variables.length === 0 ? retryConfig : handleRun;

  return (
    <div className="min-h-screen bg-base text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-[12px] focus:font-semibold focus:text-inverse"
      >
        Skip to results
      </a>

      <Header
        onOpenMethodology={() => setMethodologyOpen(true)}
        engineStatus={engineStatus}
        provenance={result?.provenance}
      />

      <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
        <InvestigationControls
          variables={variables}
          catalog={catalog}
          selectedVariable={selection.variable}
          onChangeVariable={handleVariableChange}
          presets={presets}
          onSelectPreset={handleSelectPreset}
          latitude={selection.latitude}
          longitude={selection.longitude}
          place={selection.place}
          onChangeLocation={handleLocationChange}
          startYear={selection.startYear}
          endYear={selection.endYear}
          onYearsChange={handleYearsChange}
          onRun={handleRun}
          isLoading={isLoading}
          validation={validation}
          onReset={handleReset}
          dirty={dirty}
          stale={stale}
          recentRuns={recentRuns}
          onSelectRecent={handleSelectRecent}
          isMobileOpen={mobileControlsOpen}
          onCloseMobile={() => setMobileControlsOpen(false)}
        />

        <main
          id="main-content"
          aria-busy={isUiBusy}
          className="min-w-0 px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-8"
        >
          <div className="space-y-4">
            {showInitialLoading ? (
              <LoadingSkeleton />
            ) : result ? (
              <>
                <ResultSummary
                  result={result}
                  selection={resultSelection || selection}
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
                    provenance={result.provenance}
                    onClose={() => setProvenanceOpen(false)}
                  />
                )}
              </>
            ) : (
              <EmptyState onRunBenchmark={handleRunBenchmark} onOpenSetup={handleOpenSetup} />
            )}

            {linkError && (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-xl border border-accent/45 bg-accent/[0.08] p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-ink">Shared link rejected</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{linkError}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRunBenchmark}
                    className="inline-flex min-h-9 items-center rounded-lg border border-accent/50 bg-base/60 px-3 text-[10px] font-semibold text-ink transition hover:bg-raised"
                  >
                    Load benchmark
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkError(null)}
                    aria-label="Dismiss shared link warning"
                    className="inline-grid h-9 w-9 place-items-center rounded-lg border border-line bg-base/60 text-muted transition hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-xl border border-danger/45 bg-danger/[0.08] p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-ink">
                      {result ? 'Update failed · showing the last successful result' : 'Investigation error'}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{error}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={retry}
                    disabled={isLoading || (variables.length > 0 && !validation.valid)}
                    className="inline-flex min-h-9 items-center rounded-lg border border-danger/50 bg-base/60 px-3 text-[10px] font-semibold text-ink transition hover:bg-raised disabled:opacity-50"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    aria-label="Dismiss error"
                    className="inline-grid h-9 w-9 place-items-center rounded-lg border border-line bg-base/60 text-muted transition hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {result && (
              <>
                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="min-w-0 xl:col-span-2">
                    <TimeSeriesChart
                      annualData={result.annual_data}
                      monthlyData={result.monthly_data}
                      sensSlope={result.sens_slope}
                      linearRegression={result.linear_regression}
                      variableMeta={resultVariableMeta || variableMeta}
                    />
                  </div>
                  <div className="min-w-0 self-start">
                    <SpatialMap
                      latitude={selection.latitude}
                      longitude={selection.longitude}
                      onSelectCoords={handleMapSelect}
                      spatialMeaning={variableMeta?.spatial_meaning || result.provenance.spatial_meaning}
                      variableMeta={variableMeta}
                      place={selection.place}
                      isPreview={dirty}
                    />
                  </div>
                </div>

                <FindingsPanel
                  findings={result.findings}
                  mannKendall={result.mann_kendall}
                  sensSlope={result.sens_slope}
                  linearRegression={result.linear_regression}
                  provenance={result.provenance}
                  limitations={result.limitations}
                />

                <ProvenanceDrawer provenance={result.provenance} />
              </>
            )}

            <footer className="flex flex-col gap-2 border-t border-line/70 pb-2 pt-4 text-[9px] leading-relaxed text-muted sm:flex-row sm:items-start sm:justify-between">
              <p>
                EarthScope · NASA Space Apps 2026 · Real observations from{' '}
                <a
                  href="https://power.larc.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  NASA POWER
                </a>{' '}
                · No mock data
              </p>
              <p className="sm:text-right">
                Imagery: NASA Earth at Night (VIIRS City Lights 2012) and Black Marble via NASA GIBS.
                <br />
                Results describe a single native grid cell — not an administrative area average.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Compact mobile action bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 pt-2 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="open-setup"
            onClick={handleOpenSetup}
            aria-controls="investigation-panel"
            aria-expanded={mobileControlsOpen}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-base px-3 text-[11px] font-medium text-ink transition hover:border-accent/50"
          >
            <Settings2 className="h-4 w-4 text-accent" aria-hidden="true" />
            Setup
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={isLoading || !validation.valid}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-[11px] font-semibold text-inverse transition hover:bg-accent-deep disabled:opacity-55"
          >
            {isLoading ? 'Running…' : 'Run investigation'}
          </button>
          {result && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="Copy link to this investigation"
                className="inline-grid h-11 w-10 place-items-center rounded-lg border border-line bg-base text-accent transition hover:bg-raised"
              >
                <Link2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                aria-label="Download annual data as CSV"
                className="inline-grid h-11 w-10 place-items-center rounded-lg border border-line bg-base text-accent transition hover:bg-raised"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                aria-label="Download full result as JSON"
                className="inline-grid h-11 w-10 place-items-center rounded-lg border border-line bg-base text-accent transition hover:bg-raised"
              >
                <FileJson className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <MethodologyModal isOpen={methodologyOpen} onClose={closeMethodology} />
    </div>
  );
}
