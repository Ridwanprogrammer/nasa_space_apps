export const BENCHMARK = Object.freeze({
  variable: 'T2M',
  latitude: 9.0579,
  longitude: 7.4951,
  startYear: 1990,
  endYear: 2023,
  place: 'Abuja, Nigeria'
});

function finiteNumber(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Reads an investigation from the URL. Returns null when the URL does not carry
 * a complete, parseable selection, so callers can fall back to the benchmark.
 */
export function selectionFromUrl(fallback = BENCHMARK) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const hasSelection = ['variable', 'lat', 'lon', 'start', 'end'].every((key) => params.has(key));
  if (!hasSelection) return null;

  const selection = {
    variable: params.get('variable') || fallback.variable,
    latitude: finiteNumber(params.get('lat'), NaN),
    longitude: finiteNumber(params.get('lon'), NaN),
    startYear: Math.round(finiteNumber(params.get('start'), NaN)),
    endYear: Math.round(finiteNumber(params.get('end'), NaN)),
    place: params.get('place') || null
  };

  if (
    !Number.isFinite(selection.latitude) ||
    !Number.isFinite(selection.longitude) ||
    !Number.isFinite(selection.startYear) ||
    !Number.isFinite(selection.endYear)
  ) {
    return null;
  }

  return selection;
}

export function selectionToSearchParams(selection) {
  const params = new URLSearchParams();
  params.set('variable', selection.variable);
  params.set('lat', Number(selection.latitude).toFixed(4));
  params.set('lon', Number(selection.longitude).toFixed(4));
  params.set('start', String(selection.startYear));
  params.set('end', String(selection.endYear));
  if (selection.place) params.set('place', selection.place);
  return params;
}

export function buildShareUrl(selection) {
  const params = selectionToSearchParams(selection);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?${params.toString()}`;
}

export function writeSelectionToUrl(selection) {
  if (typeof window === 'undefined') return;
  const params = selectionToSearchParams(selection);
  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', next);
}

export function sameSelection(a, b) {
  if (!a || !b) return false;
  return (
    a.variable === b.variable &&
    Number(a.latitude) === Number(b.latitude) &&
    Number(a.longitude) === Number(b.longitude) &&
    Number(a.startYear) === Number(b.startYear) &&
    Number(a.endYear) === Number(b.endYear)
  );
}
