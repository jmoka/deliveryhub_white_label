import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  login, logout, getGarcomToken, setGarcomToken, clearGarcomToken, getMe,
  getMesas, getProdutos, getCombos, getMinhasComandas, getComanda, getItensProntos, getFilaCozinha,
  abrirComanda, adicionarItens, editarItem, removerItem, enviarItens, fecharComanda,
  registrarPagamento, editarPagamento, removerPagamento, editarClienteComanda,
  confirmarEntregaItem, naoEntregarItem, indoBuscarItem, marcarConferenciaVista, dividirComanda, editarObservacaoItem,
} from '../../services/garcomService';
import { printTicketSetor } from '../../utils/printComanda';
import { agruparItensComanda, quantidadeGrupoCombo } from '../../utils/agruparItensComanda';
import { getAcompanharUrls, getAutoAtendimentoUrls } from '../../utils/mesaAcompanharUrl';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';
import { formatDuracao } from '../../utils/formatDuracao';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import Icon from '../../components/AppIcon';
import TempoMedioTile from '../../components/TempoMedioTile';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Badge do garçom some quando ele clica "OK, entendi" no alerta (conferencia_vista_garcom_em) —
// campo separado do que o caixa usa (conferencia_solicitada_em só limpa ao imprimir de
// verdade), senão o garçom dando OK apagaria o aviso do caixa também.
const conferenciaPendente = (comanda) =>
  !!comanda?.conferencia_solicitada_em &&
  (!comanda.conferencia_vista_garcom_em || new Date(comanda.conferencia_vista_garcom_em) < new Date(comanda.conferencia_solicitada_em));
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };

const MESA_STATUS_COR = {
  livre: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  ocupada: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  aguardando_pagamento: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  bloqueada: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600',
};
const MESA_STATUS_LABEL = { livre: 'Livre', ocupada: 'Ocupada', aguardando_pagamento: 'Aguard. pagamento', bloqueada: 'Bloqueada' };
const MESA_OCUPADA_OUTRO_COR = 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';

const responsavelMesa = (comanda) =>
  comanda?.garcons?.nome ?? (comanda?.aberto_por_nome ? `Caixa: ${comanda.aberto_por_nome}` : null);

