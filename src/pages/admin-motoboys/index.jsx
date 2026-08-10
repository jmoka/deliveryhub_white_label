import React, { useState, useEffect, useCallback } from 'react';
import { getMotoboysAdmin, getMotoboyDetalheAdmin, aprovarMotoboyAdmin, recusarMotoboyAdmin } from '../../services/adminService';
import Icon from '../../components/AppIcon';
import AdminHeader from '../../components/admin/AdminHeader';

const STATUS_LABEL = {
  pendente: { label: 'Pendente', cls: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  aprovado: { label: 'Aprovado', cls: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' },
  recusado: { label: 'Recusado', cls: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
};

const Badge = ({ status }) => {
  const s = STATUS_LABEL[status] ?? { label: status, cls: 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

const Documento = ({ label, url }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">{label}</p>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden hover:border-blue-400">
        <img src={url} alt={label} className="w-full h-32 object-cover" />
      </a>
    ) : (
      <div className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl h-32 flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500">
        Não enviado
      </div>
    )}
  </div>
);

const DetalheModal = ({ motoboyId, onClose, onAtualizado }) => {
  const [mb, setMb] = useState(null);
  const [erro, setErro] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [mostrarRecusa, setMostrarRecusa] = useState(false);

  const carregar = useCallback(() => {
    getMotoboyDetalheAdmin(motoboyId).then(setMb).catch((e) => setErro(e.message));
  }, [motoboyId]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleAprovar = async () => {
    setProcessando(true);
    setErro(null);
    try {
      await aprovarMotoboyAdmin(motoboyId);
      onAtualizado();
    } catch (e) {
      setErro(e.message);
    } finally {
      setProcessando(false);
    }
  };

  const handleRecusar = async () => {
    setProcessando(true);
    setErro(null);
    try {
      await recusarMotoboyAdmin(motoboyId, motivo.trim() || undefined);
      onAtualizado();
    } catch (e) {
      setErro(e.message);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {!mb ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {mb.foto_perfil_url
                  ? <img src={mb.foto_perfil_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  : <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center"><Icon name="User" size={20} className="text-gray-400 dark:text-zinc-500" /></div>}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-zinc-100">{mb.name}</h3>
                  <Badge status={mb.status_plataforma} />
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100">
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className="space-y-1 text-sm text-gray-600 dark:text-zinc-400 mb-4">
              {mb.phone && <p className="flex items-center gap-2"><Icon name="Phone" size={13} /> {mb.phone}</p>}
              {mb.email && <p className="flex items-center gap-2"><Icon name="Mail" size={13} /> {mb.email}</p>}
              {mb.revisoes_solicitadas > 0 && (
                <p className="flex items-center gap-2"><Icon name="RotateCcw" size={13} /> {mb.revisoes_solicitadas} pedido(s) de revisão já usado(s)</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Documento label="Documento (frente)" url={mb.documento_frente_url} />
              <Documento label="Documento (verso)" url={mb.documento_verso_url} />
              <Documento label="Comprovante de endereço" url={mb.comprovante_endereco_url} />
            </div>

            {mb.status_plataforma === 'recusado' && mb.motivo_recusa_plataforma && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 mb-4">
                Motivo da recusa: {mb.motivo_recusa_plataforma}
              </p>
            )}

            {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 mb-4">{erro}</p>}

            {mostrarRecusa ? (
              <div className="space-y-2">
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Motivo da recusa (opcional)"
                  rows={2}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                <div className="flex gap-2">
                  <button onClick={() => setMostrarRecusa(false)} disabled={processando}
                    className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-700 dark:text-zinc-300">
                    Voltar
                  </button>
                  <button onClick={handleRecusar} disabled={processando}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                    {processando ? 'Enviando...' : 'Confirmar recusa'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setMostrarRecusa(true)} disabled={processando || mb.status_plataforma === 'recusado'}
                  className="flex-1 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40">
                  Recusar
                </button>
                <button onClick={handleAprovar} disabled={processando || mb.status_plataforma === 'aprovado'}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                  {processando ? 'Enviando...' : 'Aprovar'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AdminMotoboys = () => {
  const [motoboys, setMotoboys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState('pendente');
  const [detalheId, setDetalheId] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getMotoboysAdmin(filtro || undefined)
      .then((d) => setMotoboys(d.motoboys ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  const FiltroBtn = ({ valor, label }) => (
    <button onClick={() => setFiltro(valor)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
        filtro === valor ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
      }`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/motoboys" title="Motoboys" subtitle="Aprove cadastros antes de liberar acesso aos estabelecimentos" />

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <FiltroBtn valor="pendente" label="Pendentes" />
          <FiltroBtn valor="aprovado" label="Aprovados" />
          <FiltroBtn valor="recusado" label="Recusados" />
          <FiltroBtn valor="" label="Todos" />
        </div>

        {erro && <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : motoboys.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-14 text-center">
            <Icon name="Bike" size={44} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500">Nenhum motoboy nesse filtro</p>
          </div>
        ) : (
          <div className="space-y-3">
            {motoboys.map((m) => (
              <button key={m.id} onClick={() => setDetalheId(m.id)}
                className="w-full text-left bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                {m.foto_perfil_url
                  ? <img src={m.foto_perfil_url} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0"><Icon name="User" size={18} className="text-gray-400 dark:text-zinc-500" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-zinc-100 truncate">{m.name}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{m.phone || m.email || '—'}</p>
                </div>
                <Badge status={m.status_plataforma} />
                <Icon name="ChevronRight" size={16} className="text-gray-300 dark:text-zinc-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>

      {detalheId && (
        <DetalheModal
          motoboyId={detalheId}
          onClose={() => setDetalheId(null)}
          onAtualizado={() => { setDetalheId(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminMotoboys;
