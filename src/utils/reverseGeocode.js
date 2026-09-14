// Endereço em texto a partir de uma coordenada — usado sempre que o cliente
// ajusta o pino no mapa, pra manter o texto digitado seguindo a localização
// confirmada (fonte de verdade passa a ser o pino, não o contrário). Mesmo
// Nominatim usado no resto do app, chamado direto do navegador.
export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url);
    const d = await res.json();
    const a = d?.address ?? {};
    return {
      logradouro: a.road ?? a.pedestrian ?? '',
      numero: a.house_number ?? '',
      bairro: a.suburb ?? a.neighbourhood ?? a.quarter ?? '',
      cidade: a.city ?? a.town ?? a.village ?? a.municipality ?? '',
      estado: a.state ?? '',
      cep: (a.postcode ?? '').replace(/\D/g, ''),
    };
  } catch {
    return null;
  }
};

// Endereço brasileiro completo (rua + número + bairro + CEP numa query só)
// costuma dar ZERO resultado no Nominatim — mesmo problema já documentado no
// GeocodingService do backend (motoboy/geocoding.service.ts). Tenta do mais
// específico pro mais genérico, igual lá, em vez de uma query única.
const construirQueriesBr = (a) => {
  const candidatos = [
    [a?.logradouro, a?.numero, a?.bairro, a?.cidade, a?.estado, a?.cep],
    [a?.logradouro, a?.numero, a?.cidade, a?.estado],
    [a?.logradouro, a?.bairro, a?.cidade, a?.estado],
    [a?.logradouro, a?.cidade, a?.estado],
  ].map((partes) => partes.filter((p) => p?.toString().trim()).join(', '));
  return [...new Set(candidatos.filter(Boolean))];
};

// Coordenada a partir do endereço em texto — inverso do reverseGeocode acima,
// usado quando o cliente digita/CEP resolve o endereço e o pino precisa seguir
// automaticamente (sem precisar arrastar manualmente pra um endereço já limpo).
export const geocodeEndereco = async (addressJson) => {
  for (const q of construirQueriesBr(addressJson)) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;
      const res = await fetch(url);
      const d = await res.json();
      if (d?.length) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
    } catch {
      // tenta a próxima combinação, mais genérica
    }
  }
  return null;
};
