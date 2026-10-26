import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getVisitas, getEmpresas } from '../../services/adminService';
import AdminHeader from '../../components/admin/AdminHeader';

const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(v ?? 0);
const fmtData = (iso) => new Date(iso).toLocaleString('pt-BR');
const fmtDuracao = (segundos) => {
  const min = Math.floor((segundos ?? 0) / 60);
  const seg = Math.round((segundos ?? 0) % 60);
  return `${min}m ${seg}s`;
};

const BRASIL_CENTRO = [-14.235, -51.9253];

const Card = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300',
    green: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900 dark:text-purple-300',
  };
  return (
    <div className={`rounded-xl border p-5 min-w-0 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75 truncate">{label}</p>
      <p className="text-lg sm:text-2xl font-bold mt-1 truncate">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60 truncate">{sub}</p>}
    </div>
  );
};

const AdminAnalytics = () => {
  const [dados, setDados] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([getVisitas({ limite: 200 }), getEmpresas()])
      .then(([v, e]) => {
        setDados(v);
        setEmpresas(e?.empresas ?? []);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-600 dark:text-red-400 font-medium">{erro}</p>
    </div>
  );

  const resumo = dados?.resumo ?? {};
  const pontosMapa = dados?.pontos_mapa ?? [];
  const empresasOnline = empresas.filter((e) => e.aberto);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/analytics" title="Analytics" subtitle="Visitas ao site e empresas online" />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card label="Total de Visitas" value={fmtNum(resumo.total_visitas)} color="blue" />
          <Card label="Duração Média" value={fmtDuracao(resumo.duracao_media_segundos)} color="purple" />
          <Card label="Empresas Online" value={`${fmtNum(empresasOnline.length)} / ${fmtNum(empresas.length)}`} color="green" />
        </div>

        <section className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-4">Mapa de Visitas</h2>
          <div className="rounded-xl overflow-hidden border border-[#E4E4E7] dark:border-[#3F3F46]" style={{ height: 360 }}>
            <MapContainer center={BRASIL_CENTRO} zoom={4} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {pontosMapa.map((p, i) => (
                <CircleMarker key={i} center={[p.lat, p.lng]} radius={6} color="#FF441F" fillOpacity={0.6}>
                  <Popup>{[p.cidade, p.pais].filter(Boolean).join(', ') || 'Local desconhecido'}</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-4">Empresas Online Agora</h2>
          {empresasOnline.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">Nenhuma empresa aberta agora</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {empresasOnline.map((e) => (
                <span key={e.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {e.name}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-5 overflow-x-auto">
          <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-4">Visitas Recentes</h2>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-gray-500 dark:text-zinc-400 border-b dark:border-zinc-700">
                <th className="pb-2 pr-4">Data</th>
                <th className="pb-2 pr-4">IP</th>
                <th className="pb-2 pr-4">Local</th>
                <th className="pb-2 pr-4">Página</th>
                <th className="pb-2 pr-4">Duração</th>
              </tr>
            </thead>
            <tbody>
              {(dados?.visitas ?? []).map((v) => (
                <tr key={v.id} className="border-b dark:border-zinc-700 last:border-0">
                  <td className="py-2 pr-4 text-gray-700 dark:text-zinc-300 whitespace-nowrap">{fmtData(v.criado_em)}</td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-zinc-300 font-mono">{v.ip}</td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-zinc-300">{[v.cidade, v.pais].filter(Boolean).join(', ') || '—'}</td>
                  <td className="py-2 pr-4 text-gray-500 dark:text-zinc-400 truncate max-w-[180px]">{v.path_inicial}</td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-zinc-300">{fmtDuracao(v.duracao_segundos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(dados?.visitas ?? []).length === 0 && (
            <p className="text-sm text-gray-400 dark:text-zinc-500 mt-3">Nenhuma visita registrada ainda</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminAnalytics;
