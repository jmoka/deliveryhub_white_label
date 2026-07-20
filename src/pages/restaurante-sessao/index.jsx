import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaixa } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import RestauranteSidebar from '../../components/restaurante/RestauranteSidebar';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };
const STATUS_LABEL = {
  pending: 'Recebido', confirmed: 'Confirmado', preparing: 'Em preparo', ready: 'Pronto',
  motoboy_collecting: 'Motoboy a caminho', out_for_delivery: 'Em entrega', delivered: 'Entregue', canceled: 'Cancelado',
  aberta: 'Em aberto', fechada_garcom: 'Aguard. pagamento', paga: 'Pago',
};
const STATUS_COLOR = {
  delivered: 'bg-green-100 text-green-800', paga: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
  aberta: 'bg-blue-100 text-blue-800', fechada_garcom: 'bg-blue-100 text-blue-800',
};

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const pendentes = useSolicitacoesMotoboyCount();
  const slugLoja = useMinhaLojaSlug();
  const tipoRestaurante = useTipoRestaurante();
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Relatórios', path: '/restaurante/relatorios' },
    { label: 'Delivery', path: '/restaurante/delivery' },
    { label: 'Cozinha', path: '/restaurante/cozinha' },
    ...(tipoRestaurante ? [{ label: 'Produção', path: '/restaurante/producao' }, { label: 'Bar', path: '/restaurante/bar' }] : []),
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Sessão', path: '/restaurante/sessao' },
    { label: 'Entregas', path: '/restaurante/entregas' },
    { label: 'Motoboys', path: '/restaurante/motoboys' },
    ...(tipoRestaurante ? [
      { label: 'Salão', path: '/restaurante/salao' },
      { label: 'Garçons', path: '/restaurante/garcons' },
      { label: 'Impressoras', path: '/restaurante/impressoras' },
    ] : []),
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Financeiro', path: '/restaurante/financeiro' },
    { label: 'Cardápio Digital', path: '/restaurante/cardapio-digital' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <>
    <nav className="md:hidden flex gap-1.5 flex-wrap">
      {links.map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            active === l.path ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30' : 'text-[#27272A] hover:bg-[#F4F4F5]'
          }`}>
          {l.label}
          {l.path === '/restaurante/motoboys' && pendentes > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
              {pendentes}
            </span>
          )}
        </button>
      ))}
      {slugLoja && (
        <button onClick={() => window.open(`/r/${slugLoja}`, '_blank')}
          className="px-3 py-2 text-sm font-semibold rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 flex items-center gap-1.5">
          <Icon name="ExternalLink" size={14} /> Loja
        </button>
      )}
    </nav>
    <button onClick={() => setSidebarAberto(true)}
      className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]">
      <Icon name="Menu" size={18} /> Menu
    </button>
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

// Lista todos os pedidos/vendas (delivery + salão) desde que o caixa atual foi aberto —
// conferência rápida do turno, sem precisar abrir o Financeiro completo.
const RestauranteSessao = () => {
  const [caixa, setCaixa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroCanal, setFiltroCanal] = useState('todos');
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const c = await getCaixa();
      setCaixa(c);
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 20000);
    return () => clearInterval(interval);
  }, [carregar]);

  const pedidos = (caixa?.pedidos ?? []).filter((p) => filtroCanal === 'todos' || p.canal === filtroCanal);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4">
        <h1 className="text-xl font-bold text-[#18181B] mb-3">Pedidos da Sessão</h1>
        <NavRestaurante active="/restaurante/sessao" />
      </header>

      <div className="max-w-5xl mx-auto p-4">
        {loading ? (
          <p className="text-sm text-[#71717A]">Carregando...</p>
        ) : erro ? (
          <p className="text-sm text-red-600">{erro}</p>
        ) : !caixa?.aberto ? (
          <div className="text-center py-16">
            <Icon name="Lock" size={40} className="text-[#D4D4D8] mx-auto mb-3" />
            <p className="text-[#71717A] font-semibold">Nenhum caixa aberto agora</p>
            <p className="text-[#A1A1AA] text-sm mt-1">Abra o caixa no Dashboard pra começar a sessão.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-[#18181B]">{caixa.nome_operador}</p>
                <p className="text-xs text-[#71717A]">Caixa aberto desde {new Date(caixa.aberto_em).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-1.5">
                {['todos', 'delivery', 'presencial'].map((c) => (
                  <button key={c} onClick={() => setFiltroCanal(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${filtroCanal === c ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>
                    {c === 'todos' ? 'Todos' : c === 'delivery' ? 'Delivery' : 'Salão'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E4E4E7] text-left text-xs text-[#71717A]">
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Canal</th>
                    <th className="px-4 py-2.5">Cliente / Mesa</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Pagamento</th>
                    <th className="px-4 py-2.5">Hora</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.id} className="border-b border-[#F4F4F5] last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-[#18181B]">#{p.numero_comanda ?? p.id}</td>
                      <td className="px-4 py-2.5 text-xs text-[#71717A]">{p.canal === 'presencial' ? 'Salão' : 'Delivery'}</td>
                      <td className="px-4 py-2.5 text-[#27272A]">
                        {p.canal === 'presencial'
                          ? (p.mesas ? `Mesa ${p.mesas.numero}` : 'Balcão') + (p.cliente_mesa_nome ? ` — ${p.cliente_mesa_nome}` : '')
                          : (p.customers?.name ?? '—')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#71717A]">{PAGAMENTO_LABEL[p.payment_method] ?? p.payment_method ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-[#71717A]">{new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-[#18181B]">{fmt(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pedidos.length === 0 && (
                <p className="text-center py-10 text-sm text-[#A1A1AA]">Nenhum pedido nessa sessão ainda.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RestauranteSessao;
