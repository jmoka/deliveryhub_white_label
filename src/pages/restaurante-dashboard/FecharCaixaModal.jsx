import React, { useState } from 'react';
import { getSalaoComandaDetalhe } from '../../services/restauranteService';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '-';

const PL = { cash: 'Dinheiro', pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', taxa_cartao: '+ Taxa cartão' };
const PEDIDO_STATUS_LABEL = { confirmed: 'Aguardando Preparo', preparing: 'Em preparo' };

const Row = ({ label, value, bold, accent, muted }) => (
  <div className={`flex justify-between text-sm py-1.5 border-b border-[#F4F4F5] dark:border-[#3F3F46] last:border-0 ${bold ? 'font-bold' : ''}`}>
    <span className={muted ? 'text-[#A1A1AA]' : 'text-[#71717A] dark:text-[#A1A1AA]'}>{label}</span>
    <span className={accent ? 'text-[#FF441F] font-bold' : muted ? 'text-[#A1A1AA]' : 'text-[#18181B] dark:text-[#F4F4F5]'}>{value}</span>
  </div>
);

// ── Tela 0: pedidos/itens ainda em preparo/produção ───────────────────────────
const ITEM_STATUS_LABEL = { enviado: 'Aguardando', preparando: 'Em preparo' };

const labelComanda = (order) => {
  const prefixo = order?.is_venda_balcao ? 'Balcão · ' : '';
  if (order?.mesas) return `${prefixo}Mesa ${order.mesas.numero}${order.mesas.nome ? ` - ${order.mesas.nome}` : ''}`;
  if (order?.numero_comanda) return `${prefixo}Comanda #${order.numero_comanda}`;
  if (order?.cliente_mesa_nome) return `${prefixo}${order.cliente_mesa_nome}`;
  return `${prefixo}Comanda`;
};

// Detalhe completo de uma comanda (garçom, cliente, itens, pagamentos, saldo) — reaproveitado
// tanto na lista de itens em preparo quanto na tela de pendências (comandas/mesas em aberto).
const DetalheComandaBox = ({ detalhe, carregando }) => (
  carregando ? (
    <p className="text-[10px] text-[#A1A1AA]">Carregando...</p>
  ) : !detalhe ? (
    <p className="text-[10px] text-red-500">Não foi possível carregar os dados da comanda.</p>
  ) : (
    <div className="space-y-2">
      <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] space-y-0.5">
        <p className="truncate">Garçom: <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{detalhe.garcons?.nome ?? '—'}</span></p>
        <p className="truncate">Cliente: <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{detalhe.cliente_mesa_nome || '—'}</span></p>
        {detalhe.numero_comanda && <p>Comanda nº: <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{detalhe.numero_comanda}</span></p>}
        <p>Aberta em: <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{fmtDate(detalhe.created_at)}</span></p>
        <p>Total: <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{fmt(detalhe.total)}</span></p>
      </div>

      <div>
        <p className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest mb-0.5">Itens</p>
        {detalhe.itens?.length ? detalhe.itens.map((it) => (
          <div key={it.id} className="flex items-start justify-between gap-2 text-[10px] py-0.5">
            <span className="text-[#18181B] dark:text-[#F4F4F5] min-w-0 break-words">{it.quantity}x {it.products?.name ?? 'Item'}{it.observacao ? ` (${it.observacao})` : ''}</span>
            <span className="text-[#A1A1AA] flex-shrink-0">{it.status}</span>
          </div>
        )) : <p className="text-[10px] text-green-600 dark:text-green-400">Nenhum item lançado — comanda vazia.</p>}
      </div>

      <div>
        <p className="text-[9px] font-black text-[#A1A1AA] uppercase tracking-widest mb-0.5">Pagamentos</p>
        {detalhe.pagamentos?.length ? detalhe.pagamentos.map((pg) => (
          <div key={pg.id} className="flex items-start justify-between gap-2 text-[10px] py-0.5">
            <span className="text-[#18181B] dark:text-[#F4F4F5] min-w-0 truncate">{PL[pg.forma_pagamento] ?? pg.forma_pagamento} · {pg.origem}</span>
            <span className="text-[#A1A1AA] flex-shrink-0">{fmt(pg.valor)} · {fmtDate(pg.criado_em)}</span>
          </div>
        )) : <p className="text-[10px] text-[#A1A1AA]">Nenhum pagamento registrado.</p>}
      </div>

      {detalhe.saldo > 0 && (
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Saldo devedor: {fmt(detalhe.saldo)}</p>
      )}
    </div>
  )
);

