import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarMotoboys, listarSolicitacoesMotoboy, aceitarSolicitacaoMotoboy,
  recusarSolicitacaoMotoboy, removerAfiliacaoMotoboy,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Motoboys', path: '/restaurante/motoboys' },
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <nav className="flex gap-1.5 flex-wrap">
      {links.map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            active === l.path
              ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30'
              : 'text-[#27272A] hover:bg-[#F4F4F5]'
          }`}>
          {l.label}
        </button>
      ))}
    </nav>
  );
};

const FichaModal = ({ solicitacao, onFechar, onAceitar, onRecusar, processando }) => {
  const [motivo, setMotivo] = useState('');
  const [mostrarRecusa, setMostrarRecusa] = useState(false);
  const mb = solicitacao.motoboy;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
            {mb.foto_perfil_url
              ? <img src={mb.foto_perfil_url} alt={mb.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Icon name="User" size={24} className="text-[#A1A1AA]" /></div>}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{mb.name}</h3>
            <p className="text-sm text-gray-500">{mb.phone}</p>
            <p className="text-xs text-gray-400">{mb.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase">Documentos</p>
          <div className="grid grid-cols-2 gap-2">
            {mb.documento_frente_url && (
              <a href={mb.documento_frente_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                <img src={mb.documento_frente_url} alt="Documento frente" className="w-full h-full object-cover" />
              </a>
            )}
            {mb.documento_verso_url && (
              <a href={mb.documento_verso_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                <img src={mb.documento_verso_url} alt="Documento verso" className="w-full h-full object-cover" />
              </a>
            )}
          </div>
          {mb.comprovante_endereco_url && (
            <a href={mb.comprovante_endereco_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50">
              <Icon name="FileText" size={16} /> Ver comprovante de endereço
            </a>
          )}
        </div>

        {mostrarRecusa ? (
          <div className="mt-5 space-y-2">
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
              placeholder="Motivo da recusa (opcional)"
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setMostrarRecusa(false)} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                Voltar
              </button>
              <button onClick={() => onRecusar(solicitacao.id, motivo)} disabled={processando}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                Confirmar recusa
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-5">
            <button onClick={() => setMostrarRecusa(true)} disabled={processando}
              className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
              Recusar
            </button>
            <button onClick={() => onAceitar(solicitacao.id)} disabled={processando}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {processando ? 'Aguarde...' : 'Aceitar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const RestauranteMotoboys = () => {
  const [motoboys, setMotoboys] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [ficha, setFicha] = useState(null); // solicitacao selecionada
  const [processando, setProcessando] = useState(false);
  const [removendo, setRemovendo] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([listarMotoboys(), listarSolicitacoesMotoboy()])
      .then(([mbs, sols]) => {
        setMotoboys(mbs.motoboys ?? []);
        setSolicitacoes(sols.solicitacoes ?? []);
      })
      .catch((e) => setMsg({ tipo: 'erro', texto: e.message }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleAceitar = async (id) => {
    setProcessando(true);
    try {
      await aceitarSolicitacaoMotoboy(id);
      setFicha(null);
      setMsg({ tipo: 'ok', texto: 'Motoboy aceito!' });
      setTimeout(() => setMsg(null), 3000);
      reload();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(false);
    }
  };

  const handleRecusar = async (id, motivo) => {
    setProcessando(true);
    try {
      await recusarSolicitacaoMotoboy(id, motivo);
      setFicha(null);
      reload();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(false);
    }
  };

  const handleRemover = async (mb) => {
    if (!window.confirm(`Remover "${mb.name}" dos seus entregadores?`)) return;
    setRemovendo(mb.id);
    try {
      await removerAfiliacaoMotoboy(mb.id);
      setMotoboys((prev) => prev.filter((m) => m.id !== mb.id));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setRemovendo(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <header className="bg-white border-b border-[#E4E4E7] px-4 sm:px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#18181B]">Motoboys</h1>
            <p className="text-sm text-[#71717A]">Entregadores afiliados ao seu estabelecimento</p>
          </div>
          <NavRestaurante active="/restaurante/motoboys" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {msg && (
          <div className={`text-sm rounded-xl px-4 py-3 ${
            msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {msg.texto}
          </div>
        )}

        {solicitacoes.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <h2 className="font-bold text-[#18181B] text-sm mb-4 flex items-center gap-2">
              <Icon name="Bell" size={16} className="text-amber-500" /> Solicitações pendentes ({solicitacoes.length})
            </h2>
            <div className="space-y-2">
              {solicitacoes.map((s) => (
                <button key={s.id} onClick={() => setFicha(s)}
                  className="w-full flex items-center gap-3 border border-[#E4E4E7] rounded-xl p-3 hover:border-[#FF441F]/40 hover:shadow-sm transition-all text-left">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                    {s.motoboy.foto_perfil_url
                      ? <img src={s.motoboy.foto_perfil_url} alt={s.motoboy.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Icon name="User" size={16} className="text-[#A1A1AA]" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] truncate">{s.motoboy.name}</p>
                    <p className="text-xs text-[#71717A]">{s.motoboy.phone}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-[#A1A1AA] flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E4E4E7] divide-y divide-[#F4F4F5]">
          <div className="p-4">
            <h2 className="font-bold text-[#18181B] text-sm flex items-center gap-2">
              <Icon name="Bike" size={16} className="text-[#FF441F]" /> Entregadores ativos ({motoboys.length})
            </h2>
          </div>
          {motoboys.length === 0 ? (
            <p className="p-5 text-sm text-[#71717A] text-center">
              Nenhum motoboy afiliado ainda. O entregador se cadastra pelo app e solicita atender aqui.
            </p>
          ) : motoboys.map((mb) => (
            <div key={mb.id} className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FF441F]/10 flex-shrink-0">
                {mb.foto_perfil_url
                  ? <img src={mb.foto_perfil_url} alt={mb.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Icon name="Bike" size={16} className="text-[#FF441F]" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#18181B]">{mb.name}</p>
                {mb.phone && <p className="text-xs text-[#71717A]">{mb.phone}</p>}
              </div>
              <button
                onClick={() => handleRemover(mb)}
                disabled={removendo === mb.id}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 flex-shrink-0"
              >
                {removendo === mb.id ? '...' : 'Remover'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {ficha && (
        <FichaModal
          solicitacao={ficha}
          onFechar={() => setFicha(null)}
          onAceitar={handleAceitar}
          onRecusar={handleRecusar}
          processando={processando}
        />
      )}
    </div>
  );
};

export default RestauranteMotoboys;
