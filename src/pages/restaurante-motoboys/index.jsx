import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarMotoboys, listarSolicitacoesMotoboy, aceitarSolicitacaoMotoboy,
  recusarSolicitacaoMotoboy, revisarSolicitacaoMotoboy, removerAfiliacaoMotoboy,
} from '../../services/restauranteService';
import { AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useMinhaLojaLogo } from '../../hooks/useMinhaLojaLogo';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import { useAuth } from '../../contexts/AuthContext';
import RestauranteSidebar from '../../components/restaurante/RestauranteSidebar';
import MobileMenu from '../../components/restaurante/MobileMenu';

const NavRestaurante = ({ active, title = 'Motoboys' }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const pendentes = useSolicitacoesMotoboyCount();
  const slugLoja = useMinhaLojaSlug();
  const logoUrl = useMinhaLojaLogo();
  const tipoRestaurante = useTipoRestaurante();
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Relatórios', path: '/restaurante/relatorios' },
    { label: 'Delivery', path: '/restaurante/delivery' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Entregas', path: '/restaurante/entregas' },
    { label: 'Motoboys', path: '/restaurante/motoboys' },
    ...(tipoRestaurante ? [
      { label: 'Salão', path: '/restaurante/salao' },
      { label: 'Garçons', path: '/restaurante/garcons' },
      { label: 'Impressoras', path: '/restaurante/impressoras' },
    ] : []),
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Cardápio Digital', path: '/restaurante/cardapio-digital' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logoUrl
            ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
            : <div className="w-8 h-8 rounded-lg bg-[#FF441F]/10 flex items-center justify-center"><Icon name="UtensilsCrossed" size={16} className="text-[#FF441F]" /></div>}
          <span className="font-bold text-[#18181B] text-base md:text-lg">{title}</span>
        </div>
        <button className="md:hidden p-2 rounded-lg hover:bg-[#F4F4F5] text-[#18181B]" onClick={() => setMenuAberto((v) => !v)}>
          <Icon name={menuAberto ? 'X' : 'Menu'} size={22} />
        </button>
        <button onClick={() => setSidebarAberto(true)}
          className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]">
          <Icon name="Menu" size={18} /> Menu
        </button>
      </div>
      <AnimatePresence>
        {menuAberto && (
          <MobileMenu
            links={links}
            currentPath={active}
            pendentesMotoboy={pendentes}
            slugLoja={slugLoja}
            onNavigate={(path) => { navigate(path); setMenuAberto(false); }}
            onSair={async () => { await signOut(); navigate('/customer-registration-login'); }}
          />
        )}
      </AnimatePresence>
      <RestauranteSidebar
        open={sidebarAberto}
        onClose={() => setSidebarAberto(false)}
        links={links}
        activePath={active}
        pendentesMotoboy={pendentes}
        slugLoja={slugLoja}
      />
    </>
  );
};

// Signed URL do Supabase carrega query string (?token=...) depois do nome do arquivo —
// preciso olhar o path antes do "?" pra saber a extensão real.
const isPdfUrl = (url) => /\.pdf(\?|$)/i.test(url ?? '');

const ArquivoPreview = ({ url, alt, className }) => {
  if (isPdfUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className={`${className} flex flex-col items-center justify-center gap-1 text-red-500 hover:bg-red-50`}>
        <Icon name="FileText" size={20} />
        <span className="text-[10px] font-semibold">Ver PDF</span>
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      <img src={url} alt={alt} className="w-full h-full object-cover" />
    </a>
  );
};

