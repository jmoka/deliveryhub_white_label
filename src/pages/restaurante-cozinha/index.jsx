import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPedidosCozinha, atualizarStatusPedido, getMinhaEmpresa } from '../../services/restauranteService';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import { printComanda, barcodeValue, getPrinterName, setPrinterName } from '../../utils/printComanda';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', debit_card: 'Débito', cash: 'Dinheiro' };

const STATUS_INFO = {
  confirmed: { label: 'Confirmado', next: 'preparing', nextLabel: 'Iniciar Preparo', nextIcon: 'ChefHat', prev: 'pending', prevLabel: 'Pendente', color: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-800', btnColor: 'bg-orange-500 hover:bg-orange-600' },
  preparing: { label: 'Em Preparo', next: 'ready', nextLabel: 'Marcar Pronto', nextIcon: 'Package', prev: 'confirmed', prevLabel: 'Confirmado', color: 'border-orange-300 bg-orange-50', badge: 'bg-orange-100 text-orange-800', btnColor: 'bg-purple-600 hover:bg-purple-700' },
};

const OrderCard = ({ pedido, onAvancar, onVoltar, atualizando, restauranteNome, highlighted }) => {
  const si = STATUS_INFO[pedido.status];
  const isAtualizando = atualizando === pedido.id;
  const minutos = Math.floor((Date.now() - new Date(pedido.created_at)) / 60000);
  const isHighlighted = highlighted === pedido.id;

  return (
    <div
      id={`order-${pedido.id}`}
      className={`rounded-2xl border-2 overflow-hidden flex flex-col transition-all duration-300 ${
        isHighlighted
          ? 'border-yellow-400 bg-yellow-50 shadow-xl shadow-yellow-300/40 scale-[1.02]'
          : si?.color ?? 'border-gray-200 bg-white'
      }`}
    >
      {isHighlighted && (
        <div className="bg-yellow-400 px-4 py-1.5 flex items-center gap-2">
          <Icon name="ScanLine" size={14} className="text-yellow-900" />
          <p className="text-xs font-black text-yellow-900 uppercase tracking-wide">Pedido encontrado via leitura</p>
        </div>
      )}

      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
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
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => printComanda(pedido, pedido.itens ?? [], restauranteNome)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs font-semibold text-[#27272A] hover:bg-[#F4F4F5] transition-colors"
          >
            <Icon name="Printer" size={13} />
            Comanda
          </button>
          <div className="flex items-center justify-center gap-1 px-2 py-1 bg-[#F4F4F5] rounded-lg">
            <Icon name="Barcode" size={11} className="text-[#71717A]" />
            <span className="text-[10px] font-mono text-[#71717A]">{barcodeValue(pedido.id)}</span>
          </div>
        </div>
      </div>

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
  const [restauranteId, setRestauranteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [erro, setErro] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [highlighted, setHighlighted] = useState(null);
  const [scanMsg, setScanMsg] = useState(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [printerInput, setPrinterInput] = useState('');
  const [printerSaved, setPrinterSaved] = useState(false);
  const scanRef = useRef(null);
  const prevOrderIds = useRef(new Set());
  const firstLoad = useRef(true);

  const handleSavePrinter = () => {
    setPrinterName(printerInput.trim());
    setPrinterSaved(true);
    setTimeout(() => setPrinterSaved(false), 2000);
  };

  const carregar = useCallback(async (currentRestauranteNome) => {
    try {
      const data = await getPedidosCozinha();
      const newPedidos = data.pedidos ?? [];

      if (!firstLoad.current) {
        const novos = newPedidos.filter((p) => !prevOrderIds.current.has(p.id));
        novos.forEach((p) => {
          printComanda(p, p.itens ?? [], currentRestauranteNome);
        });
      }

      prevOrderIds.current = new Set(newPedidos.map((p) => p.id));
      firstLoad.current = false;
      setPedidos(newPedidos);
      setLastUpdate(new Date());
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let nome = '';
    getMinhaEmpresa()
      .then((d) => {
        nome = d.empresa?.name ?? '';
        setRestauranteNome(nome);
        setRestauranteId(d.empresa?.id ?? null);
      })
      .catch(() => {});

    carregar(nome);
    const id = setInterval(() => carregar(nome), 30000);
    return () => clearInterval(id);
  }, [carregar]);

  // Realtime: recarrega cozinha quando pedido muda de status
  useEffect(() => {
    if (!restauranteId) return;
    const channel = supabase
      .channel(`cozinha-${restauranteId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restauranteId}`,
      }, () => carregar(restauranteNome))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [restauranteId, carregar, restauranteNome]);

  useEffect(() => {
    const saved = getPrinterName();
    setPrinterInput(saved);
  }, []);

  const buscarPorId = useCallback((rawValue) => {
    const id = parseInt(rawValue.replace(/\D/g, ''));
    if (!id) return;
    const found = pedidos.find((p) => p.id === id);
    if (found) {
      setHighlighted(id);
      setScanMsg({ tipo: 'ok', texto: `Pedido #${id} encontrado` });
      setTimeout(() => { setHighlighted(null); setScanMsg(null); }, 4000);
      setTimeout(() => {
        document.getElementById(`order-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else {
      setScanMsg({ tipo: 'erro', texto: `Pedido #${id} não está na cozinha agora` });
      setTimeout(() => setScanMsg(null), 3000);
    }
    setScanInput('');
    scanRef.current?.focus();
  }, [pedidos]);

  const handleScanKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); buscarPorId(scanInput); }
  };

  const handleAvancar = async (pedidoId, novoStatus) => {
    setAtualizando(pedidoId);
    try {
      await atualizarStatusPedido(pedidoId, novoStatus);
      await carregar(restauranteNome);
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
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-5 py-3">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => navigate('/restaurante')} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF441F] rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="ChefHat" size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">Painel da Cozinha</p>
              <p className="text-[#71717A] text-xs">{restauranteNome}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
            </div>
            <button onClick={() => { setShowPrinterSettings((v) => !v); setPrinterInput(getPrinterName()); }}
              className={`p-2 rounded-lg transition-colors ${showPrinterSettings ? 'text-[#FF441F] bg-[#FF441F]/10' : 'text-[#71717A] hover:text-white hover:bg-[#2A2A2A]'}`}
              title="Configurar impressora">
              <Icon name="Printer" size={16} />
            </button>
            <button onClick={() => carregar(restauranteNome)} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
        </div>

        {/* Printer settings inline bar */}
        {showPrinterSettings && (
          <div className="mb-3 flex items-center gap-3 bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3">
            <Icon name="Printer" size={15} className="text-[#FF441F] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[#71717A] mb-1">Nome da impressora padrão (como aparece no Windows/Mac)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={printerInput}
                  onChange={(e) => setPrinterInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePrinter()}
                  placeholder="Ex: EPSON TM-T20, HP LaserJet..."
                  className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#3A3A3A] outline-none focus:border-[#FF441F]"
                />
                <button onClick={handleSavePrinter}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${printerSaved ? 'bg-green-600 text-white' : 'bg-[#FF441F] text-white hover:bg-[#E63A19]'}`}>
                  {printerSaved ? '✓ Salvo' : 'Salvar'}
                </button>
                {getPrinterName() && (
                  <button onClick={() => { setPrinterName(''); setPrinterInput(''); }}
                    className="px-3 py-1.5 text-xs font-bold bg-[#2A2A2A] text-[#71717A] hover:text-white rounded-lg">
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scanner / barcode reader input */}
        <div className="flex items-center gap-3">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
            scanMsg?.tipo === 'ok' ? 'border-green-500 bg-green-900/20' :
            scanMsg?.tipo === 'erro' ? 'border-red-500 bg-red-900/20' :
            'border-[#2A2A2A] bg-[#111111] focus-within:border-[#FF441F]'
          }`}>
            <Icon name="ScanLine" size={16} className={scanMsg?.tipo === 'ok' ? 'text-green-400' : scanMsg?.tipo === 'erro' ? 'text-red-400' : 'text-[#71717A]'} />
            <input
              ref={scanRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScanKey}
              placeholder="Aponte o leitor ou digite o nº do pedido..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-[#3A3A3A] outline-none font-mono"
              autoFocus
            />
            {scanInput && (
              <button onClick={() => buscarPorId(scanInput)}
                className="flex-shrink-0 px-3 py-1 bg-[#FF441F] text-white text-xs font-bold rounded-lg hover:bg-[#E63A19]">
                Buscar
              </button>
            )}
          </div>
          {scanMsg && (
            <p className={`text-xs font-semibold flex-shrink-0 ${scanMsg.tipo === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {scanMsg.texto}
            </p>
          )}
        </div>
      </header>

      {erro && (
        <div className="mx-5 mt-4 bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <main className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
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
                <OrderCard key={p.id} pedido={p} onAvancar={handleAvancar} onVoltar={handleAvancar}
                  atualizando={atualizando} restauranteNome={restauranteNome} highlighted={highlighted} />
              ))}
            </div>
          )}
        </div>

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
                <OrderCard key={p.id} pedido={p} onAvancar={handleAvancar} onVoltar={handleAvancar}
                  atualizando={atualizando} restauranteNome={restauranteNome} highlighted={highlighted} />
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

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 30 segundos · auto-imprime novos pedidos</p>
    </div>
  );
};

export default RestauranteCozinha;
