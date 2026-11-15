import { useState, useRef, useEffect } from 'react';
import { Map, Maximize2, Minimize2, Target } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function FullscreenMap({ latitude, longitude, onSelect, disabled, onClose }) {
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Default to world view if no coordinates
  const center = (latitude !== null && longitude !== null) ? [latitude, longitude] : [0, 0];
  const zoom = (latitude !== null && longitude !== null) ? 4 : 2;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-line bg-base/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Map className="h-6 w-6 text-accent" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Interactive Map</p>
            <p className="text-[11px] text-muted">Click to set location · ESC to close</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg border border-line bg-base text-muted hover:text-ink hover:bg-raised transition"
          aria-label="Exit fullscreen"
        >
          <Minimize2 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          ref={mapRef}
          center={center}
          zoom={zoom}
          minZoom={2}
          maxZoom={12}
          scrollWheelZoom
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png"
            maxZoom={12}
            maxNativeZoom={8}
            attribution='Imagery: NASA GIBS · VIIRS Black Marble'
          />
          {(latitude !== null && longitude !== null) && (
            <Marker position={[latitude, longitude]}>
              <div className="w-4 h-4 rounded-full bg-accent border-2 border-inverse shadow-lg" aria-hidden="true" />
            </Marker>
          )}
          <ClickHandler onSelect={onSelect} disabled={disabled} />
        </MapContainer>
      </div>
    </div>
  );
}

export default function MapPreview({ latitude, longitude, onSelect, disabled }) {
  const [mapReady, setMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default to world view if no coordinates
  const center = (latitude !== null && longitude !== null) ? [latitude, longitude] : [0, 0];
  const zoom = (latitude !== null && longitude !== null) ? 4 : 2;

  if (!mapReady && !isFullscreen) {
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

  if (isFullscreen) {
    return <FullscreenMap latitude={latitude} longitude={longitude} onSelect={onSelect} disabled={disabled} onClose={() => setIsFullscreen(false)} />;
  }

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={2}
        maxZoom={10}
        scrollWheelZoom={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png"
          maxZoom={10}
          maxNativeZoom={8}
          attribution='Imagery: NASA GIBS · VIIRS Black Marble'
        />
        {(latitude !== null && longitude !== null) && (
          <Marker position={[latitude, longitude]}>
            <div className="w-3 h-3 rounded-full bg-accent border-2 border-inverse shadow-lg" aria-hidden="true" />
          </Marker>
        )}
        <ClickHandler onSelect={onSelect} disabled={disabled} />
      </MapContainer>
      <button
        onClick={() => setIsFullscreen(true)}
        className="absolute bottom-2 right-2 p-1.5 rounded-lg border border-line bg-base/90 text-muted hover:text-ink hover:bg-raised transition shadow-md"
        aria-label="Open map fullscreen"
        title="Open fullscreen map"
      >
        <Maximize2 className="h-4 w-4" aria-hidden="true" />
      </button>
      {(latitude !== null && longitude !== null) && (
        <div className="absolute bottom-2 left-2 p-1.5 rounded-lg border border-line bg-base/90 text-[10px] text-muted shadow-md">
          <Target className="h-3 w-3 inline mr-1" />
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      )}
    </div>
  );
}