const GarcomLogin = ({ loginKey, onLogin }) => {
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const { token } = await login(loginKey, password);
      setGarcomToken(token);
      onLogin();
    } catch (err) {
      setErro(err.message ?? 'Senha inválida.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-6 w-full max-w-sm shadow-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#FF441F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="UtensilsCrossed" size={28} className="text-[#FF441F]" />
          </div>
          <h1 className="text-lg font-black text-[#18181B] dark:text-[#F4F4F5]">Portal do Garçom</h1>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">Digite sua senha pra entrar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoFocus
            required
            className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#FF441F]"
          />
          {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#FF441F] text-white font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 text-sm">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

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
      const comanda = await abrirComanda({ mesa_id: mesa?.id ?? null, cliente_nome: nome.trim(), cliente_telefone: telefone.trim() });
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
            className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone do cliente" required
            className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
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

const EditarClienteModal = ({ comanda, onFechar, onEditado }) => {
  const [nome, setNome] = useState(comanda.cliente_mesa_nome ?? '');
  const [telefone, setTelefone] = useState(comanda.cliente_mesa_telefone ?? '');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await editarClienteComanda(comanda.id, nome.trim(), telefone.trim());
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
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-4">Corrige nome ou telefone digitados errado na abertura.</p>
        <form onSubmit={submit} className="space-y-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" required
            className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone do cliente" required
            className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
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

const FecharComandaModal = ({ comanda, onFechar, onFechada }) => {
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const confirmar = async () => {
    setErro(null);
    setSalvando(true);
    try {
      await fecharComanda(comanda.id);
      onFechada();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível fechar a comanda.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">Fechar comanda</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-4">
          A mesa fica bloqueada aguardando pagamento — quem finaliza e emite o recibo é o caixa.
        </p>
        {erro && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{erro}</p>}
        <div className="flex gap-2">
          <button onClick={onFechar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
            Voltar
          </button>
          <button onClick={confirmar} disabled={salvando}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
            {salvando ? 'Fechando...' : 'Fechar comanda'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickAddModal = ({ produto, onFechar, onConfirmar }) => {
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
          className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm mt-1 mb-4 resize-none" />

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

  const categorias = ['todas', ...new Set(produtos.map((p) => p.category_name ?? 'Outros'))];
  const filtrados = produtos.filter((p) => {
    const bateBusca = p.name.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = categoria === 'todas' || (p.category_name ?? 'Outros') === categoria;
    return bateBusca && bateCategoria;
  });

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#18181B] z-50 flex flex-col">
      <div className="p-4 border-b border-[#E4E4E7] dark:border-[#3F3F46] sticky top-0 bg-white dark:bg-[#27272A] max-w-2xl w-full mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onFechar} className="p-1 text-[#71717A] dark:text-[#A1A1AA]"><Icon name="ArrowLeft" size={20} /></button>
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Adicionar produto</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." autoFocus
              className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
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
                {p.preco_promo != null && (
                  <span className="line-through text-[#A1A1AA] mr-1">{fmt(p.price)}</span>
                )}
                {fmt(p.preco_promo ?? p.price)}
                {p.quantidade_estoque != null && <span className="text-[#A1A1AA]"> · estoque: {p.quantidade_estoque}</span>}
              </p>
              {p.tipo === 'combo' && p.description && (
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] italic mt-0.5">{p.description}</p>
              )}
            </div>
            <Icon name="Plus" size={18} className="text-[#FF441F] flex-shrink-0" />
          </button>
        ))}
        {filtrados.length === 0 && <p className="text-sm text-[#A1A1AA] text-center py-6">Nenhum produto encontrado.</p>}
      </div>

      {produtoAtivo && (
        <QuickAddModal
          produto={produtoAtivo}
          onFechar={() => setProdutoAtivo(null)}
          onConfirmar={async (item) => { await onAdicionado(item); setProdutoAtivo(null); }}
        />
      )}
    </div>
  );
};

const PagamentoParcial = ({ comanda, onRegistrado, podePagamentoParcial, faltaPagar }) => {
  const [valor, setValor] = useState('');
  const [forma, setForma] = useState('pix');
  const [valorRecebido, setValorRecebido] = useState('');
  const [trocoViaPix, setTrocoViaPix] = useState(false);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [valorEdicao, setValorEdicao] = useState('');
  const [formaEdicao, setFormaEdicao] = useState('pix');
  const emAndamentoRef = useRef(false);

  const saldo = comanda.saldo?.saldo ?? 0;
  // Falta pagar já soma gorjeta/acréscimo (calculado pelo componente pai) — o campo de
  // lançar pagamento fica disponível até isso zerar, não só o saldo dos itens, senão
  // esconde a possibilidade de cobrar a gorjeta assim que os produtos já foram pagos.
  const faltaPagarEfetivo = faltaPagar ?? saldo;
  const troco = forma === 'cash' && valorRecebido ? Number(valorRecebido) - Number(valor || 0) : null;
  // Comanda paga/cancelada não deixa mais mexer nos pagamentos, mesma regra de editar itens.
  const podeMexer = ['aberta', 'fechada_garcom'].includes(comanda.status);
  const isCartao = forma === 'credit_card' || forma === 'debit_card';
  const taxaCartaoPercentual = comanda.taxa_cartao_percentual ?? 0;
  const taxaCartaoValorParcial = isCartao ? parseFloat((Number(valor || 0) * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;

  const registrar = async () => {
    // Guard síncrono — clique duplo rápido pode passar 2x antes do disabled={salvando}
    // re-renderizar, duplicando o lançamento (mesmo bug já visto no fechamento do dono).
    if (emAndamentoRef.current) return;
    const v = Number(valor);
    if (!v || v <= 0) return;
    if (forma === 'cash' && valorRecebido && Number(valorRecebido) < v) {
      setErro('Valor recebido não pode ser menor que o valor a pagar.');
      return;
    }
    emAndamentoRef.current = true;
    setErro(null);
    setSalvando(true);
    try {
      // Sem valor recebido digitado (pagamento exato, sem troco), manda o próprio valor
      // pago — senão o backend não credita a venda no caixa físico (fica só o fundo).
      await registrarPagamento(comanda.id, v, forma, forma === 'cash' ? Number(valorRecebido || v) : undefined, forma === 'cash' && troco > 0 ? trocoViaPix : undefined);
      setValor('');
      setValorRecebido('');
      setTrocoViaPix(false);
      await onRegistrado();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível registrar o pagamento.');
    } finally {
      emAndamentoRef.current = false;
      setSalvando(false);
    }
  };

  const iniciarEdicao = (p) => {
    setEditandoId(p.id);
    setValorEdicao(String(p.valor));
    setFormaEdicao(p.forma_pagamento);
  };

  const salvarEdicao = async () => {
    const v = Number(valorEdicao);
    if (!v || v <= 0) return;
    setErro(null);
    setSalvando(true);
    try {
      await editarPagamento(comanda.id, editandoId, v, formaEdicao);
      setEditandoId(null);
      await onRegistrado();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível editar o pagamento.');
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (p) => {
    if (!window.confirm('Remover este pagamento?')) return;
    setErro(null);
    try {
      await removerPagamento(comanda.id, p.id);
      await onRegistrado();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível remover o pagamento.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3 space-y-2">
      <div className="flex justify-between items-center text-base">
        <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium">Saldo devedor</span>
        <strong className={`text-lg ${saldo > 0.01 ? 'text-[#FF441F]' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt(saldo)}</strong>
      </div>
      {(comanda.pagamentos ?? []).length > 0 && (
        <div className="space-y-1">
          {comanda.pagamentos.map((p) => (
            editandoId === p.id ? (
              <div key={p.id} className="flex items-center gap-1.5 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-lg p-1.5">
                <input type="number" value={valorEdicao} onChange={(e) => setValorEdicao(e.target.value)}
                  className="w-16 bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg px-1.5 py-1 text-xs" />
                <select value={formaEdicao} onChange={(e) => setFormaEdicao(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg px-1.5 py-1 text-xs">
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de crédito</option>
                  <option value="debit_card">Cartão de débito</option>
                  <option value="cash">Dinheiro</option>
                </select>
                <button onClick={salvarEdicao} disabled={!valorEdicao || salvando}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 disabled:opacity-40 flex-shrink-0">Salvar</button>
                <button onClick={() => setEditandoId(null)} className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0">Cancelar</button>
              </div>
            ) : (
              <div key={p.id}>
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] flex justify-between items-center gap-2">
                  <span>
                    {PAGAMENTO_LABEL[p.forma_pagamento] ?? p.forma_pagamento} ({p.origem === 'garcom' ? 'garçom' : 'caixa'})
                    {p.taxa_cartao_valor > 0 && <span className="text-[#FF441F]"> + taxa {fmt(p.taxa_cartao_valor)}</span>}
                  </span>
                  <span className="flex items-center gap-1.5 flex-shrink-0 font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    {fmt(p.valor + (p.taxa_cartao_valor || 0))}
                    {podeMexer && podePagamentoParcial && p.origem === 'garcom' && (
                      <>
                        <button onClick={() => iniciarEdicao(p)} className="w-7 h-7 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-100 flex-shrink-0">
                          <Icon name="Pencil" size={14} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => remover(p)} className="w-7 h-7 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/60 flex-shrink-0">
                          <Icon name="X" size={15} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                  </span>
                </p>
                {p.forma_pagamento === 'cash' && p.valor_recebido != null && (
                  <p className="text-xs text-[#A1A1AA] pl-0.5">
                    Dinheiro: {fmt(p.valor_recebido)} · Troco{p.troco_via_pix ? ' (Pix)' : ''}: {fmt(p.troco || 0)} · Venda: {fmt(p.valor)}
                  </p>
                )}
              </div>
            )
          ))}
        </div>
      )}
      {faltaPagarEfetivo > 0.01 && podePagamentoParcial && (
        <div className="space-y-1.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor"
              className="w-20 bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg px-2 py-1.5 text-xs" />
            <select value={forma} onChange={(e) => setForma(e.target.value)}
              className="flex-1 min-w-[100px] bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg px-2 py-1.5 text-xs">
              <option value="pix">PIX</option>
              <option value="credit_card">Cartão de crédito</option>
              <option value="debit_card">Cartão de débito</option>
              <option value="cash">Dinheiro</option>
            </select>
          </div>
          {taxaCartaoValorParcial > 0 && (
            <p className="text-xs text-[#FF441F]">
              + taxa cartão ({taxaCartaoPercentual}%): {fmt(taxaCartaoValorParcial)} — cobrar {fmt(Number(valor || 0) + taxaCartaoValorParcial)}
            </p>
          )}
          {forma === 'cash' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input type="number" value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)}
                  placeholder="Informe o valor pago pelo cliente"
                  className="flex-1 bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border-2 border-red-500 dark:border-red-500 rounded-lg px-2 py-1.5 text-xs" />
                {troco !== null && (
                  <span className={`text-xs font-bold flex-shrink-0 ${troco < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    Troco: {fmt(Math.max(troco, 0))}
                  </span>
                )}
              </div>
              {troco > 0 && (
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={trocoViaPix} onChange={(e) => setTrocoViaPix(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-[#FF441F]" />
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Troco via Pix (não sai do caixa em espécie)</span>
                </label>
              )}
            </div>
          )}
          <button onClick={registrar} disabled={salvando || !valor}
            className="w-full px-2.5 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-bold disabled:opacity-40">
            Pagar
          </button>
        </div>
      )}
      {faltaPagarEfetivo > 0.01 && !podePagamentoParcial && (
        <p className="text-xs text-[#A1A1AA] pt-1">Você não tem permissão para registrar pagamento parcial.</p>
      )}
      {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
    </div>
  );
};

// Separar comanda: garçom escolhe quais itens viram uma comanda avulsa nova, separada
// da original — pra quando um componente da mesa quer pagar só o que ele consumiu.
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
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
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
              <span className="flex-1 min-w-0 text-sm text-[#18181B] dark:text-[#F4F4F5] truncate">{item.quantity}x {item.products?.name}</span>
              <span className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex-shrink-0">{fmt(item.quantity * item.unit_price)}</span>
            </label>
          ))}
        </div>

        {todosSelecionados && (
          <p className="text-xs text-[#FF441F] font-medium mt-2">Desmarque ao menos 1 item pra separar só parte da comanda.</p>
        )}

        <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-3 pt-3 space-y-2">
          <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Nome do cliente da nova comanda *</label>
          <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente"
            className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="Telefone (opcional)"
            className="w-full bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
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

const ComandaDetalhe = ({ comandaId, onVoltar, podePagamentoParcial }) => {
  const [comanda, setComanda] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mostrarFechar, setMostrarFechar] = useState(false);
  const [erro, setErro] = useState(null);
  const [mostrarQr, setMostrarQr] = useState(false);
  const [qrModo, setQrModo] = useState('online'); // 'online' | 'local'
  const [linkCopiado, setLinkCopiado] = useState(null); // 'acompanhar' | 'auto' | null
  const [mostrarQrAuto, setMostrarQrAuto] = useState(false);
  const { autoAtendimentoHabilitado } = useModulosEmpresa();
  const [mostrarEditarCliente, setMostrarEditarCliente] = useState(false);
  const [observacaoEditandoId, setObservacaoEditandoId] = useState(null);
  const [observacaoInput, setObservacaoInput] = useState('');
  const [mostrarDividir, setMostrarDividir] = useState(false);
  const [dividindo, setDividindo] = useState(false);

  const carregar = useCallback(async () => {
    const [c, p, combos] = await Promise.all([getComanda(comandaId), getProdutos(), getCombos()]);
    setComanda(c);
    // Combo entra na mesma lista do picker, numa categoria própria — reusa toda a UI
    // de busca/categoria/quantidade que já existe pra produto normal.
    setProdutos([
      ...p,
      ...(combos ?? []).map((c2) => ({ ...c2, tipo: 'combo', category_name: 'Combos' })),
    ]);
  }, [comandaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const adicionarProduto = async (item) => {
    setErro(null);
    try {
      await adicionarItens(comandaId, [item]);
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível adicionar o item.');
    }
  };

  const alterarQuantidade = async (item, delta) => {
    const novaQtd = item.quantity + delta;
    if (novaQtd < 1) return;
    setErro(null);
    try {
      await editarItem(comandaId, item.id, { quantity: novaQtd });
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível alterar a quantidade.');
    }
  };

  const abrirEdicaoObservacao = (item) => {
    setObservacaoEditandoId(item.id);
    setObservacaoInput(item.observacao ?? '');
  };

  const salvarObservacao = async (item) => {
    setErro(null);
    try {
      await editarObservacaoItem(comandaId, item.id, observacaoInput);
      setObservacaoEditandoId(null);
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível salvar a observação.');
    }
  };

  const removerItemComanda = async (item) => {
    if (!window.confirm(`Remover ${item.products?.name}?`)) return;
    setErro(null);
    try {
      await removerItem(comandaId, item.id);
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível remover o item.');
    }
  };

  const dividirComandaAtual = async (itemIds, clienteNome, clienteTelefone) => {
    setDividindo(true);
    setErro(null);
    try {
      await dividirComanda(comandaId, itemIds, clienteNome, clienteTelefone);
      setMostrarDividir(false);
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível separar a comanda.');
    } finally {
      setDividindo(false);
    }
  };

  const confirmarEntrega = async (item) => {
    setErro(null);
    try {
      await confirmarEntregaItem(comandaId, item.id);
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível confirmar a entrega.');
    }
  };

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

  const naoEntregou = async (item) => {
    if (!window.confirm(`Confirma que NÃO entregou ${item.products?.name}? O item volta pra fila de preparo.`)) return;
    setErro(null);
    try {
      await naoEntregarItem(comandaId, item.id);
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível registrar a não entrega.');
    }
  };

  const enviar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      const { grupos } = await enviarItens(comandaId);
      grupos.forEach((grupo) => printTicketSetor(grupo.itens, comanda, grupo.setor));
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível enviar os itens.');
    } finally {
      setEnviando(false);
    }
  };

  const renderItemCard = (item, { ocultarComboLabel = false } = {}) => (
    <div key={item.id} className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#F4F4F5] dark:bg-[#3F3F46] flex-shrink-0">
            {item.products?.image_url
              ? <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={18} className="text-[#A1A1AA]" /></div>}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{item.quantity}x {item.products?.name}</p>
            <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">
              {fmt(item.unit_price)} un.
              {item.combo_nome && !ocultarComboLabel && <span className="text-[#FF441F]"> · combo: {item.combo_nome}</span>}
            </p>
          </div>
        </div>
        {item.status === 'pendente' ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => alterarQuantidade(item, -1)} className="w-8 h-8 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-base font-bold text-[#27272A] dark:text-[#F4F4F5]">−</button>
            <button onClick={() => alterarQuantidade(item, 1)} className="w-8 h-8 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-base font-bold text-[#27272A] dark:text-[#F4F4F5]">+</button>
            <button onClick={() => removerItemComanda(item)} className="w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 flex items-center justify-center">
              <Icon name="X" size={14} />
            </button>
          </div>
        ) : (item.status === 'preparando' || item.status === 'pronto') && !item.entregue_garcom ? (
          <span className="text-xs px-2.5 py-1.5 rounded-full font-bold flex-shrink-0 bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">
            {item.status === 'pronto' ? 'Pronto' : 'Em preparo'}
          </span>
        ) : (
          <span className={`text-xs px-2.5 py-1.5 rounded-full font-bold flex-shrink-0 ${
            item.status === 'enviado' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
          }`}>
            {item.status === 'enviado' ? 'Enviado' : 'Entregue'}
          </span>
        )}
      </div>

      {(item.status === 'preparando' || item.status === 'pronto') && !item.entregue_garcom && (
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <button onClick={() => confirmarEntrega(item)}
            className="text-sm px-2.5 py-2.5 rounded-lg font-bold bg-[#FF441F] text-white flex items-center justify-center gap-1">
            <Icon name="Check" size={14} /> Entregar
          </button>
          <button onClick={() => naoEntregou(item)} disabled={item.status !== 'pronto'}
            className="text-sm px-2.5 py-2.5 rounded-lg font-bold border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center gap-1 disabled:opacity-30">
            <Icon name="X" size={14} /> Não entreguei
          </button>
        </div>
      )}

      {observacaoEditandoId === item.id ? (
        <div className="flex items-center gap-1.5 mt-2">
          <input value={observacaoInput} onChange={(e) => setObservacaoInput(e.target.value)} autoFocus
            placeholder="Observação..." className="flex-1 text-xs bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#FF441F]" />
          <button onClick={() => salvarObservacao(item)} className="text-xs font-bold text-[#FF441F]">Salvar</button>
          <button onClick={() => setObservacaoEditandoId(null)} className="text-xs text-[#A1A1AA]">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => abrirEdicaoObservacao(item)}
          className="flex items-center gap-1 mt-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded px-1.5 py-0.5">
          <Icon name="MessageSquare" size={11} />
          {item.observacao || 'Adicionar observação'}
        </button>
      )}
    </div>
  );

  const gruposItens = agruparItensComanda(comanda?.itens);

  if (!comanda) return <div className="p-6 text-sm text-[#71717A] dark:text-[#A1A1AA]">Carregando...</div>;

  const total = (comanda.itens ?? []).reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const temPendente = (comanda.itens ?? []).some((i) => i.status === 'pendente');
  const temEntregaPendente = (comanda.itens ?? []).some((i) => (i.status === 'preparando' || i.status === 'pronto') && !i.entregue_garcom);
  const fechada = comanda.status === 'fechada_garcom';

  // Gorjeta só vira valor definitivo quando o caixa fecha a conta (orders.gorjeta_valor).
  // Antes disso é só estimativa (gorjeta_sugestao) — não soma junto do saldo real do
  // backend (que já inclui a gorjeta confirmada + taxa de cartão), senão duplica.
  const gorjetaConfirmada = comanda.gorjeta_valor != null;
  const gorjetaExibida = gorjetaConfirmada ? comanda.gorjeta_valor : (comanda.gorjeta_sugestao?.valor_sugerido ?? 0);
  const totalComGorjeta = (comanda.saldo?.total ?? total) + (gorjetaConfirmada ? 0 : gorjetaExibida);
  // Falta pagar já soma a gorjeta (estimada ou confirmada) — garçom só fecha depois de
  // cobrar tudo do cliente na mesa, dinheiro/pix/cartão já lançados como pagamento parcial.
  const faltaPagar = (comanda.saldo?.saldo ?? total) + (gorjetaConfirmada ? 0 : gorjetaExibida);
  const totalTaxaCartao = (comanda.pagamentos ?? []).reduce((acc, p) => acc + (p.taxa_cartao_valor ?? 0), 0);
  const pagamentosDinheiro = (comanda.pagamentos ?? []).filter((p) => p.forma_pagamento === 'cash' && p.valor_recebido != null);
  const totalRecebidoDinheiro = pagamentosDinheiro.reduce((acc, p) => acc + Number(p.valor_recebido), 0);
  const totalTrocoEspecie = pagamentosDinheiro.reduce((acc, p) => acc + (p.troco_via_pix ? 0 : Number(p.troco || 0)), 0);
  const totalTrocoPix = pagamentosDinheiro.reduce((acc, p) => acc + (p.troco_via_pix ? Number(p.troco || 0) : 0), 0);

  return (
    <div className={`min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] ${!fechada ? 'pb-44' : 'pb-6'}`}>
      <div className="bg-white dark:bg-[#27272A] border-b border-[#E4E4E7] dark:border-[#3F3F46] p-4 sticky top-0 z-10">
        <button
          onClick={() => {
            if (temEntregaPendente) { window.alert('Confirme a entrega dos itens pendentes antes de voltar.'); return; }
            onVoltar();
          }}
          className="flex items-center gap-1 text-sm text-[#71717A] dark:text-[#A1A1AA] mb-2">
          <Icon name="ArrowLeft" size={16} /> Voltar
        </button>
        <h1 className="text-xl font-black text-[#18181B] dark:text-[#F4F4F5]">
          #{comanda.numero_comanda ?? comanda.id}{comanda.mesa_id ? ` — Mesa ${comanda.mesas?.numero ?? comanda.mesa_id}` : ''}
        </h1>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-[#71717A] dark:text-[#A1A1AA]">{comanda.cliente_mesa_nome} · {comanda.cliente_mesa_telefone}</p>
          <button onClick={() => setMostrarEditarCliente(true)} className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#FF441F] flex-shrink-0" title="Editar dados do cliente">
            <Icon name="Pencil" size={14} />
          </button>
        </div>
        {fechada && (
          <p className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-2 py-1 mt-2 inline-block">
            Fechada — aguardando pagamento no caixa
          </p>
        )}
        {comanda.tracking_token && (
          <div className="mt-2">
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
                  <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-3 inline-flex flex-col items-center gap-1">
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
          <div className="mt-2">
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
                  <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">Cliente escaneia e faz o pedido direto</p>
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
      </div>

      <div className="p-4 space-y-2">
        {gruposItens.map((grupo, gi) => grupo.tipo === 'combo' ? (
          <div key={`combo-${grupo.nome}-${gi}`} className="rounded-xl border-2 border-[#FF441F]/30 dark:border-[#FF441F]/40 overflow-hidden">
            <div className="bg-[#FF441F]/10 px-3 py-1.5 flex items-center gap-1.5">
              <Icon name="Package" size={14} className="text-[#FF441F]" />
              <span className="text-xs font-bold text-[#FF441F]">{quantidadeGrupoCombo(grupo)}x {grupo.nome}</span>
            </div>
            <div className="p-2 space-y-2 bg-[#F4F4F5]/50 dark:bg-[#18181B]/40">
              {grupo.itens.map((item) => renderItemCard(item, { ocultarComboLabel: true }))}
            </div>
          </div>
        ) : renderItemCard(grupo.item))}
        {(comanda.itens ?? []).length === 0 && (
          <p className="text-sm text-[#A1A1AA] text-center py-6">Nenhum item ainda.</p>
        )}
        {!fechada && (comanda.itens ?? []).length > 1 && (
          <button onClick={() => setMostrarDividir(true)}
            className="w-full py-2.5 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-sm font-bold text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center gap-2">
            <Icon name="Scissors" size={16} /> Separar comanda
          </button>
        )}
      </div>

      <div className="px-4 pb-4">
        <PagamentoParcial comanda={comanda} onRegistrado={carregar} podePagamentoParcial={podePagamentoParcial} faltaPagar={faltaPagar} />
      </div>

      {/* Resumo financeiro fica no fluxo normal da página (não fixo) — com desconto/acréscimo/
          taxa de cartão/gorjeta ficou grande demais pra caber num rodapé fixo sem cobrir os
          lançamentos e travar o scroll (o pb-24 do container não acompanhava a altura real). */}
      <div className="px-4 pb-4">
        {(() => {
          return (
            <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-3 py-2 space-y-1 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Valor da comanda</span>
                <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(total)}</span>
              </div>
              {comanda.desconto_valor > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Desconto</span>
                  <span className="text-emerald-700 dark:text-emerald-400">- {fmt(comanda.desconto_valor)}</span>
                </div>
              )}
              {comanda.acrescimo_valor > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Acréscimo</span>
                  <span className="text-[#18181B] dark:text-[#F4F4F5]">+ {fmt(comanda.acrescimo_valor)}</span>
                </div>
              )}
              {totalTaxaCartao > 0.001 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Taxa cartão</span>
                  <span className="text-[#18181B] dark:text-[#F4F4F5]">+ {fmt(totalTaxaCartao)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Gorjeta{gorjetaConfirmada ? '' : ' (estimada)'}</span>
                <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(gorjetaExibida)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] pt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
                <span>Total (comanda + gorjeta)</span>
                <span>{fmt(totalComGorjeta)}</span>
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
                    <span>Falta pagar (com gorjeta)</span>
                    <span>{fmt(faltaPagar)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {!fechada && (
        <div className="p-4 bg-white dark:bg-[#27272A] border-t border-[#E4E4E7] dark:border-[#3F3F46] fixed bottom-0 left-0 right-0">
          <button onClick={() => setMostrarPicker(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-2 border-2 border-dashed border-[#FF441F]/40 rounded-xl text-sm font-bold text-[#FF441F]">
            <Icon name="Plus" size={18} /> Adicionar produto
          </button>
          {erro && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{erro}</p>}
          {faltaPagar > 0.01 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-2 py-1.5 mb-2">
              Falta {fmt(faltaPagar)} (com gorjeta) — lance os pagamentos até zerar pra poder fechar.
            </p>
          )}
          {faltaPagar <= 0.01 && temEntregaPendente && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-2 py-1.5 mb-2">
              Tem item pronto sem confirmar entrega — toque em "Entregar" nos itens acima pra poder fechar.
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={enviar} disabled={!temPendente || enviando}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#FF441F] text-[#FF441F] disabled:opacity-40">
              {enviando ? 'Enviando...' : 'Enviar novos itens'}
            </button>
            <button onClick={() => setMostrarFechar(true)} disabled={(comanda.itens ?? []).length === 0 || faltaPagar > 0.01 || temEntregaPendente}
              title={faltaPagar > 0.01 ? 'Registre os pagamentos até zerar (com gorjeta) pra fechar' : temEntregaPendente ? 'Confirme a entrega dos itens pendentes pra poder fechar' : undefined}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] disabled:opacity-40">
              Fechar comanda
            </button>
          </div>
        </div>
      )}

      {mostrarEditarCliente && (
        <EditarClienteModal comanda={comanda} onFechar={() => setMostrarEditarCliente(false)} onEditado={carregar} />
      )}

      {mostrarFechar && (
        <FecharComandaModal comanda={comanda} onFechar={() => setMostrarFechar(false)} onFechada={() => { setMostrarFechar(false); onVoltar(); }} />
      )}

      {mostrarPicker && (
        <ProdutoPickerModal
          produtos={produtos}
          onFechar={() => setMostrarPicker(false)}
          onAdicionado={adicionarProduto}
        />
      )}

      {mostrarDividir && (
        <DividirComandaModal
          itens={comanda.itens ?? []}
          onFechar={() => setMostrarDividir(false)}
          onConfirmar={dividirComandaAtual}
          salvando={dividindo}
        />
      )}
    </div>
  );
};

const RESTAURANTE_FECHADO_MSG = 'Restaurante fechado. Aguarde o caixa ser aberto para entrar.';

const RestauranteFechado = () => (
  <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center p-4">
    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-6 w-full max-w-sm shadow-lg text-center">
      <div className="w-14 h-14 bg-red-100 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Icon name="Lock" size={28} className="text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-lg font-black text-[#18181B] dark:text-[#F4F4F5]">Restaurante fechado</h1>
      <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">Aguarde o caixa ser aberto para acessar o salão.</p>
      <button onClick={() => window.location.reload()}
        className="w-full mt-4 py-3 bg-[#FF441F] text-white font-bold rounded-xl hover:bg-[#E63A19] text-sm">
        Tentar novamente
      </button>
      <button onClick={async () => { await logout(); clearGarcomToken(); window.location.reload(); }}
        className="w-full mt-2 py-2.5 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-red-600 dark:hover:text-red-400">
        Sair
      </button>
    </div>
  </div>
);

// Fila de preparo do restaurante inteiro (não só as comandas do garçom logado) — pra
// ele responder o cliente presencial "quantos faltam antes do meu" e "quanto tempo
// em média demora", sem precisar ir até a cozinha.
const FilaCozinha = ({ itens, tempoMedioEsperaSegundos, tempoMedioPreparoSegundos, tempoMedioGeralSegundos }) => {
  const now = useNowTick();
  const preparando = itens.filter((i) => i.status === 'preparando');
  const aguardando = itens.filter((i) => i.status === 'enviado');

  const linha = (item, posicao, desde) => (
    <div key={item.item_id} className="w-full bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-[#18181B] dark:text-[#F4F4F5]">{posicao}º — {item.quantity}x {item.product_name}</p>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          {item.mesa ?? `Comanda #${item.numero_comanda}`}{item.cliente_mesa_nome ? ` — ${item.cliente_mesa_nome}` : ''}
        </p>
      </div>
      {desde && <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{formatDuracao(now - new Date(desde).getTime())}</p>}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <TempoMedioTile label="Espera média" segundos={tempoMedioEsperaSegundos} />
        <TempoMedioTile label="Preparo médio" segundos={tempoMedioPreparoSegundos} />
        <TempoMedioTile label="Total médio" segundos={tempoMedioGeralSegundos} />
      </div>

      <div>
        <p className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] mb-2">EM PREPARO ({preparando.length})</p>
        <div className="space-y-2">
          {preparando.map((item, idx) => linha(item, idx + 1, item.preparando_em))}
          {preparando.length === 0 && <p className="text-sm text-[#A1A1AA] text-center py-3">Nada em preparo agora.</p>}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] mb-2">AGUARDANDO ({aguardando.length})</p>
        <div className="space-y-2">
          {aguardando.map((item, idx) => linha(item, idx + 1, null))}
          {aguardando.length === 0 && <p className="text-sm text-[#A1A1AA] text-center py-3">Nada aguardando.</p>}
        </div>
      </div>
    </div>
  );
};

const GarcomHome = () => {
  const [meuId, setMeuId] = useState(null);
  const [permissoes, setPermissoes] = useState({});
  const [salaoModo, setSalaoModo] = useState('ambos');
  const [bloqueado, setBloqueado] = useState(false);
  const [mesas, setMesas] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [aba, setAba] = useState('mesas');
  const [filaCozinha, setFilaCozinha] = useState({
    itens: [], tempoMedioEsperaSegundos: null, tempoMedioPreparoSegundos: null, tempoMedioGeralSegundos: null,
  });
  const [mesaParaAbrir, setMesaParaAbrir] = useState(undefined);
  const [comandaAtivaId, setComandaAtivaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avisoPronto, setAvisoPronto] = useState(null);

  const tocarAlarmePronto = useNotificacaoSonora('motoboy');
  const idsProntosVistos = useRef(new Set());
  const tocarAlarmeConferencia = useNotificacaoSonora('pedido');
  const idsConferenciaVistos = useRef(new Set());
  const pedidosClienteVistos = useRef(new Map());
  const primeiraCargaPedidoCliente = useRef(true);

  useEffect(() => {
    getMe().then((m) => { setMeuId(m.id); setPermissoes(m.permissoes ?? {}); setSalaoModo(m.salaoModo ?? 'ambos'); }).catch((err) => {
      if (err.message === RESTAURANTE_FECHADO_MSG) setBloqueado(true);
    });
  }, []);

  const carregar = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([getMesas(), getMinhasComandas()]);
      setMesas(m);
      setComandas(c);

      // Cliente pediu conferência via QR — avisa aqui uma vez, até o caixa atender
      // (o campo só é limpo quando o caixa imprime a conferência de verdade).
      const solicitadas = c.filter((comanda) => comanda.conferencia_solicitada_em);
      const novas = solicitadas.filter((comanda) => !idsConferenciaVistos.current.has(comanda.id));
      idsConferenciaVistos.current = new Set(solicitadas.map((comanda) => comanda.id));
      if (novas.length > 0) {
        tocarAlarmeConferencia();
        const nc = novas[0];
        setAvisoPronto({ texto: `${nc.cliente_mesa_nome} pediu conferência — #${nc.numero_comanda ?? nc.id}`, comandaId: nc.id });
      }

      // Cliente do auto atendimento clicou "Solicitar pedido" — avisa o garçom
      // responsável pela mesa, igual já avisa quando um prato fica pronto. Compara
      // timestamp (não só id) porque o mesmo cliente pode solicitar várias vezes
      // durante a mesma comanda, cada solicitação precisa alertar de novo. Primeira
      // carga da tela só registra o estado atual, não dispara alarme retroativo.
      const comPedidoCliente = c.filter((comanda) => comanda.ultimo_pedido_cliente_em);
      if (primeiraCargaPedidoCliente.current) {
        pedidosClienteVistos.current = new Map(comPedidoCliente.map((comanda) => [comanda.id, comanda.ultimo_pedido_cliente_em]));
        primeiraCargaPedidoCliente.current = false;
      } else {
        const novosPedidos = comPedidoCliente.filter(
          (comanda) => pedidosClienteVistos.current.get(comanda.id) !== comanda.ultimo_pedido_cliente_em,
        );
        pedidosClienteVistos.current = new Map(comPedidoCliente.map((comanda) => [comanda.id, comanda.ultimo_pedido_cliente_em]));
        if (novosPedidos.length > 0) {
          tocarAlarmeConferencia();
          const np = novosPedidos[0];
          setAvisoPronto({ texto: `Novo pedido do cliente — Mesa/Comanda #${np.numero_comanda ?? np.id}` });
        }
      }
    } catch (err) {
      if (err.message === RESTAURANTE_FECHADO_MSG) setBloqueado(true);
      else if (!getGarcomToken()) window.location.reload();
    } finally {
      setLoading(false);
    }
  }, [tocarAlarmeConferencia]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { if (salaoModo === 'comandas') setAba('comandas'); }, [salaoModo]);

  // Sem push real — polling comparando quais itens "prontos" já vimos, igual à tela da
  // cozinha, e recarrega mesas/comandas junto (pega pedido de conferência do cliente).
  // Só alerta enquanto essa aba estiver aberta.
  useEffect(() => {
    if (bloqueado) return;
    const checar = async () => {
      try {
        const itens = await getItensProntos();
        const novos = itens.filter((i) => !idsProntosVistos.current.has(i.item_id));
        idsProntosVistos.current = new Set(itens.map((i) => i.item_id));
        if (novos.length > 0) {
          tocarAlarmePronto();
          const i = novos[0];
          const mesaLabel = i.mesa ?? `Comanda #${i.numero_comanda}`;
          setAvisoPronto({
            texto: `Seu pedido está pronto! Mesa: ${mesaLabel}${i.cliente ? ` · Cliente: ${i.cliente}` : ''} · Pedido: ${i.product_name}`,
            item: i,
          });
        }
      } catch {}
      try {
        setFilaCozinha(await getFilaCozinha());
      } catch {}
      carregar();
    };
    checar();
    const interval = setInterval(checar, 15000);
    return () => clearInterval(interval);
  }, [bloqueado, tocarAlarmePronto, carregar]);

  const clicarMesa = (mesa) => {
    if (mesa.status === 'livre') {
      if (salaoModo === 'comandas') return;
      setMesaParaAbrir(mesa);
      return;
    }
    if (mesa.comanda && mesa.comanda.garcom_id === meuId) { setComandaAtivaId(mesa.comanda.id); }
  };

  const handleIndoBuscar = async () => {
    const item = avisoPronto?.item;
    setAvisoPronto(null);
    if (!item) return;
    try { await indoBuscarItem(item.order_id, item.item_id); } catch {}
  };

  const handleJaEntreguei = async () => {
    const item = avisoPronto?.item;
    setAvisoPronto(null);
    if (!item) return;
    try { await confirmarEntregaItem(item.order_id, item.item_id); await carregar(); } catch {}
  };

  const handleOkAviso = async () => {
    const comandaId = avisoPronto?.comandaId;
    setAvisoPronto(null);
    if (!comandaId) return;
    try { await marcarConferenciaVista(comandaId); await carregar(); } catch {}
  };

  if (bloqueado) return <RestauranteFechado />;

  const avisoProntoToast = avisoPronto && (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <Icon name="BellRing" size={40} className="mx-auto text-[#FF441F] mb-3 animate-pulse" />
        <p className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5] mb-5">{avisoPronto.texto}</p>
        {avisoPronto.item ? (
          <div className="flex gap-2">
            <button onClick={handleIndoBuscar}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-[#FF441F] border border-[#FF441F]">
              Indo buscar
            </button>
            <button onClick={handleJaEntreguei}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F]">
              Já entreguei
            </button>
          </div>
        ) : (
          <button onClick={handleOkAviso}
            className="w-full py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F]">
            OK, entendi
          </button>
        )}
      </div>
    </div>
  );

  if (comandaAtivaId) {
    return (
      <>
        {avisoProntoToast}
        <ComandaDetalhe
          comandaId={comandaAtivaId}
          onVoltar={() => { setComandaAtivaId(null); carregar(); }}
          podePagamentoParcial={permissoes?.pagamento_parcial !== false}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] pb-6">
      {avisoProntoToast}
      <div className="bg-white dark:bg-[#27272A] border-b border-[#E4E4E7] dark:border-[#3F3F46] p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Salão</h1>
          <button onClick={async () => { await logout(); clearGarcomToken(); window.location.reload(); }}
            className="flex items-center gap-1 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-red-600 dark:hover:text-red-400 px-2 py-1">
            <Icon name="LogOut" size={14} /> Sair
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {salaoModo !== 'comandas' && (
            <button onClick={() => setAba('mesas')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${aba === 'mesas' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
              Mesas
            </button>
          )}
          <button onClick={() => setAba('comandas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${aba === 'comandas' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
            Minhas comandas ({comandas.length})
          </button>
          <button onClick={() => setAba('cozinha')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${aba === 'cozinha' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
            Cozinha
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-[#71717A] dark:text-[#A1A1AA]">Carregando...</div>
      ) : aba === 'mesas' ? (
        <div className="p-4 grid grid-cols-3 gap-3">
          {mesas.map((mesa) => {
            const minhaComanda = mesa.status !== 'livre' && mesa.comanda && mesa.comanda.garcom_id === meuId;
            const clicavel = (mesa.status === 'livre' && salaoModo !== 'comandas') || minhaComanda;
            const cor = mesa.status === 'ocupada' && mesa.comanda && !minhaComanda
              ? MESA_OCUPADA_OUTRO_COR
              : (MESA_STATUS_COR[mesa.status] ?? '');
            return (
              <button
                key={mesa.id}
                onClick={() => clicarMesa(mesa)}
                disabled={!clicavel}
                className={`rounded-xl border p-3 text-center ${cor} disabled:opacity-70`}
              >
                <p className="text-lg font-black">{mesa.numero}</p>
                <p className="text-[10px] font-medium">{MESA_STATUS_LABEL[mesa.status] ?? mesa.status}</p>
                {mesa.comanda && (
                  <>
                    <p className="text-[10px] truncate">{responsavelMesa(mesa.comanda) ?? '—'}</p>
                    <p className="text-[10px] truncate">{mesa.comanda.cliente_mesa_nome}</p>
                    {conferenciaPendente(mesa.comanda) && (
                      <p className="text-[9px] font-bold text-white bg-[#FF441F] rounded-full px-1.5 py-0.5 mt-1 inline-flex items-center gap-1">
                        <Icon name="BellRing" size={9} /> Conferência
                      </p>
                    )}
                  </>
                )}
              </button>
            );
          })}
          {mesas.length === 0 && <p className="col-span-3 text-sm text-[#A1A1AA] text-center py-6">Nenhuma mesa cadastrada.</p>}
        </div>
      ) : aba === 'cozinha' ? (
        <FilaCozinha
          itens={filaCozinha.itens}
          tempoMedioEsperaSegundos={filaCozinha.tempoMedioEsperaSegundos}
          tempoMedioPreparoSegundos={filaCozinha.tempoMedioPreparoSegundos}
          tempoMedioGeralSegundos={filaCozinha.tempoMedioGeralSegundos}
        />
      ) : (
        <div className="p-4 space-y-2">
          {comandas.map((c) => (
            <button key={c.id} onClick={() => setComandaAtivaId(c.id)}
              className="w-full bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3 flex justify-between items-center text-left">
              <div>
                <p className="text-sm font-medium text-[#18181B] dark:text-[#F4F4F5]">
                  #{c.numero_comanda ?? c.id}{c.mesa_id ? ` — Mesa ${c.mesa_id}` : ''} — {c.cliente_mesa_nome}
                </p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{c.status === 'aberta' ? 'Em aberto' : 'Aguardando pagamento'}</p>
                {conferenciaPendente(c) && (
                  <p className="text-[9px] font-bold text-white bg-[#FF441F] rounded-full px-1.5 py-0.5 mt-1 inline-flex items-center gap-1">
                    <Icon name="BellRing" size={9} /> Pediu conferência
                  </p>
                )}
              </div>
              <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(c.total)}</p>
            </button>
          ))}
          {comandas.length === 0 && <p className="text-sm text-[#A1A1AA] text-center py-6">Nenhuma comanda em aberto.</p>}
        </div>
      )}

      {salaoModo !== 'mesas' && (
        <button
          onClick={() => setMesaParaAbrir(null)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#FF441F] text-white shadow-lg flex items-center justify-center"
        >
          <Icon name="Plus" size={24} />
        </button>
      )}

      {mesaParaAbrir !== undefined && (
        <AbrirComandaModal
          mesa={mesaParaAbrir}
          onFechar={() => setMesaParaAbrir(undefined)}
          onAberta={(comanda) => { setMesaParaAbrir(undefined); setComandaAtivaId(comanda.id); }}
        />
      )}
    </div>
  );
};

const GarcomPortal = () => {
  const { loginKey } = useParams();
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    if (!getGarcomToken()) { setAuthed(false); return; }
    // Token salvo pode ser de outro garçom/restaurante (localStorage não é escopado por
    // loginKey) — valida antes de confiar, senão a tela trava vazia num token velho.
    getMe().then(() => setAuthed(true)).catch(() => { clearGarcomToken(); setAuthed(false); });
  }, []);

  if (authed === null) {
    return <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center text-sm text-[#71717A] dark:text-[#A1A1AA]">Carregando...</div>;
  }

  if (!authed) {
    return <GarcomLogin loginKey={loginKey} onLogin={() => setAuthed(true)} />;
  }

  return <GarcomHome />;
};

export default GarcomPortal;
