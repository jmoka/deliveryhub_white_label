import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  entrarNaMesa, obterComandaAuto, adicionarItensAuto, removerItemAuto, solicitarPedidoAuto, definirGorjetaAuto,
  solicitarConferenciaAuto, getSessaoLocal, setSessaoLocal, limparSessaoLocal,
} from '../../services/autoAtendimentoService';
import { getCardapioPorSlug } from '../../services/restauranteService';
import { imgUrl } from '../../lib/imgUrl';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const STATUS_ITEM_LABEL = { pendente: 'No carrinho', enviado: 'Enviado — aguardando preparo', preparando: 'Em preparo', pronto: 'Pronto!' };
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };

// Cliente escaneia o QR fixo da mesa e pede direto, sem depender do garçom (pedido do
// usuário 2026-08-03). Rota pública — a sessão vive no localStorage do celular
// (ver autoAtendimentoService) e amarra o cliente à comanda enquanto ela ficar aberta.
const AutoAtendimento = () => {
  const { token } = useParams();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [aguardando, setAguardando] = useState(null); // { numero, nome } — mesa sem comanda aberta ainda
  const [sessao, setSessao] = useState(null);
  const [comanda, setComanda] = useState(null);
  const [cardapio, setCardapio] = useState(null);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [adicionandoId, setAdicionandoId] = useState(null);
  const [solicitando, setSolicitando] = useState(false);
  const [salvandoGorjeta, setSalvandoGorjeta] = useState(false);
  const [solicitandoConferencia, setSolicitandoConferencia] = useState(false);
  const [msg, setMsg] = useState(null);

  const carregarComanda = useCallback(async (sess) => {
    const data = await obterComandaAuto(token, sess.sessionId);
    setComanda(data);
    return data;
  }, [token]);

  const carregarCardapio = useCallback(async (slug) => {
    if (!slug) return;
    const cat = await getCardapioPorSlug(slug);
    setCardapio(cat);
    setCategoriaAtiva((atual) => atual ?? cat.cardapio?.[0]?.id ?? null);
  }, []);

  const tentarEntrar = useCallback(async () => {
    let sess = getSessaoLocal(token);
    if (sess) {
      try {
        const data = await obterComandaAuto(token, sess.sessionId);
        return { sess, data };
      } catch (e) {
        limparSessaoLocal(token);
        throw e;
      }
    }
    const res = await entrarNaMesa(token);
    if (res.aguardandoGarcom) return { aguardando: res.mesa };
    sess = { comandaId: res.comandaId, sessionId: res.sessionId };
    setSessaoLocal(token, sess);
    const data = await obterComandaAuto(token, sess.sessionId);
    return { sess, data };
  }, [token]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro(null);
      try {
        const r = await tentarEntrar();
        if (!ativo) return;
        if (r.aguardando) {
          setAguardando(r.aguardando);
          return;
        }
        setAguardando(null);
        setSessao(r.sess);
        setComanda(r.data);
        await carregarCardapio(r.data.restauranteSlug);
      } catch (e) {
        if (ativo) setErro(e.message ?? 'Não foi possível acessar essa mesa.');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [token, tentarEntrar, carregarCardapio]);

  // Mesa ainda sem comanda aberta — fica tentando de novo até o garçom abrir (sem
  // recarregar a tela inteira nem mostrar spinner de novo a cada tentativa).
  useEffect(() => {
    if (!aguardando || sessao) return;
    const interval = setInterval(async () => {
      try {
        const r = await tentarEntrar();
        if (!r.aguardando) {
          setAguardando(null);
          setSessao(r.sess);
          setComanda(r.data);
          await carregarCardapio(r.data.restauranteSlug);
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [aguardando, sessao, tentarEntrar, carregarCardapio]);

  // Poll leve pra acompanhar status dos itens já enviados (mesmo intervalo do mesa-acompanhar).
  useEffect(() => {
    if (!sessao) return;
    const interval = setInterval(() => {
      carregarComanda(sessao).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [sessao, carregarComanda]);

  const adicionarProduto = async (produto) => {
    if (!sessao) return;
    setAdicionandoId(produto.id);
    setMsg(null);
    try {
      await adicionarItensAuto(token, sessao.sessionId, [{ product_id: produto.id, quantity: 1 }]);
      await carregarComanda(sessao);
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message ?? 'Não foi possível adicionar o produto.' });
    } finally {
      setAdicionandoId(null);
    }
  };

  const removerProduto = async (item) => {
    if (!sessao) return;
    setMsg(null);
    try {
      await removerItemAuto(token, sessao.sessionId, item.id);
      await carregarComanda(sessao);
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message ?? 'Não foi possível remover o item.' });
    }
  };

  const handleGorjeta = async (semGorjetaNovo) => {
    setSalvandoGorjeta(true);
    try {
      const data = await definirGorjetaAuto(token, sessao.sessionId, semGorjetaNovo);
      setComanda(data);
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message ?? 'Não foi possível atualizar a gorjeta.' });
    } finally {
      setSalvandoGorjeta(false);
    }
  };

  const handleSolicitarConferencia = async () => {
    setSolicitandoConferencia(true);
    setMsg(null);
    try {
      const data = await solicitarConferenciaAuto(token, sessao.sessionId);
      setComanda(data);
      setMsg({ tipo: 'ok', texto: 'Solicitação enviada! O garçom já foi avisado.' });
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message ?? 'Não foi possível solicitar agora, chame o garçom.' });
    } finally {
      setSolicitandoConferencia(false);
    }
  };

  const handleSolicitarPedido = async () => {
    setSolicitando(true);
    setMsg(null);
    try {
      await solicitarPedidoAuto(token, sessao.sessionId);
      setMsg({ tipo: 'ok', texto: 'Pedido enviado pra cozinha!' });
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message ?? 'Não foi possível enviar o pedido.' });
    } finally {
      setSolicitando(false);
    }
  };

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[#71717A]">Carregando...</div>;
  }
  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-red-600">{erro}</p>
      </div>
    );
  }
  if (aguardando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-2">
        <div className="w-14 h-14 bg-[#FF441F]/10 rounded-2xl flex items-center justify-center mb-2">
          <Icon name="Clock" size={26} className="text-[#FF441F]" />
        </div>
        <p className="text-base font-bold text-[#18181B]">Aguarde o garçom te atender</p>
        <p className="text-sm text-[#71717A]">
          Mesa {aguardando.numero}{aguardando.nome ? ` - ${aguardando.nome}` : ''} ainda não tem atendimento aberto.
          Assim que o garçom abrir, essa página libera sozinha.
        </p>
      </div>
    );
  }
  if (!comanda) return null;

  const itensPendentes = comanda.itens.filter((i) => i.status === 'pendente');
  const itensEnviados = comanda.itens.filter((i) => i.status !== 'pendente');
  const totalPendente = itensPendentes.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const categoriaSelecionada = cardapio?.cardapio?.find((c) => c.id === categoriaAtiva);

  return (
    <div className="min-h-screen bg-[#F4F4F5] p-4 flex flex-col items-center pb-28">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4 mt-4">
          <div className="w-14 h-14 bg-[#FF441F]/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Icon name="UtensilsCrossed" size={26} className="text-[#FF441F]" />
          </div>
          <h1 className="text-lg font-black text-[#18181B]">{cardapio?.restaurante?.name ?? 'Auto Atendimento'}</h1>
          <p className="text-sm text-[#71717A]">
            {comanda.mesa ? `Mesa ${comanda.mesa.numero}${comanda.mesa.nome ? ' - ' + comanda.mesa.nome : ''}` : ''}
            {comanda.numeroComanda ? ` — Comanda #${comanda.numeroComanda}` : ''}
          </p>
        </div>

        {msg && (
          <div className={`rounded-xl px-3 py-2 mb-3 text-sm text-center ${msg.tipo === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {msg.texto}
          </div>
        )}

        <button onClick={() => setMostrarPicker(true)}
          className="w-full mb-3 py-3 bg-[#FF441F] hover:bg-[#E63A19] text-white font-bold rounded-xl flex items-center justify-center gap-2">
          <Icon name="Plus" size={16} /> Inserir produto
        </button>

        {itensPendentes.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-3">
            <p className="text-xs font-bold text-[#71717A] uppercase mb-2">No carrinho (ainda não enviado)</p>
            <div className="space-y-2">
              {itensPendentes.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-[#18181B] min-w-0 truncate">{item.quantity}x {item.products?.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[#71717A]">{fmt(item.quantity * item.unit_price)}</span>
                    <button onClick={() => removerProduto(item)} title="Remover item"
                      className="w-6 h-6 rounded-lg border border-red-200 text-red-500 flex items-center justify-center flex-shrink-0">
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F4F4F5] font-bold text-sm">
              <span>Total</span>
              <span className="text-[#FF441F]">{fmt(totalPendente)}</span>
            </div>
          </div>
        )}

        {itensEnviados.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-3">
            <p className="text-xs font-bold text-[#71717A] uppercase mb-2">Já enviados</p>
            <div className="space-y-2">
              {itensEnviados.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#18181B]">{item.quantity}x {item.products?.name}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                    item.status === 'pronto' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {STATUS_ITEM_LABEL[item.status] ?? item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {itensPendentes.length === 0 && itensEnviados.length === 0 && (
          <p className="text-center text-sm text-[#71717A] mt-6">Nenhum item ainda — toque em "Inserir produto" pra começar.</p>
        )}

        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-3 space-y-1.5">
          <p className="text-xs font-bold text-[#71717A] uppercase mb-1">Resumo da conta</p>
          <div className="flex justify-between text-sm text-[#71717A]">
            <span>Subtotal</span><span>{fmt(comanda.subtotal)}</span>
          </div>
          {comanda.desconto > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Desconto</span><span>-{fmt(comanda.desconto)}</span>
            </div>
          )}
          {comanda.acrescimo > 0 && (
            <div className="flex justify-between text-sm text-[#71717A]">
              <span>Acréscimo</span><span>{fmt(comanda.acrescimo)}</span>
            </div>
          )}
          {comanda.gorjetaPercentual > 0 && (
            <div className="flex items-center justify-between gap-2 py-1">
              <label className="flex items-center gap-2 text-sm text-[#18181B] cursor-pointer">
                <input type="checkbox" checked={!comanda.semGorjeta} disabled={salvandoGorjeta}
                  onChange={(e) => handleGorjeta(!e.target.checked)}
                  className="w-4 h-4 accent-[#FF441F]" />
                Gorjeta ({comanda.gorjetaPercentual}%){comanda.gorjetaEstimativa && <span className="text-[10px] text-[#71717A]"> · estimativa</span>}
              </label>
              <span className="text-sm text-[#71717A]">{fmt(comanda.gorjeta)}</span>
            </div>
          )}
          {comanda.taxaCartaoTotal > 0 && (
            <div className="flex justify-between text-sm text-[#71717A]">
              <span>Taxa cartão</span><span>{fmt(comanda.taxaCartaoTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-[#18181B] pt-1.5 border-t border-[#F4F4F5]">
            <span>Total</span><span>{fmt(comanda.total)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-[#18181B]">
            <span>Falta pagar</span><span>{fmt(comanda.saldo)}</span>
          </div>
        </div>

        {comanda.pagamentos?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-3 space-y-1.5">
            <p className="text-xs text-[#71717A] mb-1">Pagamentos já feitos</p>
            {comanda.pagamentos.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#18181B]">{PAGAMENTO_LABEL[p.forma_pagamento] ?? p.forma_pagamento}</span>
                <span className="text-[#18181B]">
                  {fmt(p.valor)}
                  {p.taxa_cartao_valor > 0 && <span className="text-[#71717A]"> (+{fmt(p.taxa_cartao_valor)} taxa)</span>}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold text-[#18181B] pt-1.5 border-t border-[#E4E4E7]">
              <span>Total pago</span><span>{fmt(comanda.totalPago)}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSolicitarConferencia}
          disabled={solicitandoConferencia || !!comanda.conferenciaSolicitadaEm}
          className="w-full bg-white border border-[#E4E4E7] rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium text-[#18181B] disabled:opacity-60"
        >
          <Icon name={comanda.conferenciaSolicitadaEm ? 'BellRing' : 'Bell'} size={16} />
          {comanda.conferenciaSolicitadaEm ? 'Garçom já foi avisado' : 'Chamar garçom / Solicitar conferência'}
        </button>
      </div>

      {itensPendentes.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E4E4E7] flex justify-center">
          <button onClick={handleSolicitarPedido} disabled={solicitando}
            className="w-full max-w-sm py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {solicitando ? 'Enviando...' : `Solicitar pedido (${fmt(totalPendente)})`}
          </button>
        </div>
      )}

      {mostrarPicker && cardapio && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#E4E4E7]">
              <p className="font-bold text-[#18181B]">Inserir produto</p>
              <button onClick={() => setMostrarPicker(false)}><Icon name="X" size={18} /></button>
            </div>
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-[#E4E4E7]">
              {(cardapio.cardapio ?? []).map((cat) => (
                <button key={cat.id} onClick={() => setCategoriaAtiva(cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${categoriaAtiva === cat.id ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto p-3 space-y-2">
              {(categoriaSelecionada?.produtos ?? []).map((produto) => (
                <div key={produto.id} className="flex items-center gap-2 border border-[#E4E4E7] rounded-xl p-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                    {produto.image_url && <img src={imgUrl(produto.image_url)} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#18181B] truncate">{produto.name}</p>
                    <p className="text-xs text-[#71717A]">{fmt(produto.price)}</p>
                  </div>
                  <button onClick={() => adicionarProduto(produto)} disabled={adicionandoId === produto.id}
                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FF441F] text-white flex items-center justify-center disabled:opacity-50">
                    <Icon name="Plus" size={14} />
                  </button>
                </div>
              ))}
              {!categoriaSelecionada?.produtos?.length && (
                <p className="text-center text-sm text-[#71717A] py-6">Nenhum produto nessa categoria.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoAtendimento;
