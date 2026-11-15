import { useState } from 'react';
import { Map, Maximize2 } from 'lucide-react';
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

export default function MapPreview({ latitude, longitude, onSelect, disabled }) {
  const [mapReady, setMapReady] = useState(false);

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