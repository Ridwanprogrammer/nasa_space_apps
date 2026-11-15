import { useEffect, useMemo, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Rectangle,
  Popup,
  ScaleControl,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { Compass, Info, MousePointerClick, Maximize2, Minimize2, X } from 'lucide-react';
import { formatCoord } from '../utils/format';
import { palette } from '../utils/theme';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

function MapRecenter({ latitude, longitude, reduceMotion }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: !reduceMotion });
  }, [latitude, longitude, map, reduceMotion]);
  return null;
}

function MapClickHandler({ onSelectCoords }) {
  useMapEvents({
    click(event) {
      onSelectCoords(
        Number(event.latlng.lat.toFixed(4)),
        Number(event.latlng.lng.toFixed(4))
      );
    }
  });
  return null;
}

// Leaflet caches its container size. When the chart column grows (a table
// opens) this panel changes height, so tell Leaflet to re-measure and repaint.
function MapResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === 'undefined') return undefined;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

export default function SpatialMap({
  latitude,
  longitude,
  onSelectCoords,
  spatialMeaning,
  variableMeta,
  place,
  isPreview = false
}) {
  const reduceMotion = usePrefersReducedMotion();
  const [tileFailures, setTileFailures] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const latResolution = Number(variableMeta?.lat_resolution ?? 0.5);
  const lonResolution = Number(variableMeta?.lon_resolution ?? 0.625);

  const bounds = useMemo(() => {
    const latHalf = latResolution / 2;
    const lonHalf = lonResolution / 2;
    return [
      [Math.max(-90, latitude - latHalf), Math.max(-180, longitude - lonHalf)],
      [Math.min(90, latitude + latHalf), Math.min(180, longitude + lonHalf)]
    ];
  }, [latitude, longitude, latResolution, lonResolution]);

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: 'earthscope-marker',
        html: '<span></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      }),
    []
  );

  const mapContent = (
    <>
      <TileLayer
        attribution='Imagery: NASA <a href="https://gibs.earthdata.nasa.gov/" target="_blank" rel="noreferrer">GIBS</a> · VIIRS Black Marble (Suomi NPP)'
        url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png"
        maxZoom={12}
        maxNativeZoom={8}
        eventHandlers={{
          tileerror: () => setTileFailures((count) => Math.min(count + 1, 99))
        }}
      />
      <MapRecenter latitude={latitude} longitude={longitude} reduceMotion={reduceMotion} />
      <MapClickHandler onSelectCoords={onSelectCoords} />
      <MapResize />
      <ScaleControl position="bottomright" imperial={false} />

      <Rectangle
        bounds={bounds}
        pathOptions={{
          color: palette.accent,
          weight: 1.4,
          fillColor: palette.accent,
          fillOpacity: 0.12,
          dashArray: '5 4'
        }}
      >
        <Popup>
          <div className="text-[11px]">
            <strong className="mb-1 block text-[12px] text-ink">NASA POWER grid cell</strong>
            <span className="block text-muted">
              {latResolution}° latitude × {lonResolution}° longitude
            </span>
            <span className="block text-muted">
              Center {formatCoord(latitude, 'lat')}, {formatCoord(longitude, 'lon')}
            </span>
            <span className="mt-1 block text-[10px] text-muted">
              {variableMeta?.source?.replace(' (via NASA POWER)', '') || 'NASA POWER'}
            </span>
          </div>
        </Popup>
      </Rectangle>

      <Marker position={[latitude, longitude]} icon={markerIcon}>
        <Popup>
          <div className="text-[11px]">
            <strong className="mb-1 block text-[12px] text-ink">{place || 'Custom point'}</strong>
            <span className="numeric block font-mono text-muted">
              {formatCoord(latitude, 'lat')}, {formatCoord(longitude, 'lon')}
            </span>
          </div>
        </Popup>
      </Marker>
    </>
  );

  // Fullscreen modal
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-base flex flex-col" role="dialog" aria-modal="true" aria-labelledby="fs-map-title">
        <div className="flex items-center justify-between p-4 border-b border-line bg-base/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Compass className="h-6 w-6 text-accent" aria-hidden="true" />
            <div>
              <h2 id="fs-map-title" className="font-semibold text-ink">Spatial Footprint — Fullscreen</h2>
              <p className="text-[11px] text-muted">ESC or click ✕ to exit · Scroll to zoom · Click to inspect</p>
            </div>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 rounded-lg border border-line bg-base text-muted hover:text-ink hover:bg-raised transition"
            aria-label="Exit fullscreen"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 relative">
          <MapContainer
            ref={mapContainerRef}
            center={[latitude, longitude]}
            zoom={6}
            minZoom={2}
            maxZoom={14}
            scrollWheelZoom
            attributionControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            {mapContent}
          </MapContainer>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="map-heading"
      className="flex flex-col rounded-xl border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2 border-b border-line/80 pb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-accent">Geography</p>
          <h2 id="map-heading" className="mt-0.5 flex items-center gap-2 text-[14px] font-semibold tracking-tight text-ink">
            <Compass className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            Spatial footprint
          </h2>
          <p className="mt-0.5 truncate text-[10px] text-muted">
            {latResolution}° × {lonResolution}° NASA POWER grid cell
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-base px-2 py-1 text-[9px] text-muted">
            <MousePointerClick className="h-3 w-3 text-accent" aria-hidden="true" />
            Click map
          </span>
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg border border-line bg-base/80 text-muted hover:text-ink hover:bg-raised transition"
            aria-label="Open map fullscreen"
            title="Open fullscreen map"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p id="map-help" className="sr-only">
        Interactive map of the selected point. Click anywhere to move the investigation point. Use the
        plus and minus keys to zoom and arrow keys to pan. The dashed rectangle is the native NASA POWER
        grid cell, not an administrative boundary.
      </p>

      <div
        role="region"
        aria-label={`Map centered at ${formatCoord(latitude, 'lat')}, ${formatCoord(longitude, 'lon')}`}
        aria-describedby="map-help"
        className="relative mt-3 h-[300px] overflow-hidden rounded-lg border border-line bg-base"
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={6}
          minZoom={2}
          maxZoom={12}
          scrollWheelZoom
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          {mapContent}
        </MapContainer>

        {tileFailures > 2 && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 rounded-md border border-accent/40 bg-base/90 px-2.5 py-1.5 text-[9px] leading-snug text-accent backdrop-blur-sm">
            NASA imagery could not load. The grid cell and coordinates still describe the analysis point.
          </div>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[72%] rounded-lg border border-line bg-base/85 px-2.5 py-1.5 backdrop-blur-sm">
          <p className="truncate text-[10px] font-medium text-ink">{place || 'Custom point'}</p>
          <p className="numeric font-mono text-[9px] text-muted">
            {formatCoord(latitude, 'lat')}, {formatCoord(longitude, 'lon')}
          </p>
          {isPreview && (
            <p className="mt-0.5 text-[9px] font-medium text-accent">Preview · run to analyze this point</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[9px] text-muted/70">
        <span>
          Imagery: NASA{' '}
          <a
            href="https://gibs.earthdata.nasa.gov/"
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-accent hover:underline"
          >
            GIBS
          </a>{' '}
          · VIIRS Black Marble (Suomi NPP)
        </span>
        <span>Contextual imagery · not the variable layer</span>
      </div>

      <div className="mt-2 flex items-start gap-2 rounded-lg border border-line/70 bg-base/60 p-2.5 text-[10px] leading-relaxed text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
        <p>
          {spatialMeaning ||
            `The result describes one ${latResolution}° × ${lonResolution}° grid cell. It is not an area-weighted average for a state, province, or country.`}
        </p>
      </div>
    </section>
  );
}
