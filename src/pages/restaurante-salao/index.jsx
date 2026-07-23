import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getGarconsOnline, getSalaoMesas, getSalaoComandas, getSalaoComandaDetalhe, getSalaoComandasFechadasHoje,
  aplicarDescontoComanda, aplicarAcrescimoComanda, cancelarComandaSalao, pagarComandaSalao,
  adicionarItensComandaSalao, editarItemComandaSalao, removerItemComandaSalao, transferirGarcomComanda, getSugestaoGorjeta,
  listarGarcons, getMeusProdutos, registrarPagamentoParcialSalao, transferirComandaSalao,
  editarPagamentoParcialSalao, removerPagamentoParcialSalao, abrirVendaBalcao, reabrirComandaSalao,
  abrirComandaSalao, bloquearMesaSalao, desbloquearMesaSalao, imprimirConferenciaSalao, getConfig,
  reimprimirReciboSalao,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import { printReciboCliente, printConferenciaComanda } from '../../utils/printComanda';
import { getAcompanharUrls } from '../../utils/mesaAcompanharUrl';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };

const MESA_STATUS_COR = {
  livre: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ocupada: 'bg-orange-100 text-orange-700 border-orange-200',
  aguardando_pagamento: 'bg-blue-100 text-blue-700 border-blue-200',
  bloqueada: 'bg-zinc-200 text-zinc-500 border-zinc-300',
};
const MESA_STATUS_LABEL = { livre: 'Livre', ocupada: 'Ocupada', aguardando_pagamento: 'Aguard. pagamento', bloqueada: 'Bloqueada' };

