import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPedidosCozinha, atualizarStatusPedido, getMinhaEmpresa } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', debit_card: 'Débito', cash: 'Dinheiro' };

const STATUS_INFO = {
  confirmed: { label: 'Confirmado', next: 'preparing', nextLabel: 'Iniciar Preparo', nextIcon: 'ChefHat', prev: 'pending', prevLabel: 'Pendente', color: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-800', btnColor: 'bg-orange-500 hover:bg-orange-600' },
  preparing: { label: 'Em Preparo', next: 'ready', nextLabel: 'Marcar Pronto', nextIcon: 'Package', prev: 'confirmed', prevLabel: 'Confirmado', color: 'border-orange-300 bg-orange-50', badge: 'bg-orange-100 text-orange-800', btnColor: 'bg-purple-600 hover:bg-purple-700' },
};

const printComanda = (pedido, itens, restauranteNome) => {
  const w = window.open('', '_blank', 'width=420,height=600');
  if (!w) return;
  const hora = new Date(pedido.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const clienteNome = pedido.customers?.name ?? '';
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Comanda #${pedido.id}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:14px;padding:12px;color:#000;max-width:300px;margin:0 auto}
    .center{text-align:center}
    .big{font-size:28px;font-weight:900;text-align:center;letter-spacing:2px;margin:8px 0}
    .rest{font-size:16px;font-weight:bold;text-align:center;margin-bottom:4px}
    hr{border:none;border-top:1px dashed #000;margin:8px 0}
    .item{display:flex;gap:8px;padding:4px 0;font-size:15px}
    .qty{font-weight:900;min-width:28px;color:#000}
    .nome{flex:1}
    .foot{font-size:11px;text-align:center;margin-top:8px}
    @media print{button{display:none!important}}
  </style></head><body>
  <div class="rest">${restauranteNome ?? 'RESTAURANTE'}</div>
  <div class="center" style="font-size:11px">COMANDA DE COZINHA</div>
  <hr/>
  <div class="big">PEDIDO #${pedido.id}</div>
  <div class="center" style="font-size:13px">${hora}</div>
  ${clienteNome ? `<div class="center" style="font-size:12px;margin-top:2px">${clienteNome}</div>` : ''}
  <hr/>
  ${itens.map((i) => `<div class="item"><span class="qty">${i.quantity}x</span><span class="nome">${i.product_name ?? `Produto #${i.product_id}`}</span></div>`).join('')}
  <hr/>
  <div class="center" style="font-size:13px">Pgto: <b>${PAYMENT_LABELS[pedido.payment_method] ?? pedido.payment_method}</b>${pedido.payment_method === 'cash' ? ' ⚠ COBRAR' : ''}</div>
  <div class="foot">Impresso: ${new Date().toLocaleString('pt-BR')}</div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}</script>
  </body></html>`);
  w.document.close();
};

const OrderCard = ({ pedido, onAvancar, onVoltar, atualizando, restauranteNome }) => {
  const si = STATUS_INFO[pedido.status];
  const isAtualizando = atualizando === pedido.id;
  const minutos = Math.floor((Date.now() - new Date(pedido.created_at)) / 60000);

  return (
    <div className={`rounded-2xl border-2 ${si?.color ?? 'border-gray-200 bg-white'} overflow-hidden flex flex-col`}>
      {/* Header do card */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-2xl font-black text-[#18181B]">#{pedido.id}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${si?.badge}`}>{si?.label}</span>
          </div>
          {pedido.customers?.name && (
            <p className="text-sm font-semibold text-[#27272A]">{pedido.customers.name}</p>
          )}
          <p className="text-xs text-[#71717A] mt-0.5 flex items-center gap-1">
            <Icon name="Clock" size={11} />
            {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            <span className={`ml-1 font-semibold ${minutos > 15 ? 'text-red-500' : minutos > 8 ? 'text-orange-500' : 'text-green-600'}`}>
              · {minutos}min
            </span>
          </p>
        </div>
        <button
          onClick={() => printComanda(pedido, pedido.itens ?? [], restauranteNome)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs font-semibold text-[#27272A] hover:bg-[#F4F4F5] transition-colors"
        >
          <Icon name="Printer" size={13} />
          Comanda
        </button>
      </div>

      {/* Itens */}
      <div className="px-4 py-3 bg-white mx-3 rounded-xl mb-3 border border-[#E4E4E7] flex-1">
        <div className="space-y-2">
          {(pedido.itens ?? []).map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="w-7 h-7 bg-[#FF441F] text-white font-black text-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.quantity}
              </span>
              <p className="text-sm font-semibold text-[#18181B] leading-tight">{item.product_name ?? `Produto #${item.product_id}`}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F4F4F5]">
          <span className="text-xs text-[#71717A]">{PAYMENT_LABELS[pedido.payment_method] ?? pedido.payment_method}</span>
          <span className="text-sm font-black text-[#FF441F]">{fmt(pedido.total)}</span>
        </div>
      </div>

      {/* Ações */}
      <div className="px-3 pb-3 flex gap-2">
        <button
          disabled={isAtualizando}
          onClick={() => onVoltar(pedido.id, si?.prev)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-[#E4E4E7] rounded-xl text-xs font-bold text-[#71717A] hover:bg-[#F4F4F5] disabled:opacity-40 transition-colors"
        >
          <Icon name="ArrowLeft" size={13} />
          {si?.prevLabel}
        </button>
        <button
          disabled={isAtualizando}
          onClick={() => onAvancar(pedido.id, si?.next)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-black rounded-xl disabled:opacity-50 transition-colors shadow-md ${si?.btnColor}`}
        >
          {isAtualizando ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Icon name={si?.nextIcon ?? 'ArrowRight'} size={15} />
              {si?.nextLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const RestauranteCozinha = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [restauranteNome, setRestauranteNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const data = await getPedidosCozinha();
      setPedidos(data.pedidos ?? []);
      setLastUpdate(new Date());
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      carregar(),
      getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {}),
    ]);
    const id = setInterval(carregar, 30000);
    return () => clearInterval(id);
  }, [carregar]);

  const handleAvancar = async (pedidoId, novoStatus) => {
    setAtualizando(pedidoId);
    try {
      await atualizarStatusPedido(pedidoId, novoStatus);
      await carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setAtualizando(null);
    }
  };

  const confirmados = pedidos.filter((p) => p.status === 'confirmed');
  const preparando = pedidos.filter((p) => p.status === 'preparing');

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111111]">
      {/* Header */}
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-5 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/restaurante')} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
          <Icon name="ArrowLeft" size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF441F] rounded-lg flex items-center justify-center">
            <Icon name="ChefHat" size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-base leading-none">Painel da Cozinha</p>
            <p className="text-[#71717A] text-xs">{restauranteNome}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#71717A]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {lastUpdate ? `${lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '—'}
          </div>
          <button onClick={carregar} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
            <Icon name="RefreshCw" size={16} />
          </button>
        </div>
      </header>

      {erro && (
        <div className="mx-5 mt-4 bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <main className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Coluna: Confirmados (aguardando preparo) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Aguardando Preparo</h2>
            {confirmados.length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{confirmados.length}</span>
            )}
          </div>
          {confirmados.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
              <Icon name="CheckCircle" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum pedido aguardando</p>
            </div>
          ) : (
            <div className="space-y-3">
              {confirmados.map((p) => (
                <OrderCard key={p.id} pedido={p} onAvancar={handleAvancar} onVoltar={handleAvancar} atualizando={atualizando} restauranteNome={restauranteNome} />
              ))}
            </div>
          )}
        </div>

        {/* Coluna: Em preparo */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Em Preparo</h2>
            {preparando.length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{preparando.length}</span>
            )}
          </div>
          {preparando.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
              <Icon name="ChefHat" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum pedido em preparo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preparando.map((p) => (
                <OrderCard key={p.id} pedido={p} onAvancar={handleAvancar} onVoltar={handleAvancar} atualizando={atualizando} restauranteNome={restauranteNome} />
              ))}
            </div>
          )}
        </div>
      </main>

      {pedidos.length === 0 && !loading && (
        <div className="text-center py-20">
          <Icon name="UtensilsCrossed" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Cozinha tranquila</p>
          <p className="text-[#3A3A3A] text-sm mt-1">Nenhum pedido para preparar agora</p>
        </div>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 30 segundos</p>
    </div>
  );
};

export default RestauranteCozinha;
