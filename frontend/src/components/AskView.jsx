import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'wouter';
import { ArrowRight, Search, Crosshair, Loader2, Sun, Cloud, Droplet, MapPin } from 'lucide-react';
import LocationSearch from './LocationSearch';
import { BENCHMARK, selectionToSearchParams } from '../utils/url';
import { findLocationForCoords } from '../data/locations';
import { formatCoord } from '../utils/format';

const VARIABLE_OPTIONS = [
  {
    id: 'T2M',
    label: 'Temperature',
    description: 'Near-surface air temperature (°C)',
    icon: Sun,
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/30',
  },
  {
    id: 'PRECTOTCORR',
    label: 'Rainfall',
    description: 'Bias-corrected precipitation (mm/day)',
    icon: Cloud,
    color: 'text-cool',
    bg: 'bg-cool/10 border-cool/30',
  },
  {
    id: 'ALLSKY_SFC_SW_DWN',
    label: 'Solar Irradiance',
    description: 'All-sky downward solar flux (kW·hr/m²/day)',
    icon: Droplet,
    color: 'text-amber',
    bg: 'bg-amber/10 border-amber/30',
  },
];

const PERIOD_PRESETS = [
  { label: 'Full record', value: 'full', description: 'All available years' },
  { label: 'Last 30 years', value: '30', description: 'Most recent 30 complete years' },
  { label: 'Last 20 years', value: '20', description: 'Most recent 20 complete years' },
  { label: 'Custom range', value: 'custom', description: 'Choose specific start/end years' },
];

