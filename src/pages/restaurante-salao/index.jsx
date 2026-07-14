import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getGarconsOnline, getSalaoMesas, getSalaoComandas, getSalaoComandaDetalhe,
  aplicarDescontoComanda, aplicarAcrescimoComanda, cancelarComandaSalao, pagarComandaSalao,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const pendentes = useSolicitacoesMotoboyCount();
  const slugLoja = useMinhaLojaSlug();
  const tipoRestaurante = useTipoRestaurante();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
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
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <nav className="flex gap-1.5 flex-wrap">
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
  );
};

const MESA_STATUS_COR = {
  livre: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ocupada: 'bg-orange-100 text-orange-700 border-orange-200',
  aguardando_pagamento: 'bg-blue-100 text-blue-700 border-blue-200',
};

const ComandaModal = ({ comandaId, onFechar, onMudou }) => {
  const [comanda, setComanda] = useState(null);
  const [descontoInput, setDescontoInput] = useState('');
  const [acrescimoInput, setAcrescimoInput] = useState('');
  const [forma, setForma] = useState('pix');
  const [gorjeta, setGorjeta] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    const c = await getSalaoComandaDetalhe(comandaId);
    setComanda(c);
    setDescontoInput(String(c.desconto_valor ?? 0));
    setAcrescimoInput(String(c.acrescimo_valor ?? 0));
  }, [comandaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const acao = async (fn) => {
    setErro(null);
    setSalvando(true);
    try {
      await fn();
      await carregar();
      onMudou();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const cancelar = () => {
    if (!window.confirm('Cancelar esta comanda?')) return;
    acao(async () => { await cancelarComandaSalao(comandaId); onFechar(); });
  };

  const pagar = () => {
    acao(async () => { await pagarComandaSalao(comandaId, forma, gorjeta ? Number(gorjeta) : undefined); onFechar(); });
  };

  if (!comanda) return null;

  const subtotal = (comanda.itens ?? []).reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const totalFinal = subtotal - Number(descontoInput || 0) + Number(acrescimoInput || 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4" onClick={onFechar}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-base font-bold text-[#18181B]">
              {comanda.mesas ? `Mesa ${comanda.mesas.numero}` : 'Comanda avulsa'}
            </h2>
            <p className="text-xs text-[#71717A]">{comanda.cliente_mesa_nome} · {comanda.cliente_mesa_telefone}</p>
            <p className="text-xs text-[#71717A]">Garçom: {comanda.garcons?.nome ?? '—'}</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
            {comanda.status === 'aberta' ? 'Em aberto' : 'Aguardando pagamento'}
          </span>
        </div>

        <div className="space-y-1 mb-3">
          {(comanda.itens ?? []).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.products?.name}</span>
              <span>{fmt(item.quantity * item.unit_price)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#E4E4E7] pt-3 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          <div className="flex justify-between items-center text-sm gap-2">
            <span>Desconto</span>
            <input type="number" value={descontoInput} onChange={(e) => setDescontoInput(e.target.value)}
              className="w-24 border border-[#E4E4E7] rounded-lg px-2 py-1 text-right text-sm" />
            <button onClick={() => acao(() => aplicarDescontoComanda(comandaId, Number(descontoInput || 0)))}
              className="text-xs text-[#FF441F] font-bold">Aplicar</button>
          </div>
          <div className="flex justify-between items-center text-sm gap-2">
            <span>Acréscimo</span>
            <input type="number" value={acrescimoInput} onChange={(e) => setAcrescimoInput(e.target.value)}
              className="w-24 border border-[#E4E4E7] rounded-lg px-2 py-1 text-right text-sm" />
            <button onClick={() => acao(() => aplicarAcrescimoComanda(comandaId, Number(acrescimoInput || 0)))}
              className="text-xs text-[#FF441F] font-bold">Aplicar</button>
          </div>
          <div className="flex justify-between text-base font-bold text-[#18181B]">
            <span>Total</span><span>{fmt(totalFinal)}</span>
          </div>
        </div>

        <div className="border-t border-[#E4E4E7] mt-3 pt-3 space-y-2">
          <label className="text-xs text-[#71717A]">Forma de pagamento</label>
          <select value={forma} onChange={(e) => setForma(e.target.value)} className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm">
            <option value="pix">PIX</option>
            <option value="credit_card">Cartão de crédito</option>
            <option value="debit_card">Cartão de débito</option>
            <option value="cash">Dinheiro</option>
          </select>
          <label className="text-xs text-[#71717A]">Gorjeta (opcional)</label>
          <input type="number" value={gorjeta} onChange={(e) => setGorjeta(e.target.value)}
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
        </div>

        {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={cancelar} disabled={salvando}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
            Cancelar comanda
          </button>
          <button onClick={pagar} disabled={salvando}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
            {salvando ? 'Processando...' : 'Confirmar pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RestauranteSalao = () => {
  const [garconsOnline, setGarconsOnline] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [comandaAtiva, setComandaAtiva] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    const [g, m, c] = await Promise.all([getGarconsOnline(), getSalaoMesas(), getSalaoComandas()]);
    setGarconsOnline(g);
    setMesas(m);
    setComandas(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 20000);
    return () => clearInterval(interval);
  }, [carregar]);

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <div className="bg-white border-b border-[#E4E4E7] p-4">
        <NavRestaurante active="/restaurante/salao" />
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-4">
          <p className="text-xs font-semibold text-[#71717A] mb-2">Garçons online agora</p>
          <div className="flex flex-wrap gap-2">
            {garconsOnline.map((g) => (
              <span key={g.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {g.nome}
              </span>
            ))}
            {garconsOnline.length === 0 && <p className="text-xs text-[#A1A1AA]">Nenhum garçom online.</p>}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#71717A]">Carregando...</p>
        ) : (
          <>
            <p className="text-sm font-bold text-[#18181B] mb-2">Mesas</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
              {mesas.map((m) => (
                <button key={m.id} onClick={() => m.comanda && setComandaAtiva(m.comanda.id)}
                  disabled={!m.comanda}
                  className={`rounded-xl border p-3 text-center ${MESA_STATUS_COR[m.status] ?? ''} disabled:opacity-70`}>
                  <p className="text-lg font-black">{m.numero}</p>
                  {m.comanda && <p className="text-[10px] font-medium">{fmt(m.comanda.total)}</p>}
                </button>
              ))}
              {mesas.length === 0 && <p className="col-span-full text-sm text-[#A1A1AA]">Nenhuma mesa cadastrada.</p>}
            </div>

            <p className="text-sm font-bold text-[#18181B] mb-2">Comandas em aberto</p>
            <div className="space-y-2">
              {comandas.map((c) => (
                <button key={c.id} onClick={() => setComandaAtiva(c.id)}
                  className="w-full bg-white rounded-xl border border-[#E4E4E7] p-3 flex justify-between items-center text-left">
                  <div>
                    <p className="text-sm font-medium text-[#18181B]">
                      {c.mesas ? `Mesa ${c.mesas.numero}` : 'Avulsa'} — {c.cliente_mesa_nome}
                    </p>
                    <p className="text-xs text-[#71717A]">Garçom: {c.garcons?.nome ?? '—'} · {c.status === 'aberta' ? 'Em aberto' : 'Aguardando pagamento'}</p>
                  </div>
                  <p className="text-sm font-bold text-[#18181B]">{fmt(c.total)}</p>
                </button>
              ))}
              {comandas.length === 0 && <p className="text-sm text-[#A1A1AA]">Nenhuma comanda em aberto.</p>}
            </div>
          </>
        )}
      </div>

      {comandaAtiva && (
        <ComandaModal comandaId={comandaAtiva} onFechar={() => setComandaAtiva(null)} onMudou={carregar} />
      )}
    </div>
  );
};

export default RestauranteSalao;
