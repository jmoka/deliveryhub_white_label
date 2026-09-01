import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from './AppIcon';
import { getTermos } from '../hooks/useTerminologiaEstabelecimento';

// Pinos coloridos via divIcon (sem depender de imagem externa) — laranja pro
// restaurante (cor da marca), azul pro endereço de entrega.
const pinoIcon = (cor) =>
  L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${cor};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const PINO_RESTAURANTE = pinoIcon('#FF441F');
const PINO_ENTREGA = pinoIcon('#2563EB');

// Mapa somente-leitura mostrando o ponto do restaurante e o do endereço de
// entrega, com legenda — usado onde já mostramos a distância/excedente
// calculado, pra dar contexto visual de onde os dois pontos ficam.
const MapaDistanciaEntrega = ({ restauranteLat, restauranteLng, clienteLat, clienteLng, distanciaKm, tipoRestaurante = true }) => {
  const termos = getTermos(tipoRestaurante);
  const temRestaurante = restauranteLat != null && restauranteLng != null;
  const temCliente = clienteLat != null && clienteLng != null;

  if (!temRestaurante || !temCliente) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F4F4F5] dark:bg-[#27272A] rounded-xl text-xs text-[#71717A] dark:text-[#A1A1AA]">
        <Icon name="MapPinOff" size={14} className="flex-shrink-0" />
        Não foi possível localizar {!temRestaurante ? `o ${termos.estabelecimento.toLowerCase()}` : 'o endereço de entrega'} no mapa.
      </div>
    );
  }

  const bounds = L.latLngBounds([
    [restauranteLat, restauranteLng],
    [clienteLat, clienteLng],
  ]).pad(0.3);

  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-[#E4E4E7] dark:border-[#3F3F46]" style={{ height: 220 }}>
        <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[restauranteLat, restauranteLng]} icon={PINO_RESTAURANTE}>
            <Popup>{termos.estabelecimento}</Popup>
          </Marker>
          <Marker position={[clienteLat, clienteLng]} icon={PINO_ENTREGA}>
            <Popup>Endereço de entrega</Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#71717A] dark:text-[#A1A1AA]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF441F] flex-shrink-0" /> {termos.estabelecimento}
          </span>
          <span className="flex items-center gap-1.5 text-[#71717A] dark:text-[#A1A1AA]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] flex-shrink-0" /> Entrega
          </span>
        </div>
        {distanciaKm != null && (
          <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{distanciaKm}km</span>
        )}
      </div>
    </div>
  );
};

export default MapaDistanciaEntrega;