export default function AskView({ variables, catalog, presets, onInvestigate, engineStatus }) {
  const [, navigate] = useLocation();
  const [selectedVariable, setSelectedVariable] = useState('T2M');
  const [selectedPreset, setSelectedPreset] = useState('full');
  const [customStart, setCustomStart] = useState(1990);
  const [customEnd, setCustomEnd] = useState(2023);
  const [latitude, setLatitude] = useState(BENCHMARK.latitude);
  const [longitude, setLongitude] = useState(BENCHMARK.longitude);
  const [place, setPlace] = useState(BENCHMARK.place);
  const [isLoading, setIsLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const variableMeta = variables.find(v => v.id === selectedVariable) || VARIABLE_OPTIONS[0];
  const minYear = variableMeta?.min_year ?? catalog?.min_year ?? 1981;
  const maxYear = variableMeta?.max_year ?? catalog?.max_year ?? 2026;
  const latestComplete = catalog?.latest_complete_year ?? 2025;

  // Update period bounds when variable changes
  useEffect(() => {
    const start = Math.max(minYear, latestComplete - 29);
    const end = latestComplete;
    setCustomStart(start);
    setCustomEnd(end);
  }, [minYear, maxYear, latestComplete]);

  const handleLocationSelect = useCallback((loc) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setPlace(loc.place);
    setGeoError(null);
  }, []);

  const handleMapSelect = useCallback((lat, lon) => {
    setLatitude(lat);
    setLongitude(lon);
    const match = findLocationForCoords(lat, lon);
    setPlace(match ? `${match.name}, ${match.admin}` : 'Custom point');
    setGeoError(null);
  }, []);

  const handleRun = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setGeoError(null);

    const startYear = selectedPreset === 'custom' ? customStart : Math.max(minYear, latestComplete - (selectedPreset === '30' ? 29 : 19));
    const endYear = selectedPreset === 'custom' ? customEnd : latestComplete;

    const params = selectionToSearchParams({
      variable: selectedVariable,
      latitude,
      longitude,
      startYear,
      endYear,
      place: place || 'Custom point',
    });

    navigate(`/investigate?${params.toString()}`);
    setIsLoading(false);
  }, [selectedVariable, selectedPreset, customStart, customEnd, latitude, longitude, place, minYear, latestComplete, navigate]);

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    if (preset === 'custom') return;
    const end = latestComplete;
    const start = Math.max(minYear, end - (preset === '30' ? 29 : 19));
    setCustomStart(start);
    setCustomEnd(end);
  };

  const isCustomValid = customStart >= minYear && customEnd <= maxYear && customStart <= customEnd && (customEnd - customStart + 1) >= 5;

  const currentVariable = VARIABLE_OPTIONS.find(v => v.id === selectedVariable);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-line/50 bg-base/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <span className="text-[14px] font-semibold uppercase tracking-[0.12em] text-accent">EarthScope</span>
            <span className="text-[10px] text-muted">NASA Space Apps 2026</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-ink mb-4">
              Investigate Earth System Trends
            </h1>
            <p className="text-[15px] text-muted max-w-xl mx-auto">
              Pick a variable, a place, and a period. Get a reproducible trend analysis with real NASA POWER observations.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-8">
            {/* Step 1: Location */}
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent mb-4">01 · Where</legend>
              <LocationSearch
                latitude={latitude}
                longitude={longitude}
                place={place}
                onSelect={handleLocationSelect}
                onMapSelect={handleMapSelect}
                disabled={isLoading}
              />
              {geoError && (
                <p className="mt-2 flex items-center gap-2 text-[11px] text-danger" role="alert">
                  <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                  {geoError}
                </p>
              )}
            </fieldset>

            {/* Step 2: Variable */}
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent mb-4">02 · What</legend>
              <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Select variable">
                {VARIABLE_OPTIONS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={selectedVariable === v.id}
                    onClick={() => setSelectedVariable(v.id)}
                    disabled={isLoading}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition ${selectedVariable === v.id ? 'border-2' : ''} ${v.bg} hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/50`}
                  >
                    <v.icon className={`h-7 w-7 ${v.color}`} aria-hidden="true" />
                    <span className="text-[13px] font-medium text-ink">{v.label}</span>
                    <span className="text-[11px] text-muted text-center">{v.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Step 3: Period */}
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent mb-4">03 · When</legend>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Select period preset">
                  {PERIOD_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      role="radio"
                      aria-checked={selectedPreset === p.value}
                      onClick={() => handlePresetSelect(p.value)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-left transition ${selectedPreset === p.value ? 'border-accent bg-accent/10' : 'border-line bg-base hover:border-accent/40'} focus:outline-none focus:ring-2 focus:ring-accent/50`}
                    >
                      <span className="text-[12px] font-medium text-ink">{p.label}</span>
                      <span className="text-[10px] text-muted">{p.description}</span>
                    </button>
                  ))}
                </div>

                {selectedPreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-line/50">
                    <div>
                      <label htmlFor="custom-start" className="block text-[11px] font-medium text-muted mb-1">Start year</label>
                      <input
                        id="custom-start"
                        type="number"
                        min={minYear}
                        max={maxYear}
                        value={customStart}
                        onChange={(e) => setCustomStart(Math.max(minYear, Math.min(maxYear, parseInt(e.target.value) || minYear)))}
                        disabled={isLoading}
                        className="w-full h-10 rounded-lg border border-line bg-base px-3 text-[13px] text-ink placeholder:text-muted/60 focus:border-accent/70 focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label htmlFor="custom-end" className="block text-[11px] font-medium text-muted mb-1">End year</label>
                      <input
                        id="custom-end"
                        type="number"
                        min={minYear}
                        max={maxYear}
                        value={customEnd}
                        onChange={(e) => setCustomEnd(Math.max(minYear, Math.min(maxYear, parseInt(e.target.value) || maxYear)))}
                        disabled={isLoading}
                        className="w-full h-10 rounded-lg border border-line bg-base px-3 text-[13px] text-ink placeholder:text-muted/60 focus:border-accent/70 focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted">
                  Available range for {variableMeta.name}: {minYear}–{maxYear} · Latest complete year: {latestComplete} · Minimum 5 years
                </p>
                {selectedPreset === 'custom' && !isCustomValid && (
                  <p className="text-[10px] text-danger" role="alert">Please enter a valid range (min 5 years, within available data).</p>
                )}
              </div>
            </fieldset>

            {/* Engine Status */}
            <div className="flex items-center justify-between pt-4 border-t border-line/50">
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <span className={`w-2 h-2 rounded-full ${engineStatus === 'online' ? 'bg-significant' : engineStatus === 'checking' ? 'bg-accent animate-pulse' : 'bg-danger'}`} aria-hidden="true" />
                <span>Engine: {engineStatus === 'online' ? 'Online' : engineStatus === 'checking' ? 'Checking…' : 'Offline'}</span>
              </div>
              <button
                type="button"
                onClick={handleRun}
                disabled={isLoading || (selectedPreset === 'custom' && !isCustomValid) || !place}
                className="inline-flex items-center gap-2 min-h-12 px-6 rounded-lg bg-accent text-inverse font-semibold text-[13px] transition hover:bg-accent-deep disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Investigating…
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    Investigate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Benchmark Link */}
          <p className="mt-6 text-center text-[11px] text-muted">
            Or try the <Link href={`/?${selectionToSearchParams(BENCHMARK).toString()}`} className="text-accent hover:underline">Abuja benchmark</Link> (Temperature, 1990–2023).
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line/50 bg-base/50 px-4 py-4 text-center text-[10px] text-muted">
        Real NASA POWER observations · No mock data · <a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer" className="text-accent hover:underline">Data source</a>
      </footer>
    </div>
  );
}