// Estabelecimento abre mesa/comanda direto, sem precisar de garçom.
const AbrirComandaModal = ({ mesa, onFechar, onAberta }) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const comanda = await abrirComandaSalao({ mesa_id: mesa?.id ?? null, cliente_nome: nome.trim(), cliente_telefone: telefone.trim() });
      onAberta(comanda);
    } catch (err) {
      setErro(err.message ?? 'Não foi possível abrir a comanda.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#18181B] mb-1">
          {mesa ? `Abrir Mesa ${mesa.numero}` : 'Abrir comanda avulsa'}
        </h2>
        <p className="text-xs text-[#71717A] mb-4">Nome e telefone do cliente são obrigatórios antes de vender.</p>
        <form onSubmit={submit} className="space-y-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" required
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone do cliente" required
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
              {salvando ? 'Abrindo...' : 'Abrir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Picker de produto com busca + filtro por categoria — mesmo padrão do garçom
// (garcom-portal), reaproveitado aqui pro estabelecimento incluir item na comanda.
const QuickAddProdutoModal = ({ produto, onFechar, onConfirmar }) => {
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const confirmar = async () => {
    setSalvando(true);
    try {
      await onConfirmar({ product_id: produto.id, quantity: quantidade, observacao: observacao.trim() || undefined });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
            {produto.image_url
              ? <img src={produto.image_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={20} className="text-[#A1A1AA]" /></div>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#18181B] truncate">{produto.name}</p>
            <p className="text-xs text-[#71717A]">{fmt(produto.price)}</p>
          </div>
        </div>

        <label className="text-xs text-[#71717A]">Quantidade</label>
        <div className="flex items-center gap-3 mt-1 mb-3">
          <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-xl border border-[#E4E4E7] flex items-center justify-center text-lg font-bold text-[#27272A]">−</button>
          <span className="text-lg font-bold text-[#18181B] w-8 text-center">{quantidade}</span>
          <button onClick={() => setQuantidade((q) => q + 1)}
            className="w-10 h-10 rounded-xl border border-[#E4E4E7] flex items-center justify-center text-lg font-bold text-[#27272A]">+</button>
        </div>

        <label className="text-xs text-[#71717A]">Observação (opcional)</label>
        <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2}
          placeholder="Ex: sem cebola, ponto da carne..."
          className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm mt-1 mb-4 resize-none" />

        <div className="flex gap-2">
          <button onClick={onFechar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A]">
            Cancelar
          </button>
          <button onClick={confirmar} disabled={salvando}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
            {salvando ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProdutoPickerModal = ({ produtos, onFechar, onAdicionado }) => {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [produtoAtivo, setProdutoAtivo] = useState(null);

  const categorias = ['todas', ...new Set(produtos.map((p) => p.category_name ?? 'Outros'))];
  const filtrados = produtos.filter((p) => {
    const bateBusca = p.name.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = categoria === 'todas' || (p.category_name ?? 'Outros') === categoria;
    return bateBusca && bateCategoria;
  });

  return (
    <div className="fixed inset-0 bg-white z-[55] flex flex-col">
      <div className="p-4 border-b border-[#E4E4E7] sticky top-0 bg-white max-w-2xl w-full mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onFechar} className="p-1 text-[#71717A]"><Icon name="ArrowLeft" size={20} /></button>
          <h2 className="text-base font-bold text-[#18181B]">Adicionar produto</h2>
        </div>
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." autoFocus
            className="w-full border border-[#E4E4E7] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
        </div>
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
          {categorias.map((c) => (
            <button key={c} onClick={() => setCategoria(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                categoria === c ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'
              }`}>
              {c === 'todas' ? 'Todas' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl w-full mx-auto space-y-2">
        {filtrados.map((p) => (
          <button key={p.id} onClick={() => setProdutoAtivo(p)}
            className="w-full bg-white border border-[#E4E4E7] rounded-xl p-2.5 flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F4F4F5] flex-shrink-0">
              {p.image_url
                ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={18} className="text-[#A1A1AA]" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#18181B] truncate">{p.name}</p>
              <p className="text-xs text-[#71717A]">{fmt(p.price)}</p>
            </div>
            <Icon name="Plus" size={18} className="text-[#FF441F] flex-shrink-0" />
          </button>
        ))}
        {filtrados.length === 0 && <p className="text-sm text-[#A1A1AA] text-center py-6">Nenhum produto encontrado.</p>}
      </div>

      {produtoAtivo && (
        <QuickAddProdutoModal
          produto={produtoAtivo}
          onFechar={() => setProdutoAtivo(null)}
          onConfirmar={async (item) => { await onAdicionado(item); setProdutoAtivo(null); }}
        />
      )}
    </div>
  );
};

const ComandaModal = ({ comandaId, mesas, onFechar, onMudou }) => {
  const [comanda, setComanda] = useState(null);
  const [descontoInput, setDescontoInput] = useState('');
  const [acrescimoInput, setAcrescimoInput] = useState('');
  const [forma, setForma] = useState('pix');
  const formaTocada = useRef(false);
  const [gorjeta, setGorjeta] = useState('');
  const [gorjetaPercentual, setGorjetaPercentual] = useState(0);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [garcons, setGarcons] = useState([]);
  const [garcomSelecionado, setGarcomSelecionado] = useState('');

  const [produtos, setProdutos] = useState([]);
  const [mostrarPicker, setMostrarPicker] = useState(false);

  const [valorPagamento, setValorPagamento] = useState('');
  const [formaPagamentoParcial, setFormaPagamentoParcial] = useState('pix');
  const [valorRecebidoParcial, setValorRecebidoParcial] = useState('');
  const [valorRecebidoFinal, setValorRecebidoFinal] = useState('');
  const [mesaDestino, setMesaDestino] = useState('');
  const [mostrarQr, setMostrarQr] = useState(false);
  const [qrModo, setQrModo] = useState('online'); // 'online' | 'local'
  const [pagamentoEditandoId, setPagamentoEditandoId] = useState(null);
  const [valorEdicao, setValorEdicao] = useState('');
  const [formaEdicao, setFormaEdicao] = useState('pix');
  const [taxaCartaoPercentual, setTaxaCartaoPercentual] = useState(0);

  const carregar = useCallback(async () => {
    const [c, sugestao] = await Promise.all([getSalaoComandaDetalhe(comandaId), getSugestaoGorjeta(comandaId)]);
    setComanda(c);
    setDescontoInput(String(c.desconto_valor ?? 0));
    setAcrescimoInput(String(c.acrescimo_valor ?? 0));
    setGorjetaPercentual(sugestao.percentual);
    setGorjeta((v) => (v === '' ? String(sugestao.valor_sugerido) : v));
    // Pré-preenche com a forma que o garçom já informou ao fechar a comanda — só na
    // primeira carga, pra não sobrescrever se o caixa já mudou manualmente.
    if (!formaTocada.current && c.payment_method) {
      setForma(c.payment_method);
    }
  }, [comandaId]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    listarGarcons().then(setGarcons).catch(() => {});
    getMeusProdutos().then((d) => setProdutos(d.produtos ?? [])).catch(() => {});
    getConfig().then((c) => setTaxaCartaoPercentual(c.taxa_cartao_percentual ?? 0)).catch(() => {});
  }, []);

  const isCartao = (f) => f === 'credit_card' || f === 'debit_card';

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

  const reabrir = () => {
    if (!window.confirm('Reabrir esta comanda? O cliente volta a consumir e a mesa fica ocupada de novo.')) return;
    acao(() => reabrirComandaSalao(comandaId));
  };

  const imprimirConferencia = () => {
    acao(async () => {
      const valores = {
        desconto: Number(descontoInput || 0),
        acrescimo: Number(acrescimoInput || 0),
        gorjeta: Number(gorjeta || 0),
        taxaCartao: taxaCartaoTotalExibida,
        formaPagamento: forma,
      };
      const res = await imprimirConferenciaSalao(comandaId, valores);
      if (res?.via !== 'agente') printConferenciaComanda(comanda, comanda.itens ?? [], valores);
    });
  };

  const reimprimirRecibo = () => {
    acao(async () => {
      const res = await reimprimirReciboSalao(comandaId);
      if (res?.recibo?.via !== 'agente') {
        printReciboCliente(comanda, comanda.itens ?? [], {
          subtotal: res?.subtotal ?? subtotal,
          desconto: Number(comanda.desconto_valor || 0),
          acrescimo: Number(comanda.acrescimo_valor || 0),
          gorjeta: Number(comanda.gorjeta_valor || 0),
          taxaCartao: res?.taxa_cartao_valor ?? 0,
          total: comanda.total,
          formaPagamento: comanda.payment_method,
          trocoDado: 0,
          pagamentos: res?.pagamentos ?? comanda.pagamentos ?? [],
        });
      }
    });
  };

  const pagar = () => {
    if (forma === 'cash' && valorRecebidoFinal && Number(valorRecebidoFinal) < valorACobrarFinal) {
      setErro('Valor recebido não pode ser menor que o valor a pagar.');
      return;
    }
    acao(async () => {
      const res = await pagarComandaSalao(
        comandaId, forma, gorjeta ? Number(gorjeta) : undefined,
        forma === 'cash' && valorRecebidoFinal ? Number(valorRecebidoFinal) : undefined,
      );
      if (res?.recibo?.via !== 'agente') {
        printReciboCliente(comanda, comanda.itens ?? [], {
          subtotal,
          desconto: Number(descontoInput || 0),
          acrescimo: Number(acrescimoInput || 0),
          gorjeta: Number(gorjeta || 0),
          taxaCartao: res?.taxa_cartao_valor ?? 0,
          total: res?.valor_cobrado ?? res?.total ?? valorACobrarFinal,
          formaPagamento: forma,
          trocoDado: res?.troco ?? 0,
          pagamentos: res?.pagamentos ?? [],
        });
      }
      onFechar();
    });
  };

  const transferir = () => {
    if (!garcomSelecionado) return;
    acao(() => transferirGarcomComanda(comandaId, Number(garcomSelecionado)));
  };

  const incluirItem = (item) => acao(() => adicionarItensComandaSalao(comandaId, [item]));

  const removerItem = (item) => {
    if (!window.confirm(`Remover ${item.products?.name}?`)) return;
    acao(() => removerItemComandaSalao(comandaId, item.id));
  };

  const alterarQuantidadeItem = (item, delta) => {
    const novaQtd = item.quantity + delta;
    if (novaQtd < 1) return;
    acao(() => editarItemComandaSalao(comandaId, item.id, { quantity: novaQtd }));
  };

  const registrarPagamento = () => {
    const v = Number(valorPagamento);
    if (!v || v <= 0) return;
    if (formaPagamentoParcial === 'cash' && valorRecebidoParcial && Number(valorRecebidoParcial) < v) {
      setErro('Valor recebido não pode ser menor que o valor a pagar.');
      return;
    }
    acao(async () => {
      await registrarPagamentoParcialSalao(
        comandaId, v, formaPagamentoParcial,
        formaPagamentoParcial === 'cash' && valorRecebidoParcial ? Number(valorRecebidoParcial) : undefined,
      );
      setValorPagamento('');
      setValorRecebidoParcial('');
    });
  };

  const iniciarEdicaoPagamento = (p) => {
    setPagamentoEditandoId(p.id);
    setValorEdicao(String(p.valor));
    setFormaEdicao(p.forma_pagamento);
  };

  const salvarEdicaoPagamento = () => {
    const v = Number(valorEdicao);
    if (!v || v <= 0) return;
    acao(async () => {
      await editarPagamentoParcialSalao(comandaId, pagamentoEditandoId, v, formaEdicao);
      setPagamentoEditandoId(null);
    });
  };

  const removerPagamento = (p) => {
    if (!window.confirm('Remover este pagamento parcial?')) return;
    acao(() => removerPagamentoParcialSalao(comandaId, p.id));
  };

  const transferirMesaOuComanda = () => {
    if (!mesaDestino) return;
    if (!window.confirm('Transferir esta comanda?')) return;
    acao(async () => {
      await transferirComandaSalao(comandaId, { mesa_id: Number(mesaDestino) });
      setMesaDestino('');
      onFechar();
    });
  };

  if (!comanda) return null;

  const podeEditar = comanda.status === 'aberta' || comanda.status === 'fechada_garcom';
  // Comanda já paga: só dá pra corrigir a forma de pagamento (ex: confirmou PIX por
  // engano, era dinheiro) — não reabre valor nem permite remover. Backend também bloqueia
  // se o caixa dessa comanda já tiver sido fechado (resumo já foi gravado e congelado).
  const podeCorrigirFormaPagamento = podeEditar || comanda.status === 'paga';
  const subtotal = (comanda.itens ?? []).reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const totalFinal = subtotal - Number(descontoInput || 0) + Number(acrescimoInput || 0);
  const valorACobrarFinalBase = parseFloat(((comanda.saldo?.saldo ?? totalFinal) + Number(gorjeta || 0)).toFixed(2));
  const taxaCartaoValorFinal = isCartao(forma) ? parseFloat((valorACobrarFinalBase * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const valorACobrarFinal = parseFloat((valorACobrarFinalBase + taxaCartaoValorFinal).toFixed(2));
  // Taxa de cartão de pagamentos parciais já registrados (ex: garçom cobrou parte no cartão
  // antes do fechamento) — soma no "Total (comanda + gorjeta)" e na impressão de conferência,
  // que antes só contavam a taxa da forma de pagamento selecionada agora pro fechamento.
  const taxaCartaoRegistrada = (comanda.pagamentos ?? []).reduce((acc, p) => acc + (p.taxa_cartao_valor || 0), 0);
  const taxaCartaoTotalExibida = taxaCartaoValorFinal + taxaCartaoRegistrada;
  const trocoFinal = forma === 'cash' && valorRecebidoFinal ? Number(valorRecebidoFinal) - valorACobrarFinal : null;
  const taxaCartaoValorParcial = isCartao(formaPagamentoParcial) ? parseFloat((Number(valorPagamento || 0) * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const trocoParcial = formaPagamentoParcial === 'cash' && valorRecebidoParcial ? Number(valorRecebidoParcial) - Number(valorPagamento || 0) : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4" onClick={onFechar}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-base font-bold text-[#18181B]">
              Comanda #{comanda.numero_comanda ?? comanda.id}{comanda.mesas ? ` — Mesa ${comanda.mesas.numero}` : ''}
            </h2>
            <p className="text-xs text-[#71717A]">{comanda.cliente_mesa_nome} · {comanda.cliente_mesa_telefone}</p>
            <p className="text-xs text-[#71717A]">
              {comanda.garcons?.nome ? `Garçom: ${comanda.garcons.nome}` : comanda.aberto_por_nome ? `Caixa: ${comanda.aberto_por_nome}` : 'Garçom: —'}
            </p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
            {comanda.status === 'aberta' ? 'Em aberto'
              : comanda.status === 'fechada_garcom' ? 'Aguardando pagamento'
              : comanda.status === 'paga' ? 'Paga'
              : comanda.status === 'canceled' ? 'Cancelada' : comanda.status}
          </span>
        </div>

        {comanda.status === 'fechada_garcom' && (
          <button onClick={reabrir} disabled={salvando}
            className="w-full mb-3 py-2 text-xs font-bold rounded-xl border border-[#FF441F] text-[#FF441F] hover:bg-[#FF441F]/5 disabled:opacity-50">
            Reabrir comanda (cliente vai continuar consumindo)
          </button>
        )}

        {comanda.status === 'paga' && (
          <button onClick={reimprimirRecibo} disabled={salvando}
            className="w-full mb-3 py-2.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#27272A] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40">
            <Icon name="Printer" size={16} /> Reimprimir recibo (comanda já paga)
          </button>
        )}

        {comanda.tracking_token && (
          <div className="mb-3">
            <button onClick={() => setMostrarQr((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold text-[#FF441F]">
              <Icon name="QrCode" size={14} /> {mostrarQr ? 'Esconder QR' : 'Mostrar QR pro cliente'}
            </button>
            {mostrarQr && (() => {
              const urls = getAcompanharUrls(comanda.tracking_token);
              const urlAtiva = qrModo === 'local' && urls.lan ? urls.lan : urls.principal;
              return (
                <div className="mt-2">
                  {urls.lan && (
                    <div className="flex gap-2 mb-2">
                      <button onClick={() => setQrModo('online')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${qrModo === 'online' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>
                        ONLINE
                      </button>
                      <button onClick={() => setQrModo('local')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${qrModo === 'local' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>
                        LOCAL
                      </button>
                    </div>
                  )}
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-3 inline-flex flex-col items-center gap-1">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlAtiva)}`}
                      alt="QR de acompanhamento" width={150} height={150}
                    />
                    <p className="text-[10px] text-[#71717A]">Cliente escaneia pra acompanhar o preparo</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {podeEditar && (
        <div className="flex items-center gap-2 mb-3">
          <select value={garcomSelecionado} onChange={(e) => setGarcomSelecionado(e.target.value)}
            className="flex-1 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs">
            <option value="">Transferir pra outro garçom...</option>
            {garcons.filter((g) => g.id !== comanda.garcom_id).map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
          <button onClick={transferir} disabled={!garcomSelecionado || salvando}
            className="text-xs font-bold text-[#FF441F] disabled:opacity-40 flex-shrink-0">Transferir</button>
        </div>
        )}

        {podeEditar && (
        <div className="flex items-center gap-2 mb-3">
          <select value={mesaDestino} onChange={(e) => setMesaDestino(e.target.value)}
            className="flex-1 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs">
            <option value="">Transferir mesa/comanda pra...</option>
            {(mesas ?? []).filter((m) => m.id !== comanda.mesa_id).map((m) => (
              <option key={m.id} value={m.id}>
                Mesa {m.numero}{m.comanda ? ` (ocupada — junta comandas)` : ''}
              </option>
            ))}
          </select>
          <button onClick={transferirMesaOuComanda} disabled={!mesaDestino || salvando}
            className="text-xs font-bold text-[#FF441F] disabled:opacity-40 flex-shrink-0">Transferir</button>
        </div>
        )}

        <div className="space-y-1 mb-3">
          {(comanda.itens ?? []).map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                  {item.products?.image_url
                    ? <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={14} className="text-[#A1A1AA]" /></div>}
                </div>
                <span className="truncate">{item.quantity}x {item.products?.name}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span>{fmt(item.quantity * item.unit_price)}</span>
                {['aberta', 'fechada_garcom'].includes(comanda.status) && (
                  <>
                    <button onClick={() => alterarQuantidadeItem(item, -1)} className="w-5 h-5 rounded-md border border-[#E4E4E7] text-xs font-bold text-[#27272A] flex items-center justify-center">−</button>
                    <button onClick={() => alterarQuantidadeItem(item, 1)} className="w-5 h-5 rounded-md border border-[#E4E4E7] text-xs font-bold text-[#27272A] flex items-center justify-center">+</button>
                    <button onClick={() => removerItem(item)} className="w-5 h-5 rounded-md border border-red-200 text-red-500 flex items-center justify-center">
                      <Icon name="X" size={11} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {comanda.status === 'aberta' && (
          <button onClick={() => setMostrarPicker(true)} disabled={salvando}
            className="w-full mb-3 py-2.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#27272A] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40">
            <Icon name="Plus" size={16} /> Incluir produto
          </button>
        )}

        <button onClick={imprimirConferencia} disabled={salvando}
          className="w-full mb-3 py-2.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#27272A] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40">
          <Icon name="Printer" size={16} /> Imprimir comanda (conferência)
        </button>

        {mostrarPicker && (
          <ProdutoPickerModal
            produtos={produtos}
            onFechar={() => setMostrarPicker(false)}
            onAdicionado={async (item) => { await incluirItem(item); setMostrarPicker(false); }}
          />
        )}

        <div className="border-t border-[#E4E4E7] pt-3 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {podeEditar && (
          <div className="flex justify-between items-center text-sm gap-2">
            <span>Desconto</span>
            <input type="number" value={descontoInput} onChange={(e) => setDescontoInput(e.target.value)}
              className="w-24 border border-[#E4E4E7] rounded-lg px-2 py-1 text-right text-sm" />
            <button onClick={() => acao(() => aplicarDescontoComanda(comandaId, Number(descontoInput || 0)))}
              className="text-xs text-[#FF441F] font-bold">Aplicar</button>
          </div>
          )}
          {podeEditar && (
          <div className="flex justify-between items-center text-sm gap-2">
            <span>Acréscimo</span>
            <input type="number" value={acrescimoInput} onChange={(e) => setAcrescimoInput(e.target.value)}
              className="w-24 border border-[#E4E4E7] rounded-lg px-2 py-1 text-right text-sm" />
            <button onClick={() => acao(() => aplicarAcrescimoComanda(comandaId, Number(acrescimoInput || 0)))}
              className="text-xs text-[#FF441F] font-bold">Aplicar</button>
          </div>
          )}
          <div className="flex justify-between text-base font-bold text-[#18181B]">
            <span>Total</span><span>{fmt(totalFinal)}</span>
          </div>
        </div>

        <div className="border-t border-[#E4E4E7] mt-3 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#71717A]">Saldo devedor</span>
            <strong className={(comanda.saldo?.saldo ?? 0) > 0.01 ? 'text-[#FF441F]' : 'text-emerald-600'}>
              {fmt(comanda.saldo?.saldo ?? totalFinal)}
            </strong>
          </div>
          {(comanda.pagamentos ?? []).length > 0 && (
            <div className="space-y-1">
              {comanda.pagamentos.map((p) => (
                pagamentoEditandoId === p.id ? (
                  <div key={p.id} className="flex items-center gap-1.5 bg-[#F4F4F5] rounded-lg p-1.5">
                    <input type="number" value={valorEdicao} onChange={(e) => setValorEdicao(e.target.value)}
                      disabled={comanda.status === 'paga'} title={comanda.status === 'paga' ? 'Comanda paga: só a forma de pagamento pode ser corrigida' : undefined}
                      className="w-16 border border-[#E4E4E7] rounded-lg px-1.5 py-1 text-xs disabled:opacity-50 disabled:bg-[#F4F4F5]" />
                    <select value={formaEdicao} onChange={(e) => setFormaEdicao(e.target.value)}
                      className="flex-1 border border-[#E4E4E7] rounded-lg px-1.5 py-1 text-xs">
                      <option value="pix">PIX</option>
                      <option value="credit_card">Cartão de crédito</option>
                      <option value="debit_card">Cartão de débito</option>
                      <option value="cash">Dinheiro</option>
                    </select>
                    <button onClick={salvarEdicaoPagamento} disabled={!valorEdicao || salvando}
                      className="text-xs font-bold text-emerald-700 disabled:opacity-40 flex-shrink-0">Salvar</button>
                    <button onClick={() => setPagamentoEditandoId(null)}
                      className="text-xs text-[#71717A] flex-shrink-0">Cancelar</button>
                  </div>
                ) : (
                  <div key={p.id} className="text-xs text-[#71717A] flex justify-between items-center gap-2">
                    <span>
                      {PAGAMENTO_LABEL[p.forma_pagamento] ?? p.forma_pagamento} ({p.origem === 'garcom' ? 'garçom' : 'caixa'})
                      {p.taxa_cartao_valor > 0 && <span className="text-[#FF441F]"> + taxa {fmt(p.taxa_cartao_valor)}</span>}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span>{fmt(p.valor + (p.taxa_cartao_valor || 0))}</span>
                      {podeCorrigirFormaPagamento && (
                        <button onClick={() => iniciarEdicaoPagamento(p)} title="Corrigir forma de pagamento"
                          className="w-6 h-6 rounded-md border border-zinc-300 bg-zinc-50 text-zinc-600 flex items-center justify-center hover:bg-zinc-100 flex-shrink-0">
                          <Icon name="Pencil" size={13} strokeWidth={2.5} />
                        </button>
                      )}
                      {podeEditar && (
                        <button onClick={() => removerPagamento(p)} className="w-6 h-6 rounded-md border border-red-200 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 flex-shrink-0">
                          <Icon name="X" size={14} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
          {podeEditar && (
          <div className="flex items-center gap-1.5">
            <input type="number" value={valorPagamento} onChange={(e) => setValorPagamento(e.target.value)} placeholder="Valor"
              className="w-20 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs" />
            <select value={formaPagamentoParcial} onChange={(e) => setFormaPagamentoParcial(e.target.value)}
              className="flex-1 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs">
              <option value="pix">PIX</option>
              <option value="credit_card">Cartão de crédito</option>
              <option value="debit_card">Cartão de débito</option>
              <option value="cash">Dinheiro</option>
            </select>
            <button onClick={registrarPagamento} disabled={!valorPagamento || salvando}
              className="px-2.5 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-bold disabled:opacity-40 flex-shrink-0">
              Pagar parcial
            </button>
          </div>
          )}
          {podeEditar && taxaCartaoValorParcial > 0 && (
            <p className="text-[11px] text-[#FF441F] font-medium">
              + taxa cartão ({taxaCartaoPercentual}%): {fmt(taxaCartaoValorParcial)} — cobrar {fmt(Number(valorPagamento || 0) + taxaCartaoValorParcial)}
            </p>
          )}
          {podeEditar && formaPagamentoParcial === 'cash' && (
            <div className="flex items-center gap-1.5">
              <input type="number" value={valorRecebidoParcial} onChange={(e) => setValorRecebidoParcial(e.target.value)}
                placeholder="Valor recebido do cliente"
                className="flex-1 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs" />
              {trocoParcial !== null && (
                <span className={`text-xs font-bold flex-shrink-0 ${trocoParcial < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  Troco: {fmt(Math.max(trocoParcial, 0))}
                </span>
              )}
            </div>
          )}
        </div>

        {podeEditar && (
        <div className="border-t border-[#E4E4E7] mt-3 pt-3 space-y-2">
          <label className="text-xs text-[#71717A]">Forma de pagamento</label>
          <select value={forma} onChange={(e) => { formaTocada.current = true; setForma(e.target.value); }} className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm">
            <option value="pix">PIX</option>
            <option value="credit_card">Cartão de crédito</option>
            <option value="debit_card">Cartão de débito</option>
            <option value="cash">Dinheiro</option>
          </select>
          <label className="text-xs text-[#71717A]">
            Gorjeta {gorjetaPercentual > 0 ? `(sugerida ${gorjetaPercentual}% — ajustável)` : '(opcional)'}
          </label>
          <input type="number" value={gorjeta} onChange={(e) => setGorjeta(e.target.value)}
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
          <div className="bg-[#FAFAFA] rounded-xl px-3 py-2 space-y-1 mt-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A]">Valor da comanda</span>
              <span className="text-[#18181B]">{fmt(totalFinal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A]">Gorjeta</span>
              <span className="text-[#18181B]">{fmt(Number(gorjeta || 0))}</span>
            </div>
            {taxaCartaoTotalExibida > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#71717A]">Taxa cartão</span>
                <span className="text-[#FF441F]">+ {fmt(taxaCartaoTotalExibida)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#18181B] pt-1 border-t border-[#E4E4E7]">
              <span>Total (comanda + gorjeta{taxaCartaoTotalExibida > 0 ? ' + taxa' : ''})</span>
              <span>{fmt(totalFinal + Number(gorjeta || 0) + taxaCartaoTotalExibida)}</span>
            </div>
            {(comanda.saldo?.total_pago ?? 0) > 0.01 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717A]">Já pago</span>
                  <span className="text-emerald-700">- {fmt(comanda.saldo.total_pago)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#FF441F] pt-1 border-t border-[#E4E4E7]">
                  <span>Falta pagar (com gorjeta{taxaCartaoTotalExibida > 0 ? ' + taxa' : ''})</span>
                  <span>{fmt(valorACobrarFinal)}</span>
                </div>
              </>
            )}
          </div>
          {forma === 'cash' && (
            <div className="flex items-center gap-1.5">
              <input type="number" value={valorRecebidoFinal} onChange={(e) => setValorRecebidoFinal(e.target.value)}
                placeholder="Valor recebido do cliente"
                className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
              {trocoFinal !== null && (
                <span className={`text-sm font-bold flex-shrink-0 ${trocoFinal < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  Troco: {fmt(Math.max(trocoFinal, 0))}
                </span>
              )}
            </div>
          )}
        </div>
        )}

        {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}

        {podeEditar && (
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
        )}
      </div>
    </div>
  );
};

// Venda balcão — comanda avulsa (sem mesa/cliente) com layout tipo PDV de mercado:
// catálogo de produtos de um lado, carrinho + pagamento do outro. Reaproveita os
// mesmos endpoints de comanda (itens, desconto/acréscimo, pagamento parcial,
// pagar) — o cliente pode dividir o pagamento em pix + dinheiro + cartão na mesma
// venda, cada parcela com sua própria taxa de cartão quando for o caso.
const VendaBalcaoModal = ({ comandaId, onFechar, onMudou }) => {
  const [comanda, setComanda] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [produtoAtivo, setProdutoAtivo] = useState(null);

  const [descontoInput, setDescontoInput] = useState('');
  const [acrescimoInput, setAcrescimoInput] = useState('');
  const [taxaCartaoPercentual, setTaxaCartaoPercentual] = useState(0);

  const [valorPagamento, setValorPagamento] = useState('');
  const [formaPagamentoParcial, setFormaPagamentoParcial] = useState('pix');
  const [valorRecebidoParcial, setValorRecebidoParcial] = useState('');

  const [forma, setForma] = useState('pix');
  const [valorRecebidoFinal, setValorRecebidoFinal] = useState('');

  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    const c = await getSalaoComandaDetalhe(comandaId);
    setComanda(c);
    setDescontoInput(String(c.desconto_valor ?? 0));
    setAcrescimoInput(String(c.acrescimo_valor ?? 0));
  }, [comandaId]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    getMeusProdutos().then((d) => setProdutos(d.produtos ?? [])).catch(() => {});
    getConfig().then((c) => setTaxaCartaoPercentual(c.taxa_cartao_percentual ?? 0)).catch(() => {});
  }, []);

  const isCartao = (f) => f === 'credit_card' || f === 'debit_card';

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

  const adicionar = (item) => acao(() => adicionarItensComandaSalao(comandaId, [item]));

  const alterarQuantidade = (item, delta) => {
    const novaQtd = item.quantity + delta;
    if (novaQtd < 1) {
      acao(() => removerItemComandaSalao(comandaId, item.id));
      return;
    }
    acao(() => editarItemComandaSalao(comandaId, item.id, { quantity: novaQtd }));
  };

  const removerItem = (item) => acao(() => removerItemComandaSalao(comandaId, item.id));

  const aplicarDesconto = () => acao(() => aplicarDescontoComanda(comandaId, Number(descontoInput || 0)));
  const aplicarAcrescimo = () => acao(() => aplicarAcrescimoComanda(comandaId, Number(acrescimoInput || 0)));

  const registrarPagamento = () => {
    const v = Number(valorPagamento);
    if (!v || v <= 0) return;
    if (formaPagamentoParcial === 'cash' && valorRecebidoParcial && Number(valorRecebidoParcial) < v) {
      setErro('Valor recebido não pode ser menor que o valor a pagar.');
      return;
    }
    acao(async () => {
      await registrarPagamentoParcialSalao(
        comandaId, v, formaPagamentoParcial,
        formaPagamentoParcial === 'cash' && valorRecebidoParcial ? Number(valorRecebidoParcial) : undefined,
      );
      setValorPagamento('');
      setValorRecebidoParcial('');
    });
  };

  const removerPagamento = (p) => {
    if (!window.confirm('Remover este pagamento?')) return;
    acao(() => removerPagamentoParcialSalao(comandaId, p.id));
  };

  const cancelar = () => {
    if (!window.confirm('Cancelar esta venda?')) return;
    acao(async () => { await cancelarComandaSalao(comandaId); onFechar(); });
  };

  const finalizar = () => {
    if (forma === 'cash' && valorRecebidoFinal && Number(valorRecebidoFinal) < valorACobrarFinal) {
      setErro('Valor recebido não pode ser menor que o valor a pagar.');
      return;
    }
    acao(async () => {
      const res = await pagarComandaSalao(
        comandaId, forma, undefined,
        forma === 'cash' && valorRecebidoFinal ? Number(valorRecebidoFinal) : undefined,
      );
      if (res?.recibo?.via !== 'agente') {
        printReciboCliente(comanda, comanda.itens ?? [], {
          subtotal,
          desconto: Number(descontoInput || 0),
          acrescimo: Number(acrescimoInput || 0),
          taxaCartao: res?.taxa_cartao_valor ?? 0,
          total: res?.valor_cobrado ?? res?.total ?? valorACobrarFinal,
          formaPagamento: forma,
          trocoDado: res?.troco ?? 0,
          pagamentos: res?.pagamentos ?? [],
        });
      }
      onFechar();
    });
  };

  if (!comanda) return null;

  const subtotal = (comanda.itens ?? []).reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const totalFinal = subtotal - Number(descontoInput || 0) + Number(acrescimoInput || 0);
  const saldo = comanda.saldo?.saldo ?? totalFinal;
  const taxaCartaoValorFinal = isCartao(forma) ? parseFloat((saldo * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const valorACobrarFinal = parseFloat((saldo + taxaCartaoValorFinal).toFixed(2));
  const trocoFinal = forma === 'cash' && valorRecebidoFinal ? Number(valorRecebidoFinal) - valorACobrarFinal : null;
  const taxaCartaoValorParcial = isCartao(formaPagamentoParcial) ? parseFloat((Number(valorPagamento || 0) * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const trocoParcial = formaPagamentoParcial === 'cash' && valorRecebidoParcial ? Number(valorRecebidoParcial) - Number(valorPagamento || 0) : null;

  const categorias = ['todas', ...new Set(produtos.map((p) => p.category_name ?? 'Outros'))];
  const produtosFiltrados = produtos.filter((p) => {
    const bateBusca = p.name.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = categoria === 'todas' || (p.category_name ?? 'Outros') === categoria;
    return bateBusca && bateCategoria;
  });

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7] flex-shrink-0">
        <h2 className="text-base font-bold text-[#18181B]">Venda balcão</h2>
        <button onClick={onFechar} className="p-1 text-[#71717A]"><Icon name="X" size={22} /></button>
      </div>

      <div className="flex-1 flex overflow-hidden flex-col sm:flex-row">
        {/* Catálogo — busca + categorias + grade de produtos, igual PDV de mercado */}
        <div className="flex-1 flex flex-col overflow-hidden border-b sm:border-b-0 sm:border-r border-[#E4E4E7] min-h-[45%] sm:min-h-0">
          <div className="p-3 border-b border-[#E4E4E7] flex-shrink-0">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..."
                className="w-full border border-[#E4E4E7] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
            </div>
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {categorias.map((c) => (
                <button key={c} onClick={() => setCategoria(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                    categoria === c ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'
                  }`}>
                  {c === 'todas' ? 'Todas' : c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 content-start">
            {produtosFiltrados.map((p) => (
              <button key={p.id} onClick={() => setProdutoAtivo(p)} disabled={salvando}
                className="bg-white border border-[#E4E4E7] rounded-xl p-2 text-left active:scale-[0.98] transition-transform disabled:opacity-50">
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#F4F4F5] mb-1.5">
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={18} className="text-[#A1A1AA]" /></div>}
                </div>
                <p className="text-xs font-semibold text-[#18181B] truncate">{p.name}</p>
                <p className="text-xs text-[#71717A]">{fmt(p.price)}</p>
              </button>
            ))}
            {produtosFiltrados.length === 0 && <p className="col-span-full text-sm text-[#A1A1AA] text-center py-6">Nenhum produto encontrado.</p>}
          </div>
        </div>

        {/* Carrinho + pagamento */}
        <div className="w-full sm:max-w-md lg:max-w-lg flex flex-col overflow-y-auto p-4 flex-shrink-0">
          <p className="text-xs font-semibold text-[#71717A] mb-2">Itens incluídos</p>
          <div className="space-y-1 mb-3">
            {(comanda.itens ?? []).map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm gap-2">
                <span className="truncate min-w-0">{item.quantity}x {item.products?.name}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span>{fmt(item.quantity * item.unit_price)}</span>
                  <button onClick={() => alterarQuantidade(item, -1)} disabled={salvando} className="w-5 h-5 rounded-md border border-[#E4E4E7] text-xs font-bold text-[#27272A] flex items-center justify-center disabled:opacity-40">−</button>
                  <button onClick={() => alterarQuantidade(item, 1)} disabled={salvando} className="w-5 h-5 rounded-md border border-[#E4E4E7] text-xs font-bold text-[#27272A] flex items-center justify-center disabled:opacity-40">+</button>
                  <button onClick={() => removerItem(item)} disabled={salvando} className="w-5 h-5 rounded-md border border-red-200 text-red-500 flex items-center justify-center disabled:opacity-40">
                    <Icon name="X" size={11} />
                  </button>
                </div>
              </div>
            ))}
            {(comanda.itens ?? []).length === 0 && <p className="text-xs text-[#A1A1AA] text-center py-3">Carrinho vazio — clique num produto ao lado.</p>}
          </div>

          <div className="border-t border-[#E4E4E7] pt-3 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between items-center text-sm gap-2">
              <span>Desconto</span>
              <input type="number" value={descontoInput} onChange={(e) => setDescontoInput(e.target.value)}
                className="w-20 border border-[#E4E4E7] rounded-lg px-2 py-1 text-right text-sm" />
              <button onClick={aplicarDesconto} className="text-xs text-[#FF441F] font-bold flex-shrink-0">Aplicar</button>
            </div>
            <div className="flex justify-between items-center text-sm gap-2">
              <span>Acréscimo</span>
              <input type="number" value={acrescimoInput} onChange={(e) => setAcrescimoInput(e.target.value)}
                className="w-20 border border-[#E4E4E7] rounded-lg px-2 py-1 text-right text-sm" />
              <button onClick={aplicarAcrescimo} className="text-xs text-[#FF441F] font-bold flex-shrink-0">Aplicar</button>
            </div>
            <div className="flex justify-between text-base font-bold text-[#18181B]">
              <span>Total</span><span>{fmt(totalFinal)}</span>
            </div>
          </div>

          <div className="border-t border-[#E4E4E7] mt-3 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A]">Saldo devedor</span>
              <strong className={saldo > 0.01 ? 'text-[#FF441F]' : 'text-emerald-600'}>{fmt(saldo)}</strong>
            </div>
            {(comanda.pagamentos ?? []).length > 0 && (
              <div className="space-y-1">
                {comanda.pagamentos.map((p) => (
                  <div key={p.id} className="text-xs text-[#71717A] flex justify-between items-center gap-2">
                    <span>
                      {PAGAMENTO_LABEL[p.forma_pagamento] ?? p.forma_pagamento}
                      {p.taxa_cartao_valor > 0 && <span className="text-[#FF441F]"> + taxa {fmt(p.taxa_cartao_valor)}</span>}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span>{fmt(p.valor + (p.taxa_cartao_valor || 0))}</span>
                      <button onClick={() => removerPagamento(p)} className="w-5 h-5 rounded-md border border-red-200 bg-red-50 text-red-500 flex items-center justify-center">
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input type="number" value={valorPagamento} onChange={(e) => setValorPagamento(e.target.value)} placeholder="Valor"
                className="w-20 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs" />
              <select value={formaPagamentoParcial} onChange={(e) => setFormaPagamentoParcial(e.target.value)}
                className="flex-1 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs">
                <option value="pix">PIX</option>
                <option value="credit_card">Cartão de crédito</option>
                <option value="debit_card">Cartão de débito</option>
                <option value="cash">Dinheiro</option>
              </select>
              <button onClick={registrarPagamento} disabled={!valorPagamento || salvando}
                className="px-2.5 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-bold disabled:opacity-40 flex-shrink-0">
                Adicionar pagamento
              </button>
            </div>
            {taxaCartaoValorParcial > 0 && (
              <p className="text-[11px] text-[#FF441F] font-medium">
                + taxa cartão ({taxaCartaoPercentual}%): {fmt(taxaCartaoValorParcial)} — cobrar {fmt(Number(valorPagamento || 0) + taxaCartaoValorParcial)}
              </p>
            )}
            {formaPagamentoParcial === 'cash' && (
              <div className="flex items-center gap-1.5">
                <input type="number" value={valorRecebidoParcial} onChange={(e) => setValorRecebidoParcial(e.target.value)}
                  placeholder="Valor recebido do cliente"
                  className="flex-1 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs" />
                {trocoParcial !== null && (
                  <span className={`text-xs font-bold flex-shrink-0 ${trocoParcial < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    Troco: {fmt(Math.max(trocoParcial, 0))}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-[#E4E4E7] mt-3 pt-3 space-y-2">
            <label className="text-xs text-[#71717A]">Forma de pagamento (fechamento)</label>
            <select value={forma} onChange={(e) => setForma(e.target.value)} className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm">
              <option value="pix">PIX</option>
              <option value="credit_card">Cartão de crédito</option>
              <option value="debit_card">Cartão de débito</option>
              <option value="cash">Dinheiro</option>
            </select>
            {taxaCartaoValorFinal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#71717A]">Taxa cartão ({taxaCartaoPercentual}%)</span>
                <span className="text-[#FF441F]">+ {fmt(taxaCartaoValorFinal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#18181B]">
              <span>Falta pagar</span><span>{fmt(valorACobrarFinal)}</span>
            </div>
            {forma === 'cash' && (
              <div className="flex items-center gap-1.5">
                <input type="number" value={valorRecebidoFinal} onChange={(e) => setValorRecebidoFinal(e.target.value)}
                  placeholder="Valor recebido do cliente"
                  className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
                {trocoFinal !== null && (
                  <span className={`text-sm font-bold flex-shrink-0 ${trocoFinal < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    Troco: {fmt(Math.max(trocoFinal, 0))}
                  </span>
                )}
              </div>
            )}
          </div>

          {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}

          <div className="flex gap-2 mt-4">
            <button onClick={cancelar} disabled={salvando}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
              Cancelar venda
            </button>
            <button onClick={finalizar} disabled={salvando || (comanda.itens ?? []).length === 0}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
              {salvando ? 'Processando...' : 'Finalizar venda'}
            </button>
          </div>
        </div>
      </div>

      {produtoAtivo && (
        <QuickAddProdutoModal
          produto={produtoAtivo}
          onFechar={() => setProdutoAtivo(null)}
          onConfirmar={async (item) => { await adicionar(item); setProdutoAtivo(null); }}
        />
      )}
    </div>
  );
};

const RestauranteSalao = () => {
  const [garconsOnline, setGarconsOnline] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [comandasFechadas, setComandasFechadas] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [filtroValorMin, setFiltroValorMin] = useState('');
  const [comandaAtiva, setComandaAtiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendaBalcaoId, setVendaBalcaoId] = useState(null);
  const [mesaParaAbrir, setMesaParaAbrir] = useState(undefined);
  const [erro, setErro] = useState(null);
  const [avisoConferencia, setAvisoConferencia] = useState(null);

  const tocarAlarmeConferencia = useNotificacaoSonora('pedido');
  const idsConferenciaVistos = useRef(new Set());

  const carregar = useCallback(async () => {
    const [g, m, c, cf] = await Promise.all([
      getGarconsOnline(), getSalaoMesas(), getSalaoComandas(), getSalaoComandasFechadasHoje(),
    ]);
    setGarconsOnline(g);
    setMesas(m);
    setComandas(c);
    setComandasFechadas(cf);
    setLoading(false);

    // Cliente solicitou conferência via QR (mesa-acompanhar) — avisa o caixa aqui,
    // uma vez por comanda, até o próprio caixa atender (imprimirConferencia limpa o campo).
    const solicitadas = m.filter((mesa) => mesa.comanda?.conferencia_solicitada_em);
    const novas = solicitadas.filter((mesa) => !idsConferenciaVistos.current.has(mesa.comanda.id));
    idsConferenciaVistos.current = new Set(solicitadas.map((mesa) => mesa.comanda.id));
    if (novas.length > 0) {
      tocarAlarmeConferencia();
      setAvisoConferencia(`Mesa ${novas[0].numero} pediu conferência!`);
      setTimeout(() => setAvisoConferencia(null), 8000);
    }
  }, [tocarAlarmeConferencia]);

  const acaoMesa = async (fn) => {
    setErro(null);
    try {
      await fn();
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 20000);
    return () => clearInterval(interval);
  }, [carregar]);

  const passaNoFiltro = (c) => {
    if (filtroNome && !c.cliente_mesa_nome?.toLowerCase().includes(filtroNome.toLowerCase())) return false;
    if (filtroValorMin && (c.total ?? 0) < parseFloat(filtroValorMin)) return false;
    if (filtroData) {
      const dataRef = c.pago_em ?? c.created_at;
      if (new Date(dataRef).toISOString().slice(0, 10) !== filtroData) return false;
    }
    return true;
  };

  const comandasFiltradas = useMemo(() => comandas.filter(passaNoFiltro), [comandas, filtroNome, filtroData, filtroValorMin]);
  const comandasFechadasFiltradas = useMemo(() => comandasFechadas.filter(passaNoFiltro), [comandasFechadas, filtroNome, filtroData, filtroValorMin]);
  const filtroAtivo = !!(filtroNome || filtroData || filtroValorMin);

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      {avisoConferencia && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-white border border-[#FF441F]/30 text-[#FF441F] text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
          <Icon name="BellRing" size={14} /> {avisoConferencia}
        </div>
      )}
      <RestauranteHeader active="/restaurante/salao" title="Salão" />

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-end mb-4">
          <button onClick={() => acaoMesa(async () => { const c = await abrirVendaBalcao(); setVendaBalcaoId(c.id); })}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
            <Icon name="ShoppingCart" size={15} /> Venda balcão
          </button>
        </div>

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
                <div key={m.id} className={`rounded-xl border p-3 text-center ${MESA_STATUS_COR[m.status] ?? ''}`}>
                  <button
                    onClick={() => { if (m.comanda) setComandaAtiva(m.comanda.id); else if (m.status === 'livre') setMesaParaAbrir(m); }}
                    disabled={!m.comanda && m.status !== 'livre'}
                    className="w-full disabled:opacity-70"
                  >
                    <p className="text-lg font-black">{m.numero}</p>
                    <p className="text-[10px] font-medium">{MESA_STATUS_LABEL[m.status] ?? m.status}</p>
                    {m.comanda && (
                      <>
                        <p className="text-[10px] font-medium">#{m.comanda.numero_comanda ?? m.comanda.id} · {fmt(m.comanda.total)}</p>
                        <p className="text-[10px] truncate">{m.comanda.cliente_mesa_nome}</p>
                        <p className="text-[10px] text-[#71717A] truncate">
                          {m.comanda.garcons?.nome ?? (m.comanda.aberto_por_nome ? `Caixa: ${m.comanda.aberto_por_nome}` : '—')}
                        </p>
                        {m.comanda.conferencia_solicitada_em && (
                          <p className="text-[9px] font-bold text-white bg-[#FF441F] rounded-full px-1.5 py-0.5 mt-1 inline-flex items-center gap-1">
                            <Icon name="BellRing" size={9} /> Pediu conferência
                          </p>
                        )}
                      </>
                    )}
                  </button>
                  {(m.status === 'livre' || m.status === 'bloqueada') && (
                    <button
                      onClick={() => acaoMesa(() => (m.status === 'livre' ? bloquearMesaSalao(m.id) : desbloquearMesaSalao(m.id)))}
                      className="mt-1 text-[9px] font-bold underline opacity-70 hover:opacity-100">
                      {m.status === 'livre' ? 'Bloquear' : 'Desbloquear'}
                    </button>
                  )}
                </div>
              ))}
              {mesas.length === 0 && <p className="col-span-full text-sm text-[#A1A1AA]">Nenhuma mesa cadastrada.</p>}
            </div>

            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="text-sm font-bold text-[#18181B]">Comandas em aberto</p>
              <div className="flex gap-2 flex-wrap">
                <input value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} placeholder="Nome do cliente"
                  className="w-32 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#FF441F]" />
                <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)}
                  className="border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#FF441F]" />
                <input type="number" min="0" value={filtroValorMin} onChange={(e) => setFiltroValorMin(e.target.value)} placeholder="Valor mín."
                  className="w-24 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#FF441F]" />
                {filtroAtivo && (
                  <button onClick={() => { setFiltroNome(''); setFiltroData(''); setFiltroValorMin(''); }}
                    className="text-xs text-[#FF441F] font-semibold px-1">Limpar</button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {comandasFiltradas.map((c) => (
                <button key={c.id} onClick={() => setComandaAtiva(c.id)}
                  className="w-full bg-white rounded-xl border border-[#E4E4E7] p-3 flex justify-between items-center text-left">
                  <div>
                    <p className="text-sm font-medium text-[#18181B]">
                      #{c.numero_comanda ?? c.id}{c.mesas ? ` — Mesa ${c.mesas.numero}` : ''} — {c.cliente_mesa_nome}
                    </p>
                    <p className="text-xs text-[#71717A]">
                      {c.garcons?.nome ? `Garçom: ${c.garcons.nome}` : c.aberto_por_nome ? `Caixa: ${c.aberto_por_nome}` : 'Garçom: —'}
                      {' · '}{c.status === 'aberta' ? 'Em aberto' : 'Aguardando pagamento'}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#18181B]">{fmt(c.total)}</p>
                </button>
              ))}
              {comandasFiltradas.length === 0 && (
                <p className="text-sm text-[#A1A1AA]">{filtroAtivo ? 'Nenhuma comanda encontrada com esse filtro.' : 'Nenhuma comanda em aberto.'}</p>
              )}
            </div>

            {comandasFechadas.length > 0 && (
              <>
                <p className="text-sm font-bold text-[#18181B] mb-2 mt-6">Comandas fechadas hoje</p>
                <div className="space-y-2">
                  {comandasFechadasFiltradas.map((c) => (
                    <button key={c.id} onClick={() => setComandaAtiva(c.id)}
                      className="w-full bg-white rounded-xl border border-[#E4E4E7] p-3 flex justify-between items-center text-left opacity-80">
                      <div>
                        <p className="text-sm font-medium text-[#18181B]">
                          #{c.numero_comanda ?? c.id}{c.mesas ? ` — Mesa ${c.mesas.numero}` : ''} — {c.cliente_mesa_nome}
                        </p>
                        <p className="text-xs text-[#71717A]">
                          {c.garcons?.nome ? `Garçom: ${c.garcons.nome}` : c.aberto_por_nome ? `Caixa: ${c.aberto_por_nome}` : 'Garçom: —'}
                          {' · '}Paga
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#18181B]">{fmt(c.total)}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {erro && <p className="text-xs text-red-600 mt-3">{erro}</p>}
      </div>

      <button
        onClick={() => setMesaParaAbrir(null)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-zinc-800 text-white shadow-lg flex items-center justify-center"
        title="Abrir comanda avulsa"
      >
        <Icon name="Plus" size={24} />
      </button>

      {comandaAtiva && (
        <ComandaModal comandaId={comandaAtiva} mesas={mesas} onFechar={() => setComandaAtiva(null)} onMudou={carregar} />
      )}

      {vendaBalcaoId && (
        <VendaBalcaoModal
          comandaId={vendaBalcaoId}
          onFechar={() => { setVendaBalcaoId(null); carregar(); }}
          onMudou={carregar}
        />
      )}

      {mesaParaAbrir !== undefined && (
        <AbrirComandaModal
          mesa={mesaParaAbrir}
          onFechar={() => setMesaParaAbrir(undefined)}
          onAberta={(comanda) => { setMesaParaAbrir(undefined); setComandaAtiva(comanda.id); carregar(); }}
        />
      )}
    </div>
  );
};

export default RestauranteSalao;