const FichaModal = ({ solicitacao, onFechar, onAceitar, onRecusar, processando, somenteLeitura = false }) => {
  const [motivo, setMotivo] = useState('');
  const [mostrarRecusa, setMostrarRecusa] = useState(false);
  const mb = solicitacao.motoboy;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
            {mb.foto_perfil_url
              ? <ArquivoPreview url={mb.foto_perfil_url} alt={mb.name} className="block w-full h-full" />
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
              <ArquivoPreview url={mb.documento_frente_url} alt="Documento frente"
                className="block rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50" />
            )}
            {mb.documento_verso_url && (
              <ArquivoPreview url={mb.documento_verso_url} alt="Documento verso"
                className="block rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50" />
            )}
          </div>
          {mb.comprovante_endereco_url && (
            <a href={mb.comprovante_endereco_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50">
              <Icon name="FileText" size={16} /> Ver comprovante de endereço
            </a>
          )}
        </div>

        {somenteLeitura ? (
          <button onClick={onFechar} className="w-full mt-5 py-2.5 border rounded-xl text-sm text-gray-700 hover:bg-gray-50">
            Fechar
          </button>
        ) : mostrarRecusa ? (
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
  const [aba, setAba] = useState('pendentes'); // pendentes | aceitas | recusadas
  const [motoboys, setMotoboys] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [recusadas, setRecusadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [ficha, setFicha] = useState(null); // solicitacao selecionada
  const [fichaSomenteLeitura, setFichaSomenteLeitura] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [removendo, setRemovendo] = useState(null);
  const [revisando, setRevisando] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([listarMotoboys(), listarSolicitacoesMotoboy('pendente'), listarSolicitacoesMotoboy('recusado')])
      .then(([mbs, sols, recs]) => {
        setMotoboys(mbs.motoboys ?? []);
        setSolicitacoes(sols.solicitacoes ?? []);
        setRecusadas(recs.solicitacoes ?? []);
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

  const handleRevisar = async (id) => {
    setRevisando(id);
    try {
      await revisarSolicitacaoMotoboy(id);
      reload();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setRevisando(null);
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
        <div className="max-w-screen-xl mx-auto">
          <NavRestaurante active="/restaurante/motoboys" />
          <p className="text-sm text-[#71717A] mt-1">Entregadores afiliados ao seu estabelecimento</p>
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

        {/* Abas */}
        <div className="flex gap-1 bg-white border border-[#E4E4E7] rounded-xl p-1">
          {[
            { id: 'pendentes', label: 'Pendentes', count: solicitacoes.length },
            { id: 'aceitas', label: 'Aceitas', count: motoboys.length },
            { id: 'recusadas', label: 'Recusadas', count: recusadas.length },
          ].map((t) => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-colors ${
                aba === t.id ? 'bg-[#FF441F] text-white shadow-sm' : 'text-[#71717A] hover:bg-[#F4F4F5]'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  aba === t.id ? 'bg-white/20 text-white' : 'bg-[#F4F4F5] text-[#71717A]'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {aba === 'pendentes' && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] divide-y divide-[#F4F4F5]">
            {solicitacoes.length === 0 ? (
              <p className="p-5 text-sm text-[#71717A] text-center">Nenhuma solicitação pendente</p>
            ) : solicitacoes.map((s) => (
              <button key={s.id} onClick={() => setFicha(s)}
                className="w-full flex items-center gap-3 p-4 hover:bg-[#F4F4F5] transition-colors text-left">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                  {s.motoboy.foto_perfil_url && !isPdfUrl(s.motoboy.foto_perfil_url)
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
        )}

        {aba === 'aceitas' && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] divide-y divide-[#F4F4F5]">
            {motoboys.length === 0 ? (
              <p className="p-5 text-sm text-[#71717A] text-center">
                Nenhum motoboy afiliado ainda. O entregador se cadastra pelo app e solicita atender aqui.
              </p>
            ) : motoboys.map((mb) => (
              <div key={mb.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FF441F]/10 flex-shrink-0">
                  {mb.foto_perfil_url && !isPdfUrl(mb.foto_perfil_url)
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
        )}

        {aba === 'recusadas' && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] divide-y divide-[#F4F4F5]">
            {recusadas.length === 0 ? (
              <p className="p-5 text-sm text-[#71717A] text-center">Nenhuma solicitação recusada</p>
            ) : recusadas.map((s) => (
              <div key={s.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] truncate">{s.motoboy.name}</p>
                    <p className="text-xs text-[#71717A]">{s.motoboy.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-xs text-[#A1A1AA]">
                      {s.respondido_em && new Date(s.respondido_em).toLocaleDateString('pt-BR')}
                    </p>
                    <button
                      onClick={() => { setFicha(s); setFichaSomenteLeitura(true); }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F4F4F5] text-[#27272A] hover:bg-[#E4E4E7]"
                    >
                      Ver ficha
                    </button>
                    <button
                      onClick={() => handleRevisar(s.id)}
                      disabled={revisando === s.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {revisando === s.id ? '...' : 'Revisão'}
                    </button>
                  </div>
                </div>
                {s.motivo_recusa && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">{s.motivo_recusa}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {ficha && (
        <FichaModal
          solicitacao={ficha}
          onFechar={() => { setFicha(null); setFichaSomenteLeitura(false); }}
          onAceitar={handleAceitar}
          onRecusar={handleRecusar}
          processando={processando}
          somenteLeitura={fichaSomenteLeitura}
        />
      )}
    </div>
  );
};

export default RestauranteMotoboys;
