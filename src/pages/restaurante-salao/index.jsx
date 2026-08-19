import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getGarconsOnline, getSalaoMesas, getSalaoComandas, getSalaoComandaDetalhe, getSalaoComandasFechadasHoje,
  aplicarDescontoComanda, aplicarAcrescimoComanda, cancelarComandaSalao, pagarComandaSalao,
  adicionarItensComandaSalao, enviarItensComandaSalao, editarItemComandaSalao, removerItemComandaSalao, transferirGarcomComanda, getSugestaoGorjeta,
  listarGarcons, getMeusProdutos, getMeusCombos, registrarPagamentoParcialSalao, transferirComandaSalao,
  editarPagamentoParcialSalao, removerPagamentoParcialSalao, alterarTrocoPixComandaSalao, abrirVendaBalcao, reabrirComandaSalao,
  abrirComandaSalao, bloquearMesaSalao, desbloquearMesaSalao, imprimirConferenciaSalao, getConfig,
  reimprimirReciboSalao, dividirComandaSalao, editarClienteComandaSalao,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import { printReciboCliente, printConferenciaComanda, printTicketSetor } from '../../utils/printComanda';
import { getAcompanharUrls, getAutoAtendimentoUrls } from '../../utils/mesaAcompanharUrl';
import { agruparItensComanda, quantidadeGrupoCombo } from '../../utils/agruparItensComanda';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };

const MESA_STATUS_COR = {
  livre: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  ocupada: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  aguardando_pagamento: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  bloqueada: 'bg-zinc-200 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800',
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
      <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">
          {mesa ? `Abrir Mesa ${mesa.numero}` : 'Abrir comanda avulsa'}
        </h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-4">Nome e telefone do cliente são obrigatórios antes de vender.</p>
        <form onSubmit={submit} className="space-y-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" required
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone do cliente" required
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
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
      await onConfirmar({
        ...(produto.tipo === 'combo' ? { combo_id: produto.id } : { product_id: produto.id }),
        quantity: quantidade,
        observacao: observacao.trim() || undefined,
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F4F4F5] dark:bg-[#3F3F46] flex-shrink-0">
            {produto.image_url
              ? <img src={produto.image_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={20} className="text-[#A1A1AA]" /></div>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">
              {produto.tipo === 'combo' && <span className="text-[10px] font-bold text-[#FF441F] mr-1">COMBO</span>}
              {produto.name}
            </p>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {produto.preco_promo != null && <span className="line-through text-[#A1A1AA] mr-1">{fmt(produto.price)}</span>}
              {fmt(produto.preco_promo ?? produto.price)}
            </p>
            {produto.quantidade_estoque != null && (
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">Em estoque: {produto.quantidade_estoque}</p>
            )}
          </div>
        </div>

        <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Quantidade</label>
        <div className="flex items-center gap-3 mt-1 mb-3">
          <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] flex items-center justify-center text-lg font-bold text-[#27272A] dark:text-[#F4F4F5]">−</button>
          <span className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] w-8 text-center">{quantidade}</span>
          <button
            onClick={() => setQuantidade((q) => (produto.quantidade_estoque != null ? Math.min(produto.quantidade_estoque, q + 1) : q + 1))}
            disabled={produto.quantidade_estoque != null && quantidade >= produto.quantidade_estoque}
            className="w-10 h-10 rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] flex items-center justify-center text-lg font-bold text-[#27272A] dark:text-[#F4F4F5] disabled:opacity-40">+</button>
        </div>

        <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Observação (opcional)</label>
        <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2}
          placeholder="Ex: sem cebola, ponto da carne..."
          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm mt-1 mb-4 resize-none" />

        <div className="flex gap-2">
          <button onClick={onFechar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA]">
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

  // meusProdutos() traz tudo (até inativo/sem estoque) pra alimentar a tela de admin —
  // aqui é picker de venda, filtra estoque zerado/nulo antes de oferecer pro dono.
  // Combo não tem quantidade_estoque (não é o mesmo controle dos produtos avulsos) —
  // o filtro de estoque zerado só vale pra produto normal.
  const vendaveis = produtos.filter((p) => p.tipo === 'combo' || (p.quantidade_estoque ?? 0) > 0);
  const categorias = ['todas', ...new Set(vendaveis.map((p) => p.category_name ?? 'Outros'))];
  const filtrados = vendaveis.filter((p) => {
    const bateBusca = p.name.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = categoria === 'todas' || (p.category_name ?? 'Outros') === categoria;
    return bateBusca && bateCategoria;
  });

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#27272A] z-[55] flex flex-col">
      <div className="p-4 border-b border-[#E4E4E7] dark:border-[#3F3F46] sticky top-0 bg-white dark:bg-[#27272A] max-w-2xl w-full mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onFechar} className="p-1 text-[#71717A] dark:text-[#A1A1AA]"><Icon name="ArrowLeft" size={20} /></button>
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Adicionar produto</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." autoFocus
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          </div>
          {categorias.includes('Combos') && (
            <button type="button" onClick={() => setCategoria((c) => (c === 'Combos' ? 'todas' : 'Combos'))}
              className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap flex-shrink-0 ${
                categoria === 'Combos' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#18181B] dark:text-[#F4F4F5]'
              }`}>
              <Icon name="Package" size={15} /> Combos
            </button>
          )}
        </div>
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
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

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl w-full mx-auto space-y-2">
        {filtrados.map((p) => (
          <button key={`${p.tipo ?? 'produto'}-${p.id}`} onClick={() => setProdutoAtivo(p)}
            className="w-full bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-2.5 flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F4F4F5] dark:bg-[#3F3F46] flex-shrink-0">
              {p.image_url
                ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Icon name={p.tipo === 'combo' ? 'Package' : 'UtensilsCrossed'} size={18} className="text-[#A1A1AA]" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">
                {p.tipo === 'combo' && <span className="text-[10px] font-bold text-[#FF441F] mr-1">COMBO</span>}
                {p.name}
              </p>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                {p.preco_promo != null && <span className="line-through text-[#A1A1AA] mr-1">{fmt(p.price)}</span>}
                {fmt(p.preco_promo ?? p.price)}
                {p.quantidade_estoque != null && <span className="text-[#A1A1AA]"> · estoque: {p.quantidade_estoque}</span>}
              </p>
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

// Separar comanda: cliente escolhe quais itens viram uma comanda avulsa nova,
// separada da original — pra quando um componente da mesa quer pagar só o que
// ele consumiu, sem misturar com o resto da conta.
const DividirComandaModal = ({ itens, onFechar, onConfirmar, salvando }) => {
  const [selecionados, setSelecionados] = useState(new Set());
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');

  const toggle = (itemId) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(itemId)) novo.delete(itemId);
      else novo.add(itemId);
      return novo;
    });
  };

  const subtotalSelecionado = itens
    .filter((i) => selecionados.has(i.id))
    .reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const todosSelecionados = selecionados.size > 0 && selecionados.size === itens.length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[55] p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Separar comanda</h2>
          <button onClick={onFechar} className="p-1 text-[#71717A] dark:text-[#A1A1AA]"><Icon name="X" size={20} /></button>
        </div>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">Marque os itens que vão pra uma comanda separada nova.</p>

        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {itens.map((item) => (
            <label key={item.id}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                selecionados.has(item.id) ? 'border-[#FF441F] bg-[#FF441F]/5' : 'border-[#E4E4E7] dark:border-[#3F3F46]'
              }`}>
              <input type="checkbox" checked={selecionados.has(item.id)} onChange={() => toggle(item.id)}
                className="w-4 h-4 accent-[#FF441F] flex-shrink-0" />
              <span className="flex-1 min-w-0 text-sm text-[#18181B] dark:text-[#F4F4F5] truncate">{item.quantity}x {item.product_name ?? item.products?.name}</span>
              <span className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex-shrink-0">{fmt(item.quantity * item.unit_price)}</span>
            </label>
          ))}
        </div>

        {todosSelecionados && (
          <p className="text-xs text-[#FF441F] font-medium mt-2">Desmarque ao menos 1 item — pra mover a comanda inteira use "Transferir".</p>
        )}

        <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-3 pt-3 space-y-2">
          <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Nome do cliente da nova comanda *</label>
          <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente" autoFocus
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="Telefone (opcional)"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        </div>

        <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-3 pt-3 flex items-center justify-between">
          <span className="text-sm text-[#71717A] dark:text-[#A1A1AA]">{selecionados.size} item(s) selecionado(s)</span>
          <span className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(subtotalSelecionado)}</span>
        </div>
        <button
          onClick={() => onConfirmar([...selecionados], clienteNome, clienteTelefone)}
          disabled={selecionados.size === 0 || todosSelecionados || !clienteNome.trim() || salvando}
          className="w-full mt-3 py-2.5 bg-[#FF441F] text-white rounded-xl text-sm font-bold hover:bg-[#E63A19] disabled:opacity-40">
          {salvando ? 'Separando...' : 'Criar comanda separada'}
        </button>
      </div>
    </div>
  );
};