const PreparoEmAndamentoView = ({ pedidosEmPreparo, itensEmPreparo, onMarcarProntos, marcando, onContinuar, onCancelar }) => {
  const [pedidosSel, setPedidosSel] = useState(new Set());
  const [itensSel, setItensSel] = useState(new Set());
  const [comandasExpandidas, setComandasExpandidas] = useState(new Set());
  const [detalhesComanda, setDetalhesComanda] = useState({});
  const [carregandoComandaIds, setCarregandoComandaIds] = useState(new Set());

  const totalItens = pedidosEmPreparo.length + itensEmPreparo.length;
  const totalSel = pedidosSel.size + itensSel.size;

  const toggle = (setFn, id) => setFn((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const selecionarTodos = () => {
    setPedidosSel(new Set(pedidosEmPreparo.map((p) => p.id)));
    setItensSel(new Set(itensEmPreparo.map((i) => i.id)));
  };
  const selecionarNenhum = () => { setPedidosSel(new Set()); setItensSel(new Set()); };

  const toggleExpandirComanda = async (orderId) => {
    setComandasExpandidas((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
    if (!detalhesComanda[orderId]) {
      setCarregandoComandaIds((prev) => new Set(prev).add(orderId));
      try {
        const data = await getSalaoComandaDetalhe(orderId);
        setDetalhesComanda((prev) => ({ ...prev, [orderId]: data }));
      } catch { /* mostra erro na própria linha */ }
      finally { setCarregandoComandaIds((prev) => { const next = new Set(prev); next.delete(orderId); return next; }); }
    }
  };

  const handleMarcar = async () => {
    await onMarcarProntos({ pedidoIds: [...pedidosSel], itemIds: [...itensSel] });
    selecionarNenhum();
  };

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">👨‍🍳</p>
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Pedidos ainda em preparo</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
          {totalItens} {totalItens === 1 ? 'item está' : 'itens estão'} em produção. Marque como pronto o que já terminou, ou continue deixando pendente.
        </p>
      </div>

      <div className="flex justify-end gap-2 mb-2">
        <button onClick={selecionarTodos} className="text-[11px] font-bold text-[#FF441F] hover:underline">Selecionar todos</button>
        <span className="text-[#E4E4E7] dark:text-[#3F3F46]">|</span>
        <button onClick={selecionarNenhum} className="text-[11px] font-bold text-[#71717A] dark:text-[#A1A1AA] hover:underline">Nenhum</button>
      </div>

      {pedidosEmPreparo.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Pedidos delivery/balcão</p>
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
            {pedidosEmPreparo.map((p) => (
              <label key={p.id} className="flex items-start gap-2 text-xs py-1 cursor-pointer">
                <input type="checkbox" checked={pedidosSel.has(p.id)} onChange={() => toggle(setPedidosSel, p.id)}
                  className="accent-[#FF441F] flex-shrink-0 mt-0.5" />
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] flex-shrink-0">#{p.id}</span>
                <span className="text-[#71717A] dark:text-[#A1A1AA] flex-1 min-w-0 text-right truncate">{fmt(p.total)} · {PEDIDO_STATUS_LABEL[p.status] ?? p.status}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {itensEmPreparo.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Itens de comanda (salão)</p>
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3 max-h-56 overflow-y-auto">
            {itensEmPreparo.map((i) => (
              <div key={i.id} className="border-b border-orange-100 dark:border-orange-900/40 last:border-0 py-1.5">
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={itensSel.has(i.id)} onChange={() => toggle(setItensSel, i.id)}
                    className="accent-[#FF441F] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#18181B] dark:text-[#F4F4F5] break-words">{i.quantity}x {i.products?.name ?? 'Item'}</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[#71717A] dark:text-[#A1A1AA] text-[11px] truncate">{labelComanda(i.orders)} · {ITEM_STATUS_LABEL[i.status] ?? i.status}</span>
                      <button type="button" onClick={(e) => { e.preventDefault(); toggleExpandirComanda(i.order_id); }}
                        className="text-[10px] font-bold text-[#FF441F] hover:underline flex-shrink-0">
                        {comandasExpandidas.has(i.order_id) ? 'Ocultar' : 'Ver comanda'}
                      </button>
                    </div>
                  </div>
                </label>
                {comandasExpandidas.has(i.order_id) && (
                  <div className="ml-6 mt-1.5 bg-white/70 dark:bg-black/20 rounded-lg p-2">
                    <DetalheComandaBox detalhe={detalhesComanda[i.order_id]} carregando={carregandoComandaIds.has(i.order_id)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">Cancelar</button>
        <button onClick={handleMarcar} disabled={marcando || totalSel === 0}
          className="flex-1 py-2.5 text-sm bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">
          {marcando ? 'Marcando...' : `Marcar ${totalSel || ''} como pronto`}
        </button>
      </div>
      <button onClick={onContinuar} className="w-full py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
        Continuar sem marcar (deixar em preparo)
      </button>
      <p className="text-[10px] text-[#A1A1AA] mt-1.5 text-center">
        O que ficar em preparo continua contando como pendência — você poderá transferir para outro operador ou fechar mesmo assim na próxima etapa.
      </p>
    </>
  );
};

const ComandaLinha = ({ comanda, selecionada, onToggle, expandida, onToggleExpandir, detalhe, carregandoDetalhe }) => (
  <div className="border-b border-orange-100 dark:border-orange-900/40 last:border-0">
    <div className="flex items-center gap-2 flex-wrap text-xs py-1">
      <input type="checkbox" checked={selecionada} onChange={onToggle} className="accent-red-500 flex-shrink-0" />
      <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{comanda.mesas ? `Mesa ${comanda.mesas.numero}` : `Comanda #${comanda.id}`}</span>
      <span className="text-[#71717A] dark:text-[#A1A1AA] flex-1 min-w-0 text-right">{comanda.status === 'aberta' ? 'Em aberto' : 'Aguard. pagamento'}</span>
      <button type="button" onClick={onToggleExpandir} className="text-[10px] font-bold text-[#FF441F] hover:underline flex-shrink-0">
        {expandida ? 'Ocultar' : 'Ver tudo'}
      </button>
    </div>
    {expandida && (
      <div className="ml-6 mb-1.5 bg-white/70 dark:bg-black/20 rounded-lg p-2">
        <DetalheComandaBox detalhe={detalhe} carregando={carregandoDetalhe} />
        {detalhe && !detalhe.itens?.length && (
          <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">Pode excluir sem risco — comanda vazia.</p>
        )}
      </div>
    )}
  </div>
);

const PedidosAbertosView = ({ pedidosAbertos, comandasAbertas, mesasAbertas, onTransferir, onFecharComPendencia, onExcluirComandas, excluindo, onCancelar, fechando }) => {
  const [novoOperador, setNovoOperador] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [modoTransf, setModoTransf] = useState(false);
  const [comandasSel, setComandasSel] = useState(new Set());
  const [expandidas, setExpandidas] = useState(new Set());
  const [detalhes, setDetalhes] = useState({});
  const [carregandoIds, setCarregandoIds] = useState(new Set());
  const totalPendencias = pedidosAbertos.length + comandasAbertas.length + mesasAbertas.length;

  const toggleComanda = (id) => setComandasSel((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const selecionarTodasComandas = () => setComandasSel(new Set(comandasAbertas.map((c) => c.id)));
  const selecionarNenhumaComanda = () => setComandasSel(new Set());

  const toggleExpandir = async (id) => {
    setExpandidas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (!detalhes[id]) {
      setCarregandoIds((prev) => new Set(prev).add(id));
      try {
        const data = await getSalaoComandaDetalhe(id);
        setDetalhes((prev) => ({ ...prev, [id]: data }));
      } catch { /* mostra erro na própria linha */ }
      finally { setCarregandoIds((prev) => { const next = new Set(prev); next.delete(id); return next; }); }
    }
  };

  const handleExcluir = () => {
    if (!window.confirm(`Excluir ${comandasSel.size} comanda(s) selecionada(s)? Comandas vazias são apagadas; comandas com itens são canceladas e pagamentos já registrados são estornados. A mesa é liberada automaticamente.`)) return;
    onExcluirComandas([...comandasSel]);
    setComandasSel(new Set());
  };

  if (modoTransf) return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🔄</p>
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Transferir e Abrir Novo Caixa</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{totalPendencias} pedido(s)/comanda(s) serão transferidos</p>
      </div>
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Operador do novo caixa *</label>
          <input value={novoOperador} onChange={(e) => setNovoOperador(e.target.value)} placeholder="Ex: João"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Valor inicial do novo caixa (R$)</label>
          <input type="number" min="0" step="0.01" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} placeholder="0,00"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setModoTransf(false)} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">Voltar</button>
        <button onClick={() => onTransferir({ nome_operador: novoOperador.trim(), valor_inicial: parseFloat(novoValor) || 0 })}
          disabled={fechando || !novoOperador.trim()}
          className="flex-1 py-2.5 text-sm bg-[#FF441F] text-white rounded-xl font-bold hover:bg-[#E63A19] disabled:opacity-50">
          {fechando ? 'Transferindo...' : 'Confirmar'}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">⚠️</p>
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Pendências em Aberto</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Caixa não pode fechar com pedidos, comandas ou mesas em andamento</p>
      </div>
      {pedidosAbertos.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Pedidos delivery</p>
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3 max-h-32 overflow-y-auto">
            {pedidosAbertos.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs py-1 border-b border-orange-100 dark:border-orange-900/40 last:border-0">
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] flex-shrink-0">#{p.id}</span>
                <span className="text-[#71717A] dark:text-[#A1A1AA] flex-1 min-w-0 text-right truncate">{fmt(p.total)} · {p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {comandasAbertas.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest">Comandas do salão</p>
            <div className="flex gap-2 flex-shrink-0 ml-2">
              <button onClick={selecionarTodasComandas} className="text-[11px] font-bold text-[#FF441F] hover:underline">Selecionar todas</button>
              <button onClick={selecionarNenhumaComanda} className="text-[11px] font-bold text-[#71717A] dark:text-[#A1A1AA] hover:underline">Nenhuma</button>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3 max-h-56 overflow-y-auto">
            {comandasAbertas.map((c) => (
              <ComandaLinha
                key={c.id}
                comanda={c}
                selecionada={comandasSel.has(c.id)}
                onToggle={() => toggleComanda(c.id)}
                expandida={expandidas.has(c.id)}
                onToggleExpandir={() => toggleExpandir(c.id)}
                detalhe={detalhes[c.id]}
                carregandoDetalhe={carregandoIds.has(c.id)}
              />
            ))}
          </div>
          <p className="text-[10px] text-[#A1A1AA] mt-1">Consulte os itens antes de decidir — vazia ou de teste pode excluir sem risco.</p>
          <button onClick={handleExcluir} disabled={excluindo || comandasSel.size === 0}
            className="w-full mt-2 py-2 text-sm bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50">
            {excluindo ? 'Excluindo...' : `Excluir ${comandasSel.size || ''} comanda${comandasSel.size === 1 ? '' : 's'} selecionada${comandasSel.size === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
      {mesasAbertas.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Mesas ocupadas</p>
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3 max-h-32 overflow-y-auto">
            {mesasAbertas.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-xs py-1 border-b border-orange-100 dark:border-orange-900/40 last:border-0">
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">Mesa {m.numero}{m.nome ? ` - ${m.nome}` : ''}</span>
                <span className="text-[#71717A] dark:text-[#A1A1AA] flex-1 min-w-0 text-right truncate">{m.status === 'ocupada' ? 'Ocupada' : 'Aguard. pagamento'}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#A1A1AA] mt-1">Liberada automaticamente ao excluir a comanda correspondente acima.</p>
        </div>
      )}
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3 text-center">
        Resolva os pedidos/comandas, transfira para um novo operador, ou feche liberando as mesas e deixando as comandas pendentes (fiado).
      </p>
      <div className="flex gap-2 mb-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">Cancelar</button>
        {totalPendencias > 0 && (
          <button onClick={() => setModoTransf(true)} className="flex-1 py-2.5 text-sm bg-[#FF441F] text-white rounded-xl font-bold hover:bg-[#E63A19]">Transferir</button>
        )}
      </div>
      {totalPendencias > 0 && (
        <>
          <button onClick={onFecharComPendencia} className="w-full py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
            Fechar mesmo assim (liberar mesas, deixar pendente)
          </button>
          <p className="text-[10px] text-[#A1A1AA] mt-1.5 text-center">
            As mesas ocupadas são liberadas pro próximo cliente. As comandas continuam ativas e serão cobradas no próximo caixa que estiver aberto quando o cliente pagar.
          </p>
        </>
      )}
    </>
  );
};

// ── Tela 2: conferência de fechamento ────────────────────────────────────────
const DestinacaoView = ({ resumo, aberto_em, valorInicial, comPendencias, onFechar, onCancelar, fechando }) => {
  const r = resumo ?? {};
  const [dinheiroContado, setDinheiroContado] = useState('');

  const vendasDinheiro  = r.por_pagamento?.cash ?? 0;
  const entradasEspecie = r.entradas_especie ?? 0;
  const saidasEspecie   = r.saidas_especie ?? 0;
  const especieCalc     = r.especie_calculada ?? Math.max(0, (valorInicial ?? 0) + entradasEspecie - saidasEspecie);
  // Taxa de cartão some daqui (mostrada junto de cada forma abaixo, não como linha solta).
  const digitais        = Object.entries(r.por_pagamento ?? {}).filter(([k]) => k !== 'cash' && k !== 'taxa_cartao');
  const taxaPorForma     = r.taxa_por_forma ?? {};
  const totalDigital    = digitais.reduce((s, [, v]) => s + v, 0) + Object.values(taxaPorForma).reduce((s, v) => s + v, 0);
  const totalFaturamento = vendasDinheiro + totalDigital;

  const contadoVal = parseFloat(dinheiroContado) || 0;
  const diferenca  = contadoVal - especieCalc;
  const temContagem = dinheiroContado !== '';

  const difCor = diferenca === 0
    ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800'
    : diferenca > 0 ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
  const difTxt = diferenca === 0
    ? 'text-green-700 dark:text-green-400'
    : diferenca > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-600 dark:text-red-400';

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🏁</p>
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Fechar Caixa</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Conferência de fechamento · {fmtDate(aberto_em)}</p>
      </div>

      {/* Composição da espécie */}
      <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-4 py-3 mb-3">
        <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Composição do caixa</p>
        <Row label="Fundo inicial (troco)" value={fmt(valorInicial ?? 0)} />
        <Row label="+ Vendas + adições em dinheiro"  value={fmt(entradasEspecie)} />
        {saidasEspecie > 0 && <Row label="− Sangrias / troco (dinheiro)" value={`- ${fmt(saidasEspecie)}`} />}
        <div className="pt-1 mt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
          <Row label="Espécie esperada no caixa" value={fmt(especieCalc)} bold />
        </div>
      </div>

      {/* Vendas digitais */}
      {digitais.length > 0 && (
        <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-4 py-3 mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Vendas digitais</p>
          {digitais.map(([k, v]) => {
            const taxa = taxaPorForma[k] ?? 0;
            if (taxa <= 0) return <Row key={k} label={PL[k] ?? k} value={fmt(v)} />;
            return (
              <div key={k} className="py-1.5 border-b border-[#F4F4F5] dark:border-[#3F3F46] last:border-0">
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">{PL[k] ?? k}</span>
                  <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(v)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#A1A1AA]">+ Taxa cartão</span>
                  <span className="text-[#A1A1AA]">{fmt(taxa)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-[#18181B] dark:text-[#F4F4F5]">= Total {PL[k] ?? k}</span>
                  <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(v + taxa)}</span>
                </div>
              </div>
            );
          })}
          <div className="pt-1 mt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
            <Row label="Total digital" value={fmt(totalDigital)} bold />
          </div>
        </div>
      )}

      {/* Total geral (dinheiro + digital) */}
      <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-4 py-3 mb-3">
        <Row label="Total faturamento (dinheiro + digital)" value={fmt(totalFaturamento)} bold accent />
      </div>

      {/* Contagem do operador */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-1.5">
          💵 Quanto de dinheiro você conta no caixa agora? *
        </label>
        <input
          type="number" min="0" step="0.01"
          value={dinheiroContado}
          onChange={(e) => setDinheiroContado(e.target.value)}
          placeholder="0,00"
          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]"
          autoFocus
        />
      </div>

      {/* Resultado da conferência */}
      {temContagem && (
        <div className={`rounded-xl px-4 py-3 mb-3 border ${difCor}`}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Espécie esperada</span>
            <span className="font-semibold">{fmt(especieCalc)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Dinheiro contado</span>
            <span className="font-semibold">{fmt(contadoVal)}</span>
          </div>
          <div className={`flex justify-between text-sm font-bold pt-1 border-t border-current/10`}>
            <span>Diferença</span>
            <span className={difTxt}>
              {diferenca > 0 ? '+' : ''}{fmt(diferenca)}
              {diferenca === 0 ? ' ✓ ok' : diferenca > 0 ? ' (sobra)' : ' (falta)'}
            </span>
          </div>
        </div>
      )}

      {comPendencias && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 mb-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
            Fechando com pendências — mesas ocupadas serão liberadas e as comandas continuam ativas, cobradas no próximo caixa aberto.
          </p>
        </div>
      )}

      <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mb-3 text-center">
        Enviado ao financeiro para conferência e aprovação do gerente.
      </p>

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">Cancelar</button>
        <button
          onClick={() => onFechar({ dinheiro_contado: contadoVal, ...(comPendencias ? { permitir_pendencias: true } : {}) })}
          disabled={fechando || !temContagem}
          className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50">
          {fechando ? 'Fechando...' : 'Fechar caixa'}
        </button>
      </div>
    </>
  );
};

// ── Modal principal ───────────────────────────────────────────────────────────
const FecharCaixaModal = ({
  resumo, aberto_em, valorInicial,
  pedidosAbertos, comandasAbertas, mesasAbertas,
  pedidosEmPreparo = [], itensEmPreparo = [], onMarcarProntos, marcandoProntos,
  onExcluirComandas, excluindoComandas,
  onConfirmar, onFecharETransferir, onCancelar,
  fechando,
}) => {
  const [forcarFechamento, setForcarFechamento] = useState(false);
  const [preparoVisto, setPreparoVisto] = useState(false);
  const temPendencias = (pedidosAbertos ?? []).length > 0 || (comandasAbertas ?? []).length > 0 || (mesasAbertas ?? []).length > 0;
  const temPreparo = (pedidosEmPreparo ?? []).length > 0 || (itensEmPreparo ?? []).length > 0;
  const mostrarPreparo = temPreparo && !preparoVisto;
  const mostrarPendencias = !mostrarPreparo && temPendencias && !forcarFechamento;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
        {mostrarPreparo
          ? <PreparoEmAndamentoView
              pedidosEmPreparo={pedidosEmPreparo ?? []}
              itensEmPreparo={itensEmPreparo ?? []}
              onMarcarProntos={onMarcarProntos}
              marcando={marcandoProntos}
              onContinuar={() => setPreparoVisto(true)}
              onCancelar={onCancelar}
            />
          : mostrarPendencias
          ? <PedidosAbertosView
              pedidosAbertos={pedidosAbertos ?? []}
              comandasAbertas={comandasAbertas ?? []}
              mesasAbertas={mesasAbertas ?? []}
              onTransferir={onFecharETransferir}
              onFecharComPendencia={() => setForcarFechamento(true)}
              onExcluirComandas={onExcluirComandas}
              excluindo={excluindoComandas}
              onCancelar={onCancelar}
              fechando={fechando}
            />
          : <DestinacaoView
              resumo={resumo} aberto_em={aberto_em} valorInicial={valorInicial}
              comPendencias={temPendencias}
              onFechar={onConfirmar} onCancelar={onCancelar} fechando={fechando}
            />
        }
      </div>
    </div>
  );
};

export default FecharCaixaModal;
