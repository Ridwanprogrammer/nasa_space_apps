import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { AlertTriangle, Download, FileJson, Link2, X, RotateCcw } from 'lucide-react';
import Header from './components/Header';
import AskView from './components/AskView';
import AnswerView from './components/AnswerView';
import MethodologyModal from './components/MethodologyModal';
import LoadingSkeleton from './components/LoadingSkeleton';
import { fetchCatalog, fetchPresets, runInvestigation } from './utils/api';
import { BENCHMARK, selectionFromUrl, selectionToSearchParams, normalizeSelection, writeSelectionToUrl } from './utils/url';
import { downloadFile, slugify, toCsv } from './utils/format';
import { findLocationForCoords } from './data/locations';

const RECENT_KEY = 'earthscope.recent.v1';

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
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
  const [location, navigate] = useLocation();
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

  const resultVariableMeta = useMemo(
    () => variables.find((item) => item.id === result?.provenance?.variable_id) || null,
    [result, variables]
  );

  const isOnAskPage = location === '/' || location === '';
  const isOnAnswerPage = location.startsWith('/investigate');

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
        if (!controller.signal.aborted && !loadedCatalog) setIsBootstrapping(false);
      }
    })();

    return () => controller.abort();
  }, [configAttempt]);

  // Keep the investigation reproducible in the URL (only on answer page).
  useEffect(() => {
    if (variables.length === 0 || !isOnAnswerPage) return;
    writeSelectionToUrl(selection);
  }, [selection, variables.length, isOnAnswerPage]);

  // Abort an in-flight request when the component unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    };
  }, []);

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
    if (autoRan.current || variables.length === 0 || !isOnAnswerPage) return;
    autoRan.current = true;

    // Validate the raw link values before normalization.
    const requestedMeta = variables.find((item) => item.id === selection.variable);
    if (!requestedMeta) {
      setIsBootstrapping(false);
      setLinkError(
        `This link requests "${selection.variable}", which is not in the NASA POWER catalog.`
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
  }, [variables, catalog, selection, enqueueInvestigation, isOnAnswerPage]);

  // Sync selection from URL when on answer page
  useEffect(() => {
    if (!isOnAnswerPage) return;
    const params = new URLSearchParams(window.location.search);
    const hasSelection = ['variable', 'lat', 'lon', 'start', 'end'].every((key) => params.has(key));
    if (!hasSelection) return;

    const target = {
      variable: params.get('variable') || BENCHMARK.variable,
      latitude: Number(params.get('lat')),
      longitude: Number(params.get('lon')),
      startYear: parseInt(params.get('start'), 10),
      endYear: parseInt(params.get('end'), 10),
      place: params.get('place') || null,
    };

    const requestedMeta = variables.find((item) => item.id === target.variable);
    if (!requestedMeta) return;

    const validation = getValidation(target, requestedMeta, catalog);
    if (!validation.valid) return;

    const normalized = normalizeSelection(target, variables, catalog);
    setSelection(normalized);
  }, [location, variables, catalog, isOnAnswerPage]);

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

  const handleRunBenchmark = useCallback(() => {
    const target = normalizeSelection({ ...BENCHMARK }, variables, catalog);
    setSelection(target);
    enqueueInvestigation(target);
  }, [catalog, enqueueInvestigation, variables]);

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

  const closeMethodology = useCallback(() => setMethodologyOpen(false), []);

  const retryConfig = useCallback(() => {
    setError(null);
    setIsBootstrapping(true);
    setEngineStatus('checking');
    setConfigAttempt((attempt) => attempt + 1);
  }, []);

  const showInitialLoading = isBootstrapping || (isLoading && !result);
  const isUiBusy = isBootstrapping || isLoading;
  const retry = variables.length === 0 ? retryConfig : () => enqueueInvestigation(selection);

  // Render appropriate view based on route
  const renderContent = () => {
    if (isOnAnswerPage) {
      return (
        <AnswerView
          result={result}
          selection={selection}
          variables={variables}
          catalog={catalog}
          presets={presets}
          onRun={() => enqueueInvestigation(selection)}
          onReset={() => {
            const target = normalizeSelection({ ...BENCHMARK }, variables, catalog);
            setSelection(target);
            enqueueInvestigation(target);
          }}
          onSelectRecent={(run) => {
            const target = normalizeSelection(
              { ...run, place: run.place === 'Custom point' ? null : run.place },
              variables,
              catalog
            );
            setSelection(target);
            const meta = variables.find((item) => item.id === target.variable) || null;
            if (getValidation(target, meta, catalog).valid) enqueueInvestigation(target);
          }}
          recentRuns={recentRuns}
          engineStatus={engineStatus}
          isLoading={isLoading}
          stale={stale}
          dirty={Boolean(resultSelection) && !sameSelection(selection, resultSelection)}
        />
      );
    }

    // Ask view (landing page)
    return (
      <AskView
        variables={variables}
        catalog={catalog}
        presets={presets}
        onInvestigate={() => {}}
        engineStatus={engineStatus}
      />
    );
  };

  return (
    <div className="min-h-screen bg-base text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-[12px] focus:font-semibold focus:text-inverse"
      >
        Skip to main content
      </a>

      <Header
        onOpenMethodology={() => setMethodologyOpen(true)}
        engineStatus={engineStatus}
        provenance={result?.provenance}
      />

      <main id="main-content" aria-busy={isUiBusy} className="min-h-[calc(100vh-4rem)]">
        {showInitialLoading ? (
          <LoadingSkeleton />
        ) : (
          renderContent()
        )}
      </main>

      {linkError && (
        <div
          role="alert"
          className="fixed bottom-4 left-4 right-4 md:bottom-20 md:left-auto md:right-4 md:w-96 z-50 flex flex-col gap-3 rounded-xl border border-accent/45 bg-accent/[0.08] p-3.5 shadow-xl animate-in slide-in-from-bottom-2 duration-300"
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
          className="fixed bottom-4 left-4 right-4 md:bottom-20 md:left-auto md:right-4 md:w-96 z-50 flex flex-col gap-3 rounded-xl border border-danger/45 bg-danger/[0.08] p-3.5 shadow-xl animate-in slide-in-from-bottom-2 duration-300"
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
              disabled={isLoading || (variables.length > 0 && !getValidation(selection, variableMeta, catalog).valid)}
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

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <MethodologyModal isOpen={methodologyOpen} onClose={() => setMethodologyOpen(false)} />
    </div>
  );
}

// Helper function moved outside component for use in effects
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