const EditarClienteComandaModal = ({ comanda, onFechar, onEditado }) => {
  const [nome, setNome] = useState(comanda.cliente_mesa_nome ?? '');
  const [telefone, setTelefone] = useState(comanda.cliente_mesa_telefone ?? '');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await editarClienteComandaSalao(comanda.id, nome.trim(), telefone.trim());
      await onEditado();
      onFechar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">Editar dados do cliente</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-4">Corrige nome ou telefone digitados errado.</p>
        <form onSubmit={submit} className="space-y-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" required autoFocus
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone do cliente"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ComandaModal = ({ comandaId, mesas, comandas, onFechar, onMudou }) => {
  const [comanda, setComanda] = useState(null);
  const [descontoInput, setDescontoInput] = useState('');
  const [acrescimoInput, setAcrescimoInput] = useState('');
  const [forma, setForma] = useState('pix');
  const formaTocada = useRef(false);
  const emAndamentoRef = useRef(false);
  const [gorjeta, setGorjeta] = useState('');
  const [gorjetaPercentual, setGorjetaPercentual] = useState(0);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [garcons, setGarcons] = useState([]);
  const [garcomSelecionado, setGarcomSelecionado] = useState('');

  const [produtos, setProdutos] = useState([]);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [mostrarDividir, setMostrarDividir] = useState(false);
  const [mostrarEditarCliente, setMostrarEditarCliente] = useState(false);

  const [valorPagamento, setValorPagamento] = useState('');
  const [formaPagamentoParcial, setFormaPagamentoParcial] = useState('pix');
  const [valorRecebidoParcial, setValorRecebidoParcial] = useState('');
  const [trocoViaPixParcial, setTrocoViaPixParcial] = useState(false);
  const [mesaDestino, setMesaDestino] = useState('');
  const [mostrarQr, setMostrarQr] = useState(false);
  const [mostrarQrAuto, setMostrarQrAuto] = useState(false);
  const [qrModo, setQrModo] = useState('online'); // 'online' | 'local'
  const [linkCopiado, setLinkCopiado] = useState(null); // 'acompanhar' | 'auto' | null
  const { autoAtendimentoHabilitado } = useModulosEmpresa();
  const [pagamentoEditandoId, setPagamentoEditandoId] = useState(null);
  const [valorEdicao, setValorEdicao] = useState('');
  const [formaEdicao, setFormaEdicao] = useState('pix');
  const [taxaCartaoPercentual, setTaxaCartaoPercentual] = useState(0);
  const [semGorjeta, setSemGorjeta] = useState(false);
  const semGorjetaTocada = useRef(false);
  // 'comanda' = cobra a gorjeta junto no fechamento (padrão); 'pix'/'dinheiro' = cliente
  // já pagou a gorjeta direto pro garçom, por fora — não cobra na comanda nem conta pro
  // repasse do garçom (ver salao-pdv.service.ts pagar()).
  const [formaGorjeta, setFormaGorjeta] = useState('comanda');
  const [observacaoEditandoId, setObservacaoEditandoId] = useState(null);
  const [observacaoInput, setObservacaoInput] = useState('');

  const carregar = useCallback(async () => {
    const [c, sugestao, produtosResp, combosResp] = await Promise.all([
      getSalaoComandaDetalhe(comandaId),
      getSugestaoGorjeta(comandaId),
      getMeusProdutos(),
      getMeusCombos(),
    ]);
    setComanda(c);
    setDescontoInput(String(c.desconto_valor ?? 0));
    setAcrescimoInput(String(c.acrescimo_valor ?? 0));
    setGorjetaPercentual(sugestao.percentual);
    setGorjeta((v) => (v === '' ? String(sugestao.valor_sugerido) : v));
    // Refaz a lista de produtos toda vez que a comanda recarrega — senão a quantidade
    // em estoque mostrada no picker fica desatualizada depois de incluir/editar item.
    // Combo entra na mesma lista, numa categoria própria — reusa a UI de produto normal.
    setProdutos([
      ...(produtosResp.produtos ?? []),
      ...(combosResp.combos ?? []).filter((c2) => c2.disponivel).map((c2) => ({ ...c2, tipo: 'combo', category_name: 'Combos' })),
    ]);
    // Pré-preenche com a forma que o garçom já informou ao fechar a comanda — só na
    // primeira carga, pra não sobrescrever se o caixa já mudou manualmente.
    if (!formaTocada.current && c.payment_method) {
      setForma(c.payment_method);
    }
    // Respeita a preferência que o cliente já marcou no auto atendimento (checkbox de
    // gorjeta) — só na primeira carga, sem sobrescrever se o garçom/caixa já mexeu.
    if (!semGorjetaTocada.current) {
      setSemGorjeta(!!c.sem_gorjeta);
    }
  }, [comandaId]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    listarGarcons().then(setGarcons).catch(() => {});
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
      onMudou();
    } catch (err) {
      setErro(err.message);
    } finally {
      emAndamentoRef.current = false;
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
        gorjeta: gorjetaEfetiva,
        taxaCartao: taxaCartaoTotalExibida,
        formaPagamento: forma,
      };
      const res = await imprimirConferenciaSalao(comandaId, valores);
      if (res?.via !== 'agente') printConferenciaComanda(comanda, comanda.itens ?? [], { ...valores, pagamentos: comanda.pagamentos ?? [] });
    });
  };

  // Copiar link (QR de acompanhamento ou de auto atendimento) — pro caso da câmera do
  // cliente não conseguir ler o QR, o garçom/caixa manda o link direto (WhatsApp etc).
  const copiarLink = async (url, chave) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement('textarea');
        el.value = url; el.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(el); el.focus(); el.select();
        document.execCommand('copy'); document.body.removeChild(el);
      }
      setLinkCopiado(chave);
      setTimeout(() => setLinkCopiado(null), 2500);
    } catch {}
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
          total: res?.total ?? comanda.total,
          formaPagamento: comanda.payment_method,
          trocoDado: 0,
          pagamentos: res?.pagamentos ?? comanda.pagamentos ?? [],
        });
      }
    });
  };

  const pagar = () => {
    acao(async () => {
      // Itens já pagos via "Pagar parcial" antes de chegar aqui (saldo obrigatoriamente
      // zerado) — esse passo só cobra a gorjeta, se houver, e só quando "na comanda".
      const res = await pagarComandaSalao(comandaId, forma, gorjetaEfetiva, undefined, formaGorjetaAtiva !== 'comanda');
      if (res?.recibo?.via !== 'agente') {
        printReciboCliente(comanda, comanda.itens ?? [], {
          subtotal,
          desconto: Number(descontoInput || 0),
          acrescimo: Number(acrescimoInput || 0),
          gorjeta: gorjetaEfetiva,
          taxaCartao: res?.taxa_cartao_valor ?? 0,
          total: res?.total_geral ?? (totalFinal + gorjetaEfetiva + taxaCartaoTotalExibida),
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

  // Item fica pendente até esse clique — evita que cozinha/bar vejam e logo em seguida
  // percam um item que foi corrigido/apagado por engano (mesmo botão do garçom).
  const enviarItens = () => {
    acao(async () => {
      const { grupos } = await enviarItensComandaSalao(comandaId);
      (grupos ?? []).forEach((grupo) => { if (grupo.itens?.length) printTicketSetor(grupo.itens, comanda, grupo.setor); });
    });
  };

  const removerItem = (item) => {
    if (!window.confirm(`Remover ${item.products?.name}?`)) return;
    acao(() => removerItemComandaSalao(comandaId, item.id));
  };

  const alterarQuantidadeItem = (item, delta) => {
    const novaQtd = item.quantity + delta;
    if (novaQtd < 1) return;
    acao(() => editarItemComandaSalao(comandaId, item.id, { quantity: novaQtd }));
  };

  const abrirEdicaoObservacao = (item) => {
    setObservacaoEditandoId(item.id);
    setObservacaoInput(item.observacao ?? '');
  };

  const salvarObservacao = (item) => {
    acao(() => editarItemComandaSalao(comandaId, item.id, { observacao: observacaoInput }));
    setObservacaoEditandoId(null);
  };

  const renderItemLinha = (item, { ocultarComboLabel = false } = {}) => (
    <div key={item.id} className="py-1">
      <div className="flex justify-between items-center text-base gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#F4F4F5] dark:bg-[#3F3F46] flex-shrink-0">
            {item.products?.image_url
              ? <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={15} className="text-[#A1A1AA]" /></div>}
          </div>
          <span className="truncate font-medium">
            {item.quantity}x {item.products?.name}
            {item.combo_nome && !ocultarComboLabel && <span className="text-xs text-[#FF441F] block leading-tight">combo: {item.combo_nome}</span>}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-semibold">{fmt(item.quantity * item.unit_price)}</span>
          {['aberta', 'fechada_garcom'].includes(comanda.status) && (
            <>
              <button onClick={() => abrirEdicaoObservacao(item)} title="Editar observação" className="w-7 h-7 rounded-md border border-[#E4E4E7] dark:border-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-center">
                <Icon name="MessageSquare" size={13} />
              </button>
              <button onClick={() => alterarQuantidadeItem(item, -1)} className="w-7 h-7 rounded-md border border-[#E4E4E7] dark:border-[#3F3F46] text-sm font-bold text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center">−</button>
              <button onClick={() => alterarQuantidadeItem(item, 1)} className="w-7 h-7 rounded-md border border-[#E4E4E7] dark:border-[#3F3F46] text-sm font-bold text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center">+</button>
              <button onClick={() => removerItem(item)} className="w-7 h-7 rounded-md border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 flex items-center justify-center">
                <Icon name="X" size={13} />
              </button>
            </>
          )}
        </div>
      </div>
      {observacaoEditandoId === item.id ? (
        <div className="flex items-center gap-1.5 mt-1 pl-11">
          <input value={observacaoInput} onChange={(e) => setObservacaoInput(e.target.value)} autoFocus
            placeholder="Observação..." className="flex-1 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#FF441F]" />
          <button onClick={() => salvarObservacao(item)} className="text-sm font-bold text-[#FF441F]">Salvar</button>
          <button onClick={() => setObservacaoEditandoId(null)} className="text-sm text-[#A1A1AA]">Cancelar</button>
        </div>
      ) : item.observacao ? (
        <p onClick={() => ['aberta', 'fechada_garcom'].includes(comanda.status) && abrirEdicaoObservacao(item)}
          className="text-sm text-blue-600 dark:text-blue-400 pl-11 cursor-pointer">Obs: {item.observacao}</p>
      ) : null}
    </div>
  );

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
    const [tipo, idStr] = mesaDestino.split(':');
    acao(async () => {
      await transferirComandaSalao(comandaId, tipo === 'comanda' ? { comanda_destino_id: Number(idStr) } : { mesa_id: Number(idStr) });
      setMesaDestino('');
      onFechar();
    });
  };

  const dividirComanda = (itemIds, clienteNome, clienteTelefone) => {
    acao(async () => {
      await dividirComandaSalao(comandaId, itemIds, clienteNome, clienteTelefone);
      setMostrarDividir(false);
    });
  };

  if (!comanda) return null;

  const podeEditar = comanda.status === 'aberta' || comanda.status === 'fechada_garcom';
  const temPendente = (comanda.itens ?? []).some((i) => i.status === 'pendente');
  // Comanda já paga: só dá pra corrigir a forma de pagamento (ex: confirmou PIX por
  // engano, era dinheiro) — não reabre valor nem permite remover. Backend também bloqueia
  // se o caixa dessa comanda já tiver sido fechado (resumo já foi gravado e congelado).
  const podeCorrigirFormaPagamento = podeEditar || comanda.status === 'paga';
  const gorjetaEfetiva = semGorjeta ? 0 : Number(gorjeta || 0);
  // Ignora a escolha "direto" se a gorjeta zerou depois (evita ficar preso escondendo o
  // select principal por engano — mesmo bug que já rolou antes com essa tela).
  const formaGorjetaAtiva = gorjetaEfetiva > 0 ? formaGorjeta : 'comanda';
  // Gorjeta paga direto pro garçom (pix/dinheiro, por fora) não entra no valor cobrado
  // pela comanda — só a opção "na comanda" cobra junto no fechamento.
  const gorjetaCobrancaComanda = formaGorjetaAtiva === 'comanda' ? gorjetaEfetiva : 0;
  const subtotal = (comanda.itens ?? []).reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const totalFinal = subtotal - Number(descontoInput || 0) + Number(acrescimoInput || 0);
  const saldoDevedor = comanda.saldo?.saldo ?? totalFinal;
  const valorACobrarFinalBase = parseFloat(((comanda.saldo?.saldo ?? totalFinal) + gorjetaCobrancaComanda).toFixed(2));
  const taxaCartaoValorFinal = isCartao(forma) ? parseFloat((valorACobrarFinalBase * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const valorACobrarFinal = parseFloat((valorACobrarFinalBase + taxaCartaoValorFinal).toFixed(2));
  // Taxa de cartão de pagamentos parciais já registrados (ex: garçom cobrou parte no cartão
  // antes do fechamento) — soma no "Total (comanda + gorjeta)" e na impressão de conferência,
  // que antes só contavam a taxa da forma de pagamento selecionada agora pro fechamento.
  const taxaCartaoRegistrada = (comanda.pagamentos ?? []).reduce((acc, p) => acc + (p.taxa_cartao_valor || 0), 0);
  const taxaCartaoTotalExibida = taxaCartaoValorFinal + taxaCartaoRegistrada;
  const taxaCartaoValorParcial = isCartao(formaPagamentoParcial) ? parseFloat((Number(valorPagamento || 0) * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const trocoParcial = formaPagamentoParcial === 'cash' && valorRecebidoParcial ? Number(valorRecebidoParcial) - Number(valorPagamento || 0) : null;
  const pagamentosDinheiro = (comanda.pagamentos ?? []).filter((p) => p.forma_pagamento === 'cash' && p.valor_recebido != null);
  const totalRecebidoDinheiro = pagamentosDinheiro.reduce((acc, p) => acc + Number(p.valor_recebido), 0);
  const totalTrocoEspecie = pagamentosDinheiro.reduce((acc, p) => acc + (p.troco_via_pix ? 0 : Number(p.troco || 0)), 0);
  const totalTrocoPix = pagamentosDinheiro.reduce((acc, p) => acc + (p.troco_via_pix ? Number(p.troco || 0) : 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">
              Comanda #{comanda.numero_comanda ?? comanda.id}{comanda.mesas ? ` — Mesa ${comanda.mesas.numero}` : ''}
            </h2>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{comanda.cliente_mesa_nome} · {comanda.cliente_mesa_telefone}</p>
              {podeEditar && (
                <button onClick={() => setMostrarEditarCliente(true)} className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#FF441F] flex-shrink-0" title="Editar dados do cliente">
                  <Icon name="Pencil" size={12} />
                </button>
              )}
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {comanda.garcons?.nome ? `Garçom: ${comanda.garcons.nome}` : comanda.aberto_por_nome ? `Caixa: ${comanda.aberto_por_nome}` : 'Garçom: —'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
              {comanda.status === 'aberta' ? 'Em aberto'
                : comanda.status === 'fechada_garcom' ? 'Aguardando pagamento'
                : comanda.status === 'paga' ? 'Paga'
                : comanda.status === 'canceled' ? 'Cancelada' : comanda.status}
            </span>
            <button onClick={onFechar} className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#FF441F]" title="Fechar">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {comanda.status === 'fechada_garcom' && (
          <button onClick={reabrir} disabled={salvando}
            className="w-full mb-3 py-2 text-xs font-bold rounded-xl border border-[#FF441F] text-[#FF441F] hover:bg-[#FF441F]/5 disabled:opacity-50">
            Reabrir comanda (cliente vai continuar consumindo)
          </button>
        )}

        {comanda.status === 'paga' && (
          <button onClick={reimprimirRecibo} disabled={salvando}
            className="w-full mb-3 py-2.5 bg-[#F4F4F5] dark:bg-[#3F3F46] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40">
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
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${qrModo === 'online' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                        ONLINE
                      </button>
                      <button onClick={() => setQrModo('local')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${qrModo === 'local' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                        LOCAL
                      </button>
                    </div>
                  )}
                  <div className="bg-[#FAFAFA] dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-3 inline-flex flex-col items-center gap-1">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlAtiva)}`}
                      alt="QR de acompanhamento" width={150} height={150}
                    />
                    <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">Cliente escaneia pra acompanhar o preparo</p>
                    <button onClick={() => copiarLink(urlAtiva, 'acompanhar')}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#FF441F] mt-1">
                      <Icon name={linkCopiado === 'acompanhar' ? 'Check' : 'Copy'} size={11} />
                      {linkCopiado === 'acompanhar' ? 'Link copiado!' : 'Copiar link (câmera com problema)'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {autoAtendimentoHabilitado && comanda.mesas?.auto_atendimento_token && (
          <div className="mb-3">
            <button onClick={() => setMostrarQrAuto((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold text-pink-700 dark:text-pink-400">
              <Icon name="QrCode" size={14} /> {mostrarQrAuto ? 'Esconder QR de Auto Atendimento' : 'Mostrar QR de Auto Atendimento'}
            </button>
            {mostrarQrAuto && (() => {
              const urls = getAutoAtendimentoUrls(comanda.mesas.auto_atendimento_token);
              const urlAuto = qrModo === 'local' && urls.lan ? urls.lan : urls.principal;
              return (
                <div className="mt-2 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900 rounded-xl p-3 inline-flex flex-col items-center gap-1">
                  {urls.lan && (
                    <div className="flex gap-2 mb-1">
                      <button onClick={() => setQrModo('online')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${qrModo === 'online' ? 'bg-pink-600 text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                        ONLINE
                      </button>
                      <button onClick={() => setQrModo('local')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${qrModo === 'local' ? 'bg-pink-600 text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                        LOCAL
                      </button>
                    </div>
                  )}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlAuto)}`}
                    alt="QR de auto atendimento" width={150} height={150}
                  />
                  <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">Cliente escaneia e faz o pedido direto, sem depender do garçom</p>
                  <button onClick={() => copiarLink(urlAuto, 'auto')}
                    className="flex items-center gap-1 text-[10px] font-bold text-pink-700 dark:text-pink-400 mt-1">
                    <Icon name={linkCopiado === 'auto' ? 'Check' : 'Copy'} size={11} />
                    {linkCopiado === 'auto' ? 'Link copiado!' : 'Copiar link (câmera com problema)'}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {podeEditar && (
        <div className="flex items-center gap-2 mb-3">
          <select value={garcomSelecionado} onChange={(e) => setGarcomSelecionado(e.target.value)}
            className="flex-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-xs">
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
            className="flex-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-xs">
            <option value="">Transferir mesa/comanda pra...</option>
            <optgroup label="Mesas">
              {(mesas ?? []).filter((m) => m.id !== comanda.mesa_id).map((m) => (
                <option key={`m-${m.id}`} value={`mesa:${m.id}`}>
                  Mesa {m.numero}{m.comanda ? ` (ocupada — junta comandas)` : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Comandas avulsas">
              {(comandas ?? []).filter((c) => !c.mesa_id && c.id !== comanda.id).map((c) => (
                <option key={`c-${c.id}`} value={`comanda:${c.id}`}>
                  #{c.numero_comanda ?? c.id} — {c.cliente_mesa_nome ?? 'Sem nome'} (junta comandas)
                </option>
              ))}
            </optgroup>
          </select>
          <button onClick={transferirMesaOuComanda} disabled={!mesaDestino || salvando}
            className="text-xs font-bold text-[#FF441F] disabled:opacity-40 flex-shrink-0">Transferir</button>
        </div>
        )}

        <div className="space-y-1 mb-3">
          {agruparItensComanda(comanda.itens).map((grupo, gi) => grupo.tipo === 'combo' ? (
            <div key={`combo-${grupo.nome}-${gi}`} className="rounded-lg border border-[#FF441F]/30 dark:border-[#FF441F]/40 overflow-hidden mb-1">
              <div className="bg-[#FF441F]/10 px-2 py-1 flex items-center gap-1.5">
                <Icon name="Package" size={12} className="text-[#FF441F]" />
                <span className="text-[11px] font-bold text-[#FF441F]">{quantidadeGrupoCombo(grupo)}x {grupo.nome}</span>
              </div>
              <div className="p-1.5 space-y-1">
                {grupo.itens.map((item) => renderItemLinha(item, { ocultarComboLabel: true }))}
              </div>
            </div>
          ) : renderItemLinha(grupo.item))}
        </div>

        {comanda.status === 'aberta' && (
          <button onClick={() => setMostrarPicker(true)} disabled={salvando}
            className="w-full mb-3 py-2.5 bg-[#F4F4F5] dark:bg-[#3F3F46] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40">
            <Icon name="Plus" size={16} /> Incluir produto
          </button>
        )}

        {temPendente && (
          <>
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-2 py-1.5 mb-2">
              Tem produto ainda não enviado pra cozinha/bar — não dá pra fechar ou pagar a comanda até enviar.
            </p>
            <button onClick={enviarItens} disabled={salvando}
              className="w-full mb-3 py-2.5 border border-[#FF441F] text-[#FF441F] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40">
              <Icon name="Send" size={16} /> {salvando ? 'Enviando...' : 'Enviar novos itens'}
            </button>
          </>
        )}

        {comanda.status === 'aberta' && (comanda.itens ?? []).length > 1 && (
          <button onClick={() => setMostrarDividir(true)} disabled={salvando}
            className="w-full mb-3 py-2.5 bg-[#F4F4F5] dark:bg-[#3F3F46] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40">
            <Icon name="Scissors" size={16} /> Separar comanda
          </button>
        )}

        <button onClick={imprimirConferencia} disabled={salvando}
          className="w-full mb-3 py-2.5 bg-[#F4F4F5] dark:bg-[#3F3F46] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40">
          <Icon name="Printer" size={16} /> Imprimir comanda (conferência)
        </button>

        {mostrarPicker && (
          <ProdutoPickerModal
            produtos={produtos}
            onFechar={() => setMostrarPicker(false)}
            onAdicionado={async (item) => { await incluirItem(item); setMostrarPicker(false); }}
          />
        )}

        {mostrarDividir && (
          <DividirComandaModal
            itens={comanda.itens ?? []}
            onFechar={() => setMostrarDividir(false)}
            onConfirmar={dividirComanda}
            salvando={salvando}
          />
        )}

        {mostrarEditarCliente && (
          <EditarClienteComandaModal
            comanda={comanda}
            onFechar={() => setMostrarEditarCliente(false)}
            onEditado={carregar}
          />
        )}

        <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] pt-3 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {podeEditar && (
          <div className="flex justify-between items-center text-sm gap-2">
            <span>Desconto</span>
            <input type="number" value={descontoInput} onChange={(e) => setDescontoInput(e.target.value)}
              className="w-24 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1 text-right text-sm" />
            <button onClick={() => acao(() => aplicarDescontoComanda(comandaId, Number(descontoInput || 0)))}
              className="text-xs text-[#FF441F] font-bold">Aplicar</button>
          </div>
          )}
          {podeEditar && (
          <div className="flex justify-between items-center text-sm gap-2">
            <span>Acréscimo</span>
            <input type="number" value={acrescimoInput} onChange={(e) => setAcrescimoInput(e.target.value)}
              className="w-24 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1 text-right text-sm" />
            <button onClick={() => acao(() => aplicarAcrescimoComanda(comandaId, Number(acrescimoInput || 0)))}
              className="text-xs text-[#FF441F] font-bold">Aplicar</button>
          </div>
          )}
          <div className="flex justify-between text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">
            <span>Total</span><span>{fmt(totalFinal)}</span>
          </div>
        </div>

        {/* Comanda já paga/cancelada: mostra o resumo completo (desconto, acréscimo,
            gorjeta, taxa cartão, forma de pagamento e total geral) em modo leitura —
            antes esse bloco só aparecia enquanto podeEditar, sumindo tudo isso depois
            de fechada e deixando a conferência/recibo sem essas informações. */}
        {!podeEditar && (
          <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-3 pt-3 space-y-1">
            {Number(comanda.desconto_valor || 0) > 0 && (
              <div className="flex justify-between text-sm"><span className="text-[#71717A] dark:text-[#A1A1AA]">Desconto</span><span>- {fmt(comanda.desconto_valor)}</span></div>
            )}
            {Number(comanda.acrescimo_valor || 0) > 0 && (
              <div className="flex justify-between text-sm"><span className="text-[#71717A] dark:text-[#A1A1AA]">Acréscimo</span><span>+ {fmt(comanda.acrescimo_valor)}</span></div>
            )}
            {Number(comanda.gorjeta_valor || 0) > 0 && (
              <div className="flex justify-between text-sm"><span className="text-[#71717A] dark:text-[#A1A1AA]">Gorjeta</span><span>{fmt(comanda.gorjeta_valor)}</span></div>
            )}
            {taxaCartaoRegistrada > 0 && (
              <div className="flex justify-between text-sm"><span className="text-[#71717A] dark:text-[#A1A1AA]">Taxa cartão</span><span className="text-[#FF441F]">+ {fmt(taxaCartaoRegistrada)}</span></div>
            )}
            {comanda.payment_method && (
              <div className="flex justify-between text-sm"><span className="text-[#71717A] dark:text-[#A1A1AA]">Forma de pagamento</span><span>{PAGAMENTO_LABEL[comanda.payment_method] ?? comanda.payment_method}</span></div>
            )}
            <div className="flex justify-between text-base font-bold text-[#18181B] dark:text-[#F4F4F5] pt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
              <span>Total geral</span><span>{fmt(comanda.saldo?.total ?? totalFinal)}</span>
            </div>
          </div>
        )}

        <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-3 pt-3 space-y-2">
          <div className="flex justify-between items-center text-base">
            <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium">Saldo devedor</span>
            <strong className={`text-lg ${(comanda.saldo?.saldo ?? 0) > 0.01 ? 'text-[#FF441F]' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {fmt(comanda.saldo?.saldo ?? totalFinal)}
            </strong>
          </div>
          {(comanda.pagamentos ?? []).length > 0 && (
            <div className="space-y-1">
              {comanda.pagamentos.map((p) => (
                pagamentoEditandoId === p.id ? (
                  <div key={p.id} className="flex items-center gap-1.5 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-lg p-1.5">
                    <input type="number" value={valorEdicao} onChange={(e) => setValorEdicao(e.target.value)}
                      disabled={comanda.status === 'paga'} title={comanda.status === 'paga' ? 'Comanda paga: só a forma de pagamento pode ser corrigida' : undefined}
                      className="w-16 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg px-1.5 py-1 text-xs bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] disabled:opacity-50 disabled:bg-[#F4F4F5] dark:disabled:bg-[#3F3F46]" />
                    <select value={formaEdicao} onChange={(e) => setFormaEdicao(e.target.value)}
                      className="flex-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-1.5 py-1 text-xs">
                      <option value="pix">PIX</option>
                      <option value="credit_card">Cartão de crédito</option>
                      <option value="debit_card">Cartão de débito</option>
                      <option value="cash">Dinheiro</option>
                    </select>
                    <button onClick={salvarEdicaoPagamento} disabled={!valorEdicao || salvando}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 disabled:opacity-40 flex-shrink-0">Salvar</button>
                    <button onClick={() => setPagamentoEditandoId(null)}
                      className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0">Cancelar</button>
                  </div>
                ) : (
                  <div key={p.id}>
                  <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex justify-between items-center gap-2">
                    <span>
                      {PAGAMENTO_LABEL[p.forma_pagamento] ?? p.forma_pagamento} ({p.origem === 'garcom' ? 'garçom' : 'caixa'})
                      {p.taxa_cartao_valor > 0 && <span className="text-[#FF441F]"> + taxa {fmt(p.taxa_cartao_valor)}</span>}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span>{fmt(p.valor + (p.taxa_cartao_valor || 0))}</span>
                      {podeCorrigirFormaPagamento && p.forma_pagamento === 'cash' && (p.troco ?? 0) > 0 && (
                        <button onClick={() => alterarTrocoPix(p)} title={p.troco_via_pix ? 'Voltar troco pra espécie' : 'Marcar troco como pago via Pix'}
                          className={`px-1.5 h-6 rounded-md border text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                            p.troco_via_pix
                              ? 'border-[#FF441F]/40 bg-[#FF441F]/10 text-[#FF441F]'
                              : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-950/40'
                          }`}>
                          Troco Pix
                        </button>
                      )}
                      {podeCorrigirFormaPagamento && (
                        <button onClick={() => iniciarEdicaoPagamento(p)} title="Corrigir forma de pagamento"
                          className="w-6 h-6 rounded-md border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-950/40 flex-shrink-0">
                          <Icon name="Pencil" size={13} strokeWidth={2.5} />
                        </button>
                      )}
                      {podeEditar && (
                        <button onClick={() => removerPagamento(p)} className="w-6 h-6 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/40 flex-shrink-0">
                          <Icon name="X" size={14} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                  {p.forma_pagamento === 'cash' && p.valor_recebido != null && (
                    <p className="text-[10px] text-[#A1A1AA] pl-0.5">
                      Dinheiro: {fmt(p.valor_recebido)} · Troco{p.troco_via_pix ? ' (Pix)' : ''}: {fmt(p.troco || 0)} · Venda: {fmt(p.valor)}
                    </p>
                  )}
                  </div>
                )
              ))}
            </div>
          )}
          {podeEditar && (
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
          )}
          {podeEditar && taxaCartaoValorParcial > 0 && (
            <p className="text-[11px] text-[#FF441F] font-medium">
              + taxa cartão ({taxaCartaoPercentual}%): {fmt(taxaCartaoValorParcial)} — cobrar {fmt(Number(valorPagamento || 0) + taxaCartaoValorParcial)}
            </p>
          )}
          {podeEditar && formaPagamentoParcial === 'cash' && (
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
          {podeEditar && (
            <button onClick={registrarPagamento} disabled={!valorPagamento || salvando}
              className="w-full px-2.5 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-bold disabled:opacity-40">
              Pagar parcial
            </button>
          )}
        </div>

        {podeEditar && (
        <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-3 pt-3 space-y-2">
          <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Gorjeta {gorjetaPercentual > 0 ? `(sugerida ${gorjetaPercentual}% — ajustável)` : '(opcional)'}
          </label>
          <input type="number" value={gorjeta} onChange={(e) => setGorjeta(e.target.value)} disabled={semGorjeta}
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] disabled:opacity-50 disabled:bg-[#F4F4F5] dark:disabled:bg-[#3F3F46]" />
          <label className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
            <input type="checkbox" checked={semGorjeta} onChange={(e) => { semGorjetaTocada.current = true; setSemGorjeta(e.target.checked); }} className="rounded" />
            Não cobrar gorjeta
          </label>

          {!semGorjeta && gorjetaEfetiva > 0 && (
            <>
              <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Forma de pagamento da gorjeta</label>
              <select
                value={formaGorjeta}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormaGorjeta(v);
                  // forma continua existindo só como valor técnico (payment_method aceita
                  // só pix/credit_card/debit_card/cash no banco) — não aparece mais pro
                  // usuário escolher, é derivado direto dessa mesma escolha.
                  formaTocada.current = true;
                  setForma(v === 'dinheiro' ? 'cash' : 'pix');
                }}
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm">
                <option value="comanda">Na comanda</option>
                <option value="pix">Pix direto</option>
                <option value="dinheiro">Dinheiro direto</option>
              </select>
              {formaGorjetaAtiva !== 'comanda' && (
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Não entra no valor cobrado da comanda nem no repasse do garçom — ele já ficou com o dinheiro.
                </p>
              )}
            </>
          )}
          <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-3 py-2 space-y-1 mt-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A] dark:text-[#A1A1AA]">Valor da comanda</span>
              <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(subtotal)}</span>
            </div>
            {Number(descontoInput || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Desconto</span>
                <span className="text-emerald-700 dark:text-emerald-400">- {fmt(Number(descontoInput))}</span>
              </div>
            )}
            {Number(acrescimoInput || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Acréscimo</span>
                <span className="text-[#18181B] dark:text-[#F4F4F5]">+ {fmt(Number(acrescimoInput))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A] dark:text-[#A1A1AA]">Gorjeta{formaGorjetaAtiva !== 'comanda' ? ' (direto ao garçom)' : ''}</span>
              <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(gorjetaEfetiva)}</span>
            </div>
            {taxaCartaoTotalExibida > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Taxa cartão</span>
                <span className="text-[#FF441F]">+ {fmt(taxaCartaoTotalExibida)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] pt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
              <span>Total (comanda + gorjeta{taxaCartaoTotalExibida > 0 ? ' + taxa' : ''})</span>
              <span>{fmt(totalFinal + gorjetaCobrancaComanda + taxaCartaoTotalExibida)}</span>
            </div>
            {(comanda.saldo?.total_pago ?? 0) > 0.01 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Já pago</span>
                  <span className="text-emerald-700 dark:text-emerald-400">- {fmt(comanda.saldo.total_pago)}</span>
                </div>
                {totalRecebidoDinheiro > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#71717A] dark:text-[#A1A1AA]">Dinheiro recebido</span>
                      <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(totalRecebidoDinheiro)}</span>
                    </div>
                    {totalTrocoEspecie > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#71717A] dark:text-[#A1A1AA]">Troco</span>
                        <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(totalTrocoEspecie)}</span>
                      </div>
                    )}
                    {totalTrocoPix > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#71717A] dark:text-[#A1A1AA]">Troco via Pix</span>
                        <span className="text-[#FF441F]">{fmt(totalTrocoPix)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm font-bold text-[#FF441F] pt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
                  <span>Falta pagar (com gorjeta{taxaCartaoTotalExibida > 0 ? ' + taxa' : ''})</span>
                  <span>{fmt(valorACobrarFinal)}</span>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {erro && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{erro}</p>}

        {podeEditar && saldoDevedor > 0.01 && (
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 mt-2">
            Ainda falta {fmt(saldoDevedor)} de saldo devedor. Registre os pagamentos acima (com a forma de cada um) até zerar pra poder fechar a comanda.
          </p>
        )}

        {podeEditar && (
        <div className="flex gap-2 mt-4">
          <button onClick={cancelar} disabled={salvando}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50">
            Cancelar comanda
          </button>
          <button onClick={pagar} disabled={salvando || saldoDevedor > 0.01 || temPendente}
            title={temPendente ? 'Envie os produtos pendentes antes de pagar' : saldoDevedor > 0.01 ? 'Registre os pagamentos até o saldo zerar' : undefined}
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

  const carregar = useCallback(async () => {
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
      onMudou();
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
        <button onClick={onFechar} className="p-1 text-[#71717A] dark:text-[#A1A1AA]"><Icon name="X" size={22} /></button>
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

          {/* Venda balcão não tem gorjeta e o botão Finalizar só habilita com saldo
              zerado (tudo já pago via "Pagar parcial") — não sobra nada pra cobrar
              aqui, então não faz sentido pedir forma de pagamento de novo. */}
          <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-3 pt-3">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <Icon name="CheckCircle2" size={16} /> Tudo pago — pronto pra finalizar
            </p>
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
  const [mesaQrAberta, setMesaQrAberta] = useState(null);
  const [qrModoGrid, setQrModoGrid] = useState('online');
  const [linkCopiadoGrid, setLinkCopiadoGrid] = useState(false);
  const { autoAtendimentoHabilitado } = useModulosEmpresa();

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

  const copiarLinkGrid = async (url) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement('textarea');
        el.value = url; el.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(el); el.focus(); el.select();
        document.execCommand('copy'); document.body.removeChild(el);
      }
      setLinkCopiadoGrid(true);
      setTimeout(() => setLinkCopiadoGrid(false), 2500);
    } catch {}
  };

  // Imprime só o QR num popup próprio — não precisa abrir a comanda, mesa pode estar
  // livre (token é fixo por mesa, pedido do usuário: colar fisicamente na mesa uma vez).
  const imprimirQrMesa = (mesaNumero, urlQr, imgSrc) => {
    const win = window.open('', '_blank', 'width=400,height=500');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Mesa ${mesaNumero}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:24px">
        <h2>Mesa ${mesaNumero}</h2>
        <img src="${imgSrc}" width="250" height="250" />
        <p style="font-size:12px;color:#555">Escaneie e peça direto pela mesa</p>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  };

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

  // Leitor de código de barras digita os dígitos do código impresso na comanda (ver
  // barcodeValue em printComanda.js) e manda Enter igual a um teclado — não precisa de
  // integração especial, só um input que reage ao Enter.
  const [codigoBusca, setCodigoBusca] = useState('');
  const [erroCodigoBusca, setErroCodigoBusca] = useState(false);
  const buscarPorCodigo = () => {
    const codigo = codigoBusca.trim();
    if (!codigo) return;
    const numero = parseInt(codigo, 10);
    const achada = [...comandas, ...comandasFechadas].find(
      (c) => (c.numero_comanda ?? c.id) === numero,
    );
    if (achada) {
      setComandaAtiva(achada.id);
      setCodigoBusca('');
      setErroCodigoBusca(false);
    } else {
      setErroCodigoBusca(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B]">
      {avisoConferencia && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-[#27272A] border border-[#FF441F]/30 text-[#FF441F] text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
          <Icon name="BellRing" size={14} /> {avisoConferencia}
        </div>
      )}
      <RestauranteHeader active="/restaurante/salao" title="Salão" onRefresh={carregar} />

      <div className="w-[90%] mx-auto p-4">
        <div className="flex justify-end mb-4">
          <button onClick={() => acaoMesa(async () => { const c = await abrirVendaBalcao(); setVendaBalcaoId(c.id); })}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
            <Icon name="ShoppingCart" size={15} /> Venda balcão
          </button>
        </div>

        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4">
          <p className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-2">Garçons online agora</p>
          <div className="flex flex-wrap gap-2">
            {garconsOnline.map((g) => (
              <span key={g.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {g.nome}
              </span>
            ))}
            {garconsOnline.length === 0 && <p className="text-xs text-[#A1A1AA]">Nenhum garçom online.</p>}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Carregando...</p>
        ) : (
          <>
            <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] mb-2">Mesas</p>
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
                        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] truncate">
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
                  {autoAtendimentoHabilitado && m.auto_atendimento_token && (
                    <button onClick={() => setMesaQrAberta(m)}
                      className="mt-1 flex items-center justify-center gap-1 text-[9px] font-bold text-pink-600 dark:text-pink-400 underline opacity-70 hover:opacity-100 w-full">
                      <Icon name="QrCode" size={10} /> QR da mesa
                    </button>
                  )}
                </div>
              ))}
              {mesas.length === 0 && <p className="col-span-full text-sm text-[#A1A1AA]">Nenhuma mesa cadastrada.</p>}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Icon name="ScanLine" size={16} className="text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
              <input
                value={codigoBusca}
                onChange={(e) => { setCodigoBusca(e.target.value); setErroCodigoBusca(false); }}
                onKeyDown={(e) => e.key === 'Enter' && buscarPorCodigo()}
                placeholder="Escaneie o código de barras da comanda ou digite o número"
                autoFocus
                className={`flex-1 border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] focus:outline-none ${erroCodigoBusca ? 'border-red-500 focus:border-red-500' : 'border-[#E4E4E7] dark:border-[#3F3F46] focus:border-[#FF441F]'}`}
              />
              {erroCodigoBusca && <span className="text-xs text-red-600 dark:text-red-400 shrink-0">Comanda não encontrada</span>}
            </div>

            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Comandas em aberto</p>
              <div className="flex gap-2 flex-wrap">
                <input value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} placeholder="Nome do cliente"
                  className="w-32 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#FF441F]" />
                <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)}
                  className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#FF441F]" />
                <input type="number" min="0" value={filtroValorMin} onChange={(e) => setFiltroValorMin(e.target.value)} placeholder="Valor mín."
                  className="w-24 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#FF441F]" />
                {filtroAtivo && (
                  <button onClick={() => { setFiltroNome(''); setFiltroData(''); setFiltroValorMin(''); }}
                    className="text-xs text-[#FF441F] font-semibold px-1">Limpar</button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {comandasFiltradas.map((c) => (
                <button key={c.id} onClick={() => setComandaAtiva(c.id)}
                  className="w-full bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3 flex justify-between items-center text-left">
                  <div>
                    <p className="text-sm font-medium text-[#18181B] dark:text-[#F4F4F5]">
                      #{c.numero_comanda ?? c.id}{c.mesas ? ` — Mesa ${c.mesas.numero}` : ''} — {c.cliente_mesa_nome}
                    </p>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      {c.garcons?.nome ? `Garçom: ${c.garcons.nome}` : c.aberto_por_nome ? `Caixa: ${c.aberto_por_nome}` : 'Garçom: —'}
                      {' · '}{c.status === 'aberta' ? 'Em aberto' : 'Aguardando pagamento'}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(c.total)}</p>
                </button>
              ))}
              {comandasFiltradas.length === 0 && (
                <p className="text-sm text-[#A1A1AA]">{filtroAtivo ? 'Nenhuma comanda encontrada com esse filtro.' : 'Nenhuma comanda em aberto.'}</p>
              )}
            </div>

            {comandasFechadas.length > 0 && (
              <>
                <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] mb-2 mt-6">Comandas fechadas hoje</p>
                <div className="space-y-2">
                  {comandasFechadasFiltradas.map((c) => (
                    <button key={c.id} onClick={() => setComandaAtiva(c.id)}
                      className="w-full bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3 flex justify-between items-center text-left opacity-80">
                      <div>
                        <p className="text-sm font-medium text-[#18181B] dark:text-[#F4F4F5]">
                          #{c.numero_comanda ?? c.id}{c.mesas ? ` — Mesa ${c.mesas.numero}` : ''} — {c.cliente_mesa_nome}
                        </p>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                          {c.garcons?.nome ? `Garçom: ${c.garcons.nome}` : c.aberto_por_nome ? `Caixa: ${c.aberto_por_nome}` : 'Garçom: —'}
                          {' · '}Paga
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(c.total)}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {erro && <p className="text-xs text-red-600 dark:text-red-400 mt-3">{erro}</p>}
      </div>

      <button
        onClick={() => setMesaParaAbrir(null)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-zinc-800 text-white shadow-lg flex items-center justify-center"
        title="Abrir comanda avulsa"
      >
        <Icon name="Plus" size={24} />
      </button>

      {comandaAtiva && (
        <ComandaModal comandaId={comandaAtiva} mesas={mesas} comandas={comandas} onFechar={() => setComandaAtiva(null)} onMudou={carregar} />
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

      {mesaQrAberta && (() => {
        const urls = getAutoAtendimentoUrls(mesaQrAberta.auto_atendimento_token);
        const urlQr = qrModoGrid === 'local' && urls.lan ? urls.lan : urls.principal;
        const imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(urlQr)}`;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-[#27272A] rounded-2xl p-5 w-full max-w-xs flex flex-col items-center gap-2">
              <p className="font-bold text-[#18181B] dark:text-[#F4F4F5]">QR — Mesa {mesaQrAberta.numero}</p>
              {urls.lan && (
                <div className="flex gap-2">
                  <button onClick={() => setQrModoGrid('online')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold ${qrModoGrid === 'online' ? 'bg-pink-600 text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                    ONLINE
                  </button>
                  <button onClick={() => setQrModoGrid('local')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold ${qrModoGrid === 'local' ? 'bg-pink-600 text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                    LOCAL
                  </button>
                </div>
              )}
              <img src={imgSrc} alt="QR da mesa" width={200} height={200} />
              <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] text-center">Cole essa mesa/imprima e deixe fixo — o cliente escaneia quando o garçom já tiver aberto a comanda</p>
              <div className="flex gap-2 w-full mt-1">
                <button onClick={() => copiarLinkGrid(urlQr)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5]">
                  <Icon name={linkCopiadoGrid ? 'Check' : 'Copy'} size={12} /> {linkCopiadoGrid ? 'Copiado!' : 'Copiar link'}
                </button>
                <button onClick={() => imprimirQrMesa(mesaQrAberta.numero, urlQr, imgSrc)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold bg-pink-600 text-white">
                  <Icon name="Printer" size={12} /> Imprimir
                </button>
              </div>
              <button onClick={() => setMesaQrAberta(null)} className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">Fechar</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RestauranteSalao;
