import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Crosshair, MapPin, Search, X, Loader2, AlertCircle, Map, Maximize2 } from 'lucide-react';
import { searchLocations } from '../data/locations';
import { formatCoord } from '../utils/format';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapPreview({ latitude, longitude, onSelect, disabled }) {
  const [mapReady, setMapReady] = useState(false);

  function ClickHandler({ onSelect, disabled }) {
    useMapEvents({
      click(event) {
        if (disabled) return;
        onSelect(
          Number(event.latlng.lat.toFixed(4)),
          Number(event.latlng.lng.toFixed(4))
        );
      },
    });
    return null;
  }

  if (!mapReady) {
    return (
      <div
        className="aspect-video rounded-lg border border-line/50 bg-base/50 flex items-center justify-center"
        onClick={() => setMapReady(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setMapReady(true)}
        aria-label="Load interactive map"
      >
        <div className="text-center text-muted">
          <Map className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
          <p className="text-[11px]">Click to load map</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={4}
      minZoom={2}
      maxZoom={10}
      scrollWheelZoom={false}
      attributionControl={false}
      className="aspect-video rounded-lg overflow-hidden"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png"
        maxZoom={10}
        maxNativeZoom={8}
        attribution='Imagery: NASA GIBS · VIIRS Black Marble'
      />
      <Marker position={[latitude, longitude]}>
        <div className="w-3 h-3 rounded-full bg-accent border-2 border-inverse shadow-lg" aria-hidden="true" />
      </Marker>
      <ClickHandler onSelect={onSelect} disabled={disabled} />
    </MapContainer>
  );
}

export default function LocationSearch({ latitude, longitude, place, onSelect, onMapSelect, disabled = false }) {
  const listId = useId();
  const inputId = 'location-search-input';
  const hintId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState(place || '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [geoState, setGeoState] = useState('idle');
  const [geoError, setGeoError] = useState(null);

  const results = useMemo(() => searchLocations(query, 8), [query]);
  const currentLabel = place || 'Custom coordinates';

  useEffect(() => {
    // Keep the draft search text aligned with the selected place when the
    // parent changes it (preset, geolocation, map click, shared link).
    // oxlint-disable-next-line react/set-state-in-effect -- prop-to-draft sync for a combobox
    setQuery(place || '');
  }, [place]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const choose = (location) => {
    setQuery(location.name);
    setIsOpen(false);
    setActiveIndex(0);
    onSelect({
      latitude: location.lat,
      longitude: location.lon,
      place: `${location.name}, ${location.admin}`
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (isOpen && results[activeIndex]) {
        event.preventDefault();
        choose(results[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoState('error');
      setGeoError('This browser does not expose a geolocation API.');
      return;
    }

    setGeoState('locating');
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = Number(position.coords.latitude.toFixed(4));
        const nextLon = Number(position.coords.longitude.toFixed(4));
        setGeoState('idle');
        setQuery('My location');
        setIsOpen(false);
        onSelect({ latitude: nextLat, longitude: nextLon, place: 'My location' });
      },
      (error) => {
        setGeoState('error');
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Search a place or enter coordinates instead.'
            : error.code === error.TIMEOUT
              ? 'Location request timed out. Try again or enter coordinates manually.'
              : 'Your location could not be determined. Enter coordinates manually.';
        setGeoError(message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-[11px] font-medium text-muted">
          Location
        </label>
        <span className="text-[10px] text-muted/80">Offline gazetteer</span>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined}
          aria-describedby={hintId}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={query}
          placeholder="Search a city or climate site"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={(event) => {
            setIsOpen(true);
            if (place && event.target.value === place) event.target.select();
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          className="h-10 w-full rounded-lg border border-line bg-base pl-8 pr-8 text-[12px] text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/70 focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear location search"
            onClick={() => {
              setQuery('');
              setActiveIndex(0);
              setGeoError(null);
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 inline-grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-raised hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <p id={hintId} className="mt-1 truncate text-[10px] text-muted/80" title={currentLabel}>
        <MapPin className="mr-1 inline h-3 w-3 text-accent" aria-hidden="true" />
        {currentLabel} · {formatCoord(latitude, 'lat')}, {formatCoord(longitude, 'lon')}
      </p>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-lg border border-line bg-surface shadow-2xl">
          <p className="border-b border-line px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            {query ? 'Matches' : 'Suggested places'}
          </p>
          <ul id={listId} role="listbox" aria-label="Location matches" className="max-h-72 overflow-y-auto py-1">
            {results.map((location, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={location.id}
                  id={`${listId}-${location.id}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(location);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`mx-1 cursor-pointer rounded-md px-2.5 py-2 transition ${
                    isActive ? 'bg-raised' : 'hover:bg-raised/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-medium text-ink">{location.name}</span>
                    {location.type === 'climate' && (
                      <span className="shrink-0 rounded border border-cool/40 bg-cool/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cool">
                        Site
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-muted">
                    {location.admin} · {location.region}
                    {location.note ? ` · ${location.note}` : ''}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={locate}
        disabled={disabled || geoState === 'locating'}
        className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[11px] font-medium text-ink transition hover:border-accent/60 hover:bg-raised disabled:cursor-wait disabled:opacity-70"
      >
        {geoState === 'locating' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" aria-hidden="true" />
        ) : (
          <Crosshair className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        )}
        {geoState === 'locating' ? 'Locating…' : 'Use my location'}
      </button>

      {geoState === 'error' && geoError && (
        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-danger" role="alert">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{geoError}</span>
        </p>
      )}

      {onMapSelect && (
        <div className="mt-4 rounded-lg border border-line/50 bg-base/50 p-3">
          <p className="text-[10px] font-medium text-muted mb-2">Click map to set location</p>
          <MapPreview
            latitude={latitude}
            longitude={longitude}
            onSelect={onMapSelect}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
