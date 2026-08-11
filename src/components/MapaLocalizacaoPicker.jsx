import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import Icon from './AppIcon';

// Vite não resolve os ícones padrão do Leaflet via CSS relativo — aponta pros
// assets importados (fica no bundle, não depende de CDN externo).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const BRASIL_CENTRO = { lat: -14.235, lng: -51.9253 };

const ClickHandler = ({ onPick }) => {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

// Pino arrastável pra calibrar a localização exata do estabelecimento — o geocode
// automático (Nominatim) frequentemente erra rooftop-level em endereço brasileiro,
// o que quebra o filtro de raio pequeno (20m-100m) mesmo o cliente estando no lugar
// certo. Isso aqui é a fonte de verdade quando o dono confirma manualmente.
const MapaLocalizacaoPicker = ({ lat, lng, onChange }) => {
  const [posicao, setPosicao] = useState(
    lat != null && lng != null ? { lat, lng } : BRASIL_CENTRO,
  );
  const [zoom, setZoom] = useState(lat != null && lng != null ? 17 : 4);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (lat != null && lng != null) {
      setPosicao({ lat, lng });
      setZoom((z) => (z < 15 ? 17 : z));
    }
  }, [lat, lng]);

  const mover = (novoLat, novoLng) => {
    const p = { lat: novoLat, lng: novoLng };
    setPosicao(p);
    onChange(p.lat, p.lng);
  };

  const usarGpsAtual = () => {
    if (!navigator.geolocation) return;
    setBuscandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mover(pos.coords.latitude, pos.coords.longitude);
        setZoom(18);
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 18);
        setBuscandoGps(false);
      },
      () => setBuscandoGps(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          Arraste o pino até a porta do estabelecimento — quanto mais perto o zoom, mais preciso.
        </p>
        <button type="button" onClick={usarGpsAtual} disabled={buscandoGps}
          className="flex items-center gap-1 text-xs font-semibold text-[#FF441F] whitespace-nowrap ml-2 disabled:opacity-50">
          <Icon name="LocateFixed" size={14} className={buscandoGps ? 'animate-spin' : ''} />
          {buscandoGps ? 'Localizando...' : 'Usar GPS agora'}
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border border-[#E4E4E7] dark:border-[#3F3F46]" style={{ height: 280 }}>
        <MapContainer center={[posicao.lat, posicao.lng]} zoom={zoom} style={{ height: '100%', width: '100%' }}
          ref={mapRef}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker
            position={[posicao.lat, posicao.lng]}
            draggable
            eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); mover(p.lat, p.lng); } }} />
          <ClickHandler onPick={mover} />
        </MapContainer>
      </div>

      <p className="text-[11px] text-[#A1A1AA] mt-1.5 font-mono">
        {posicao.lat.toFixed(6)}, {posicao.lng.toFixed(6)}
      </p>
    </div>
  );
};

export default MapaLocalizacaoPicker;
