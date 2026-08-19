import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSalaoComandaDetalhe, getMeusProdutos, getMeusCombos, abrirVendaBalcao,
  adicionarItensComandaSalao, editarItemComandaSalao, removerItemComandaSalao,
  aplicarDescontoComanda, aplicarAcrescimoComanda, cancelarComandaSalao, pagarComandaSalao,
  registrarPagamentoParcialSalao, alterarTrocoPixComandaSalao, removerPagamentoParcialSalao,
  editarClienteComandaSalao, getConfig,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import { printReciboCliente } from '../../utils/printComanda';
import { agruparItensComanda, quantidadeGrupoCombo } from '../../utils/agruparItensComanda';
import QuickAddProdutoModal from '../../components/restaurante/QuickAddProdutoModal';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };

// Venda balcão — comanda avulsa (sem mesa/cliente) com layout tipo PDV de mercado:
// catálogo de produtos de um lado, carrinho + pagamento do outro. Reaproveita os
// mesmos endpoints de comanda (itens, desconto/acréscimo, pagamento parcial,
// pagar) — o cliente pode dividir o pagamento em pix + dinheiro + cartão na mesma
// venda, cada parcela com sua própria taxa de cartão quando for o caso.
// Antes vivia como botão+modal dentro de /restaurante/salao — agora é rota própria
// no menu lateral (fora do módulo Salão), pedido do usuário.
const RestauranteVendaBalcao = () => {
  const navigate = useNavigate();
  const [comandaId, setComandaId] = useState(null);
  const [erroAbertura, setErroAbertura] = useState(null);
  const [comanda, setComanda] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [produtoAtivo, setProdutoAtivo] = useState(null);

  const [descontoInput, setDescontoInput] = useState('');
  const [acrescimoInput, setAcrescimoInput] = useState('');
  const [taxaCartaoPercentual, setTaxaCartaoPercentual] = useState(0);
  const [nomeCliente, setNomeCliente] = useState('');

  const [valorPagamento, setValorPagamento] = useState('');
  const [formaPagamentoParcial, setFormaPagamentoParcial] = useState('pix');
  const [valorRecebidoParcial, setValorRecebidoParcial] = useState('');
  const [trocoViaPixParcial, setTrocoViaPixParcial] = useState(false);

  const [forma, setForma] = useState('pix');
  const [valorRecebidoFinal, setValorRecebidoFinal] = useState('');
  const emAndamentoRef = useRef(false);

  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Venda balcão não pode virar comanda "fantasma" aberta pra sempre se o operador
  // sair sem finalizar — finalizadaRef marca quando a comanda já chegou num estado
  // terminal tratado explicitamente (paga ou cancelada). comandaIdRef existe porque
  // o cleanup do efeito de desmontagem roda numa closure antiga e precisa do valor
  // mais recente do id (setado de forma assíncrona depois que a página abre).
  const finalizadaRef = useRef(false);
  const comandaIdRef = useRef(null);

  // Cada visita a essa página abre uma venda balcão nova — mesmo comportamento do
  // botão que existia antes dentro de Salão.
  useEffect(() => {
    abrirVendaBalcao().then((c) => setComandaId(c.id)).catch((err) => setErroAbertura(err.message));
  }, []);

  useEffect(() => { comandaIdRef.current = comandaId; }, [comandaId]);

  // Rede de segurança pra saídas que não passam pelos botões (ex: voltar do
  // navegador) — cancela a comanda ainda aberta ao desmontar, sem isso ela nunca
  // mais aparece nessa tela mas continua "aberta" pro resto do sistema. Sem await:
  // o componente já está indo embora, se falhar não tem UI pra mostrar o erro.
  useEffect(() => {
    return () => {
      if (comandaIdRef.current && !finalizadaRef.current) {
        cancelarComandaSalao(comandaIdRef.current).catch(() => {});
      }
    };
  }, []);

  const carregar = useCallback(async () => {
    if (!comandaId) return;
    const [c, produtosResp, combosResp] = await Promise.all([
      getSalaoComandaDetalhe(comandaId),
      getMeusProdutos(),
      getMeusCombos(),
    ]);
    setComanda(c);
    setDescontoInput(String(c.desconto_valor ?? 0));
    setAcrescimoInput(String(c.acrescimo_valor ?? 0));
    setNomeCliente((atual) => (atual ? atual : (c.cliente_mesa_nome === 'Venda balcão' ? '' : (c.cliente_mesa_nome ?? ''))));
    // Refaz a lista de produtos toda vez que a comanda recarrega — senão a quantidade
    // em estoque mostrada no picker fica desatualizada depois de incluir/editar item.
    setProdutos([
      ...(produtosResp.produtos ?? []),
      ...(combosResp.combos ?? []).filter((c2) => c2.disponivel).map((c2) => ({ ...c2, tipo: 'combo', category_name: 'Combos' })),
    ]);
  }, [comandaId]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    getConfig().then((c) => setTaxaCartaoPercentual(c.taxa_cartao_percentual ?? 0)).catch(() => {});
  }, []);

  const isCartao = (f) => f === 'credit_card' || f === 'debit_card';

  const acao = async (fn) => {
    // Guard síncrono (ref, não state) — clique duplo muito rápido pode disparar 2x
    // antes do `disabled={salvando}` re-renderizar, duplicando lançamento financeiro
    // (foi o caso real: 2 entradas de dinheiro idênticas pra mesma comanda).
    if (emAndamentoRef.current) return;
    emAndamentoRef.current = true;
    setErro(null);
    setSalvando(true);
    try {
      await fn();
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      emAndamentoRef.current = false;
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

  const salvarNomeCliente = () => acao(() => editarClienteComandaSalao(comandaId, nomeCliente.trim() || 'Venda balcão'));

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
        // Sem valor recebido digitado, manda o próprio valor pago — senão não credita
        // a venda em dinheiro no caixa físico.
        formaPagamentoParcial === 'cash' ? Number(valorRecebidoParcial || v) : undefined,
        formaPagamentoParcial === 'cash' && trocoParcial > 0 ? trocoViaPixParcial : undefined,
      );
      setValorPagamento('');
      setValorRecebidoParcial('');
      setTrocoViaPixParcial(false);
    });
  };

  const alterarTrocoPix = (p) => {
    acao(() => alterarTrocoPixComandaSalao(comandaId, p.id, !p.troco_via_pix));
  };

  const removerPagamento = (p) => {
    if (!window.confirm('Remover este pagamento?')) return;
    acao(() => removerPagamentoParcialSalao(comandaId, p.id));
  };

  const cancelar = () => {
    // Nada a perder (carrinho vazio, sem pagamento lançado) não precisa confirmar —
    // só incomoda quando o operador abriu por engano e já quer sair.
    const temAlgo = (comanda?.itens ?? []).length > 0 || (comanda?.pagamentos ?? []).length > 0;
    if (temAlgo && !window.confirm('Cancelar esta venda? Os itens/pagamentos lançados serão descartados.')) return;
    acao(async () => {
      await cancelarComandaSalao(comandaId);
      finalizadaRef.current = true;
      navigate('/restaurante/salao');
    });
  };

  const finalizar = () => {
    if (forma === 'cash' && valorRecebidoFinal && Number(valorRecebidoFinal) < valorACobrarFinal) {
      setErro('Valor recebido não pode ser menor que o valor a pagar.');
      return;
    }
    acao(async () => {
      const res = await pagarComandaSalao(
        comandaId, forma, undefined,
        // Idem: sem isso, pagamento em dinheiro exato (sem digitar valor recebido) nunca
        // credita a venda no caixa físico.
        forma === 'cash' ? Number(valorRecebidoFinal || valorACobrarFinal) : undefined,
      );
      if (res?.recibo?.via !== 'agente') {
        printReciboCliente(comanda, comanda.itens ?? [], {
          subtotal,
          desconto: Number(descontoInput || 0),
          acrescimo: Number(acrescimoInput || 0),
          taxaCartao: res?.taxa_cartao_valor ?? 0,
          total: res?.total_geral ?? (totalFinal + taxaCartaoValorFinal),
          formaPagamento: forma,
          trocoDado: res?.troco ?? 0,
          pagamentos: res?.pagamentos ?? [],
        });
      }
      finalizadaRef.current = true;
      navigate('/restaurante/salao');
    });
  };

  if (erroAbertura) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-6 max-w-sm w-full text-center">
          <Icon name="AlertCircle" size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-sm text-[#18181B] dark:text-[#F4F4F5] font-semibold mb-1">Não foi possível abrir a venda balcão</p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-4">{erroAbertura}</p>
          <button onClick={() => navigate('/restaurante')} className="w-full py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19]">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!comanda) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const subtotal = (comanda.itens ?? []).reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const totalFinal = subtotal - Number(descontoInput || 0) + Number(acrescimoInput || 0);
  const saldo = comanda.saldo?.saldo ?? totalFinal;
  const taxaCartaoValorFinal = isCartao(forma) ? parseFloat((saldo * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const valorACobrarFinal = parseFloat((saldo + taxaCartaoValorFinal).toFixed(2));
  const trocoFinal = forma === 'cash' && valorRecebidoFinal ? Number(valorRecebidoFinal) - valorACobrarFinal : null;
  const taxaCartaoValorParcial = isCartao(formaPagamentoParcial) ? parseFloat((Number(valorPagamento || 0) * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const trocoParcial = formaPagamentoParcial === 'cash' && valorRecebidoParcial ? Number(valorRecebidoParcial) - Number(valorPagamento || 0) : null;

  // Combo não tem quantidade_estoque (não é o mesmo controle dos produtos avulsos) —
  // o filtro de estoque zerado só vale pra produto normal.
  const vendaveis = produtos.filter((p) => p.tipo === 'combo' || (p.quantidade_estoque ?? 0) > 0);
  const categorias = ['todas', ...new Set(vendaveis.map((p) => p.category_name ?? 'Outros'))];
  const produtosFiltrados = vendaveis.filter((p) => {
    const bateBusca = p.name.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = categoria === 'todas' || (p.category_name ?? 'Outros') === categoria;
    return bateBusca && bateCategoria;
  });

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#27272A] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7] dark:border-[#3F3F46] flex-shrink-0">
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Venda balcão</h2>
        <button onClick={cancelar} disabled={salvando} className="p-1 text-[#71717A] dark:text-[#A1A1AA] disabled:opacity-50"><Icon name="X" size={22} /></button>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E4E4E7] dark:border-[#3F3F46] flex-shrink-0">
        <Icon name="User" size={15} className="text-[#A1A1AA] flex-shrink-0" />
        <input
          value={nomeCliente}
          onChange={(e) => setNomeCliente(e.target.value)}
          onBlur={salvarNomeCliente}
          placeholder="Nome do cliente (opcional)"
          disabled={salvando}
          className="flex-1 min-w-0 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#FF441F] disabled:opacity-50"
        />
      </div>

      <div className="flex-1 flex overflow-hidden flex-col sm:flex-row">
        {/* Catálogo — busca + categorias + grade de produtos, igual PDV de mercado */}
        <div className="flex flex-col overflow-hidden border-b sm:border-b-0 sm:border-r border-[#E4E4E7] dark:border-[#3F3F46] h-[42%] sm:h-auto sm:flex-1 sm:min-h-0">
          <div className="p-3 border-b border-[#E4E4E7] dark:border-[#3F3F46] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..."
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
              </div>
              {categorias.includes('Combos') && (
                <button type="button" onClick={() => setCategoria((c) => (c === 'Combos' ? 'todas' : 'Combos'))}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex-shrink-0 ${
                    categoria === 'Combos' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#18181B] dark:text-[#F4F4F5]'
                  }`}>
                  <Icon name="Package" size={15} /> Combos
                </button>
              )}
            </div>
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {categorias.map((c) => (
                <button key={c} onClick={() => setCategoria(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                    categoria === c ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'
                  }`}>
                  {c === 'todas' ? 'Todas' : c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 content-start">
            {produtosFiltrados.map((p) => (
              <button key={`${p.tipo ?? 'produto'}-${p.id}`} onClick={() => setProdutoAtivo(p)} disabled={salvando}
                className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-2 text-left active:scale-[0.98] transition-transform disabled:opacity-50">
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#F4F4F5] dark:bg-[#3F3F46] mb-1.5">
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Icon name={p.tipo === 'combo' ? 'Package' : 'UtensilsCrossed'} size={18} className="text-[#A1A1AA]" /></div>}
                </div>
                <p className="text-xs font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">
                  {p.tipo === 'combo' && <span className="text-[9px] font-bold text-[#FF441F] mr-1">COMBO</span>}
                  {p.name}
                </p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {p.preco_promo != null && <span className="line-through text-[#A1A1AA] mr-1">{fmt(p.price)}</span>}
                  {fmt(p.preco_promo ?? p.price)}
                </p>
                {p.quantidade_estoque != null && (
                  <p className="text-[10px] text-[#A1A1AA]">estoque: {p.quantidade_estoque}</p>
                )}
              </button>
            ))}
            {produtosFiltrados.length === 0 && <p className="col-span-full text-sm text-[#A1A1AA] text-center py-6">Nenhum produto encontrado.</p>}
          </div>
        </div>

        {/* Carrinho + pagamento */}
        <div className="w-full sm:max-w-md lg:max-w-lg flex flex-col overflow-y-auto p-4 flex-1 min-h-0 sm:flex-none">
          <p className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-2">Itens incluídos</p>
          <div className="space-y-1 mb-3">
            {agruparItensComanda(comanda.itens).map((grupo, gi) => grupo.tipo === 'combo' ? (
              <div key={`combo-${grupo.nome}-${gi}`} className="rounded-lg border border-[#FF441F]/30 dark:border-[#FF441F]/40 overflow-hidden mb-1">
                <div className="bg-[#FF441F]/10 px-2 py-1 flex items-center gap-1.5">
                  <Icon name="Package" size={12} className="text-[#FF441F]" />
                  <span className="text-[11px] font-bold text-[#FF441F]">{quantidadeGrupoCombo(grupo)}x {grupo.nome}</span>
                </div>
                <div className="p-1.5 space-y-1">
                  {grupo.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm gap-2">
                      <span className="truncate min-w-0">{item.quantity}x {item.products?.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span>{fmt(item.quantity * item.unit_price)}</span>
                        <button onClick={() => alterarQuantidade(item, -1)} disabled={salvando} className="w-5 h-5 rounded-md border border-[#E4E4E7] dark:border-[#3F3F46] text-xs font-bold text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center disabled:opacity-40">−</button>
                        <button onClick={() => alterarQuantidade(item, 1)} disabled={salvando} className="w-5 h-5 rounded-md border border-[#E4E4E7] dark:border-[#3F3F46] text-xs font-bold text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center disabled:opacity-40">+</button>
                        <button onClick={() => removerItem(item)} disabled={salvando} className="w-5 h-5 rounded-md border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 flex items-center justify-center disabled:opacity-40">
                          <Icon name="X" size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div key={grupo.item.id} className="flex justify-between items-center text-sm gap-2">
                <span className="truncate min-w-0">{grupo.item.quantity}x {grupo.item.products?.name}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span>{fmt(grupo.item.quantity * grupo.item.unit_price)}</span>
                  <button onClick={() => alterarQuantidade(grupo.item, -1)} disabled={salvando} className="w-5 h-5 rounded-md border border-[#E4E4E7] dark:border-[#3F3F46] text-xs font-bold text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center disabled:opacity-40">−</button>
                  <button onClick={() => alterarQuantidade(grupo.item, 1)} disabled={salvando} className="w-5 h-5 rounded-md border border-[#E4E4E7] dark:border-[#3F3F46] text-xs font-bold text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center disabled:opacity-40">+</button>
                  <button onClick={() => removerItem(grupo.item)} disabled={salvando} className="w-5 h-5 rounded-md border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 flex items-center justify-center disabled:opacity-40">
                    <Icon name="X" size={11} />
                  </button>
                </div>
              </div>
            ))}
            {(comanda.itens ?? []).length === 0 && <p className="text-xs text-[#A1A1AA] text-center py-3">Carrinho vazio — clique num produto ao lado.</p>}
          </div>

          <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] pt-3 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between items-center text-sm gap-2">
              <span>Desconto</span>
              <input type="number" value={descontoInput} onChange={(e) => setDescontoInput(e.target.value)}
                className="w-20 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1 text-right text-sm" />
              <button onClick={aplicarDesconto} className="text-xs text-[#FF441F] font-bold flex-shrink-0">Aplicar</button>
            </div>
            <div className="flex justify-between items-center text-sm gap-2">
              <span>Acréscimo</span>
              <input type="number" value={acrescimoInput} onChange={(e) => setAcrescimoInput(e.target.value)}
                className="w-20 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1 text-right text-sm" />
              <button onClick={aplicarAcrescimo} className="text-xs text-[#FF441F] font-bold flex-shrink-0">Aplicar</button>
            </div>
            <div className="flex justify-between text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">
              <span>Total</span><span>{fmt(totalFinal)}</span>
            </div>
          </div>

          <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-3 pt-3 space-y-2">
            <div className="flex justify-between items-center text-base">
              <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium">Saldo devedor</span>
              <strong className={`text-lg ${saldo > 0.01 ? 'text-[#FF441F]' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt(saldo)}</strong>
            </div>
            {(comanda.pagamentos ?? []).length > 0 && (
              <div className="space-y-1">
                {comanda.pagamentos.map((p) => (
                  <div key={p.id}>
                  <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex justify-between items-center gap-2">
                    <span>
                      {PAGAMENTO_LABEL[p.forma_pagamento] ?? p.forma_pagamento}
                      {p.taxa_cartao_valor > 0 && <span className="text-[#FF441F]"> + taxa {fmt(p.taxa_cartao_valor)}</span>}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span>{fmt(p.valor + (p.taxa_cartao_valor || 0))}</span>
                      {p.forma_pagamento === 'cash' && (p.troco ?? 0) > 0 && (
                        <button onClick={() => alterarTrocoPix(p)} title={p.troco_via_pix ? 'Voltar troco pra espécie' : 'Marcar troco como pago via Pix'}
                          className={`px-1.5 h-5 rounded-md border text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                            p.troco_via_pix
                              ? 'border-[#FF441F]/40 bg-[#FF441F]/10 text-[#FF441F]'
                              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}>
                          Troco Pix
                        </button>
                      )}
                      <button onClick={() => removerPagamento(p)} className="w-5 h-5 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center">
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  </div>
                  {p.forma_pagamento === 'cash' && p.valor_recebido != null && (
                    <p className="text-[10px] text-[#A1A1AA] pl-0.5">
                      Dinheiro: {fmt(p.valor_recebido)} · Troco{p.troco_via_pix ? ' (Pix)' : ''}: {fmt(p.troco || 0)} · Venda: {fmt(p.valor)}
                    </p>
                  )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <input type="number" value={valorPagamento} onChange={(e) => setValorPagamento(e.target.value)} placeholder="Valor"
                className="w-20 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-xs" />
              <select value={formaPagamentoParcial} onChange={(e) => setFormaPagamentoParcial(e.target.value)}
                className="flex-1 min-w-[100px] border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-xs">
                <option value="pix">PIX</option>
                <option value="credit_card">Cartão de crédito</option>
                <option value="debit_card">Cartão de débito</option>
                <option value="cash">Dinheiro</option>
              </select>
            </div>
            {taxaCartaoValorParcial > 0 && (
              <p className="text-[11px] text-[#FF441F] font-medium">
                + taxa cartão ({taxaCartaoPercentual}%): {fmt(taxaCartaoValorParcial)} — cobrar {fmt(Number(valorPagamento || 0) + taxaCartaoValorParcial)}
              </p>
            )}
            {formaPagamentoParcial === 'cash' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input type="number" value={valorRecebidoParcial} onChange={(e) => setValorRecebidoParcial(e.target.value)}
                    placeholder="Informe o valor pago pelo cliente"
                    className="flex-1 border-2 border-red-500 dark:border-red-500 bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-xs" />
                  {trocoParcial !== null && (
                    <span className={`text-xs font-bold flex-shrink-0 ${trocoParcial < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      Troco: {fmt(Math.max(trocoParcial, 0))}
                    </span>
                  )}
                </div>
                {trocoParcial > 0 && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={trocoViaPixParcial} onChange={(e) => setTrocoViaPixParcial(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-[#FF441F]" />
                    <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Troco via Pix (não sai do caixa em espécie)</span>
                  </label>
                )}
              </div>
            )}
            <button onClick={registrarPagamento} disabled={!valorPagamento || salvando}
              className="w-full px-2.5 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-bold disabled:opacity-40">
              Adicionar pagamento
            </button>
          </div>

          {erro && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{erro}</p>}

          {saldo > 0.01 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 mt-2">
              Ainda falta {fmt(saldo)} de saldo devedor. Adicione os pagamentos acima (com a forma de cada um) até zerar pra poder finalizar.
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={cancelar} disabled={salvando}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50">
              Cancelar venda
            </button>
            <button onClick={finalizar} disabled={salvando || (comanda.itens ?? []).length === 0 || saldo > 0.01}
              title={saldo > 0.01 ? 'Registre os pagamentos até o saldo zerar' : undefined}
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

export default RestauranteVendaBalcao;
