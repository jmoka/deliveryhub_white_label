import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes, criarCliente, atualizarCliente, getDetalheCliente } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const SORT_CAMPOS = [
  { id: 'nome', label: 'Nome' },
  { id: 'pedidos_count', label: 'Pedidos' },
  { id: 'total_gasto', label: 'Total gasto' },
  { id: 'ultimo_pedido', label: 'Último pedido' },
];

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtData = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';
const fmtDataHora = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_INFO = {
  pending:           { label: 'Pendente',          cor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  confirmed:         { label: 'Confirmado',         cor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  preparing:         { label: 'Em preparo',         cor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  ready:             { label: 'Pronto',             cor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  out_for_delivery:  { label: 'Saiu p/ entrega',    cor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  delivered:         { label: 'Entregue',           cor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
  canceled:          { label: 'Cancelado',          cor: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' },
  aberta:            { label: 'Comanda aberta',     cor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  fechada_garcom:    { label: 'Fechada p/ garçom',  cor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  paga:              { label: 'Paga',               cor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
};

/* ── Modal criar/editar ─────────────────────────────────────────── */
const Modal = ({ cliente, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:       cliente?.name       ?? '',
    email:      cliente?.email      ?? '',
    phone_e164: cliente?.phone_e164 ?? '',
    notes:      cliente?.notes      ?? '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      if (cliente) {
        await atualizarCliente(cliente.id, form);
      } else {
        await criarCliente(form);
      }
      onSave();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">{cliente ? 'Editar cliente' : 'Novo cliente'}</h3>
          <button onClick={onClose} className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]">
            <Icon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#27272A] dark:text-[#F4F4F5] mb-1">Nome *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#27272A] dark:text-[#F4F4F5] mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#27272A] dark:text-[#F4F4F5] mb-1">Telefone</label>
            <input
              value={form.phone_e164}
              onChange={(e) => setForm((f) => ({ ...f, phone_e164: e.target.value }))}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
              placeholder="+5511999999999"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#27272A] dark:text-[#F4F4F5] mb-1">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
              rows={2}
              placeholder="Preferências, restrições alimentares..."
            />
          </div>
          {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-2">{erro}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] text-sm font-semibold rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Histórico + métricas de gosto/frequência ──────────────────────── */
const MetricaTile = ({ label, valor, icon }) => (
  <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl p-3 text-center">
    {icon && <Icon name={icon} size={14} className="text-[#FF441F] mx-auto mb-1" />}
    <p className="text-base font-black text-[#18181B] dark:text-[#F4F4F5] truncate">{valor}</p>
    <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium">{label}</p>
  </div>
);

const DetalheModal = ({ clienteId, onClose }) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    getDetalheCliente(clienteId)
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [clienteId]);

  const maiorQtdProduto = dados?.produtos_favoritos?.[0]?.quantidade ?? 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-5 pb-4 border-b border-[#E4E4E7] dark:border-[#3F3F46] flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">{dados?.cliente?.name ?? 'Cliente'}</h3>
            {dados?.cliente && (
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                {dados.cliente.phone_e164 ?? dados.cliente.email ?? ''}
                {dados.cliente.created_at ? ` · cliente desde ${fmtData(dados.cliente.created_at)}` : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5] flex-shrink-0">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="overflow-y-auto pl-5 pr-6 sm:pr-8 py-5 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : erro ? (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3">{erro}</p>
          ) : (
            <>
              {/* Métricas */}
              <div>
                <h4 className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide mb-2">Frequência e consumo</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <MetricaTile label="pedidos concluídos" valor={dados.metricas.pedidos_count} icon="ShoppingBag" />
                  <MetricaTile label="total gasto" valor={fmt(dados.metricas.total_gasto)} icon="Wallet" />
                  <MetricaTile label="ticket médio" valor={fmt(dados.metricas.ticket_medio)} icon="Receipt" />
                  <MetricaTile
                    label="entre pedidos"
                    valor={dados.metricas.frequencia_media_dias != null ? `${dados.metricas.frequencia_media_dias}d` : '—'}
                    icon="CalendarClock"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {dados.metricas.por_canal.delivery && (
                    <span className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] bg-[#FAFAFA] dark:bg-[#18181B] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                      <Icon name="Bike" size={12} className="text-[#FF441F]" />
                      Delivery: {dados.metricas.por_canal.delivery.count} pedido{dados.metricas.por_canal.delivery.count !== 1 ? 's' : ''} · {fmt(dados.metricas.por_canal.delivery.total)}
                    </span>
                  )}
                  {dados.metricas.por_canal.presencial && (
                    <span className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] bg-[#FAFAFA] dark:bg-[#18181B] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                      <Icon name="UtensilsCrossed" size={12} className="text-[#FF441F]" />
                      Salão: {dados.metricas.por_canal.presencial.count} comanda{dados.metricas.por_canal.presencial.count !== 1 ? 's' : ''} · {fmt(dados.metricas.por_canal.presencial.total)}
                    </span>
                  )}
                  {dados.metricas.primeiro_pedido && (
                    <span className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] bg-[#FAFAFA] dark:bg-[#18181B] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                      <Icon name="Calendar" size={12} className="text-[#FF441F]" />
                      Primeira visita: {fmtData(dados.metricas.primeiro_pedido)}
                    </span>
                  )}
                </div>
              </div>

              {/* Gosto do cliente */}
              {dados.produtos_favoritos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide mb-2">O que mais pede</h4>
                  <div className="space-y-1.5">
                    {dados.produtos_favoritos.map((p, i) => (
                      <div key={p.nome} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#A1A1AA] w-4 flex-shrink-0">{i + 1}º</span>
                        <span className="text-sm text-[#27272A] dark:text-[#F4F4F5] flex-1 min-w-0 truncate">{p.nome}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-16 sm:w-24 h-1.5 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-full overflow-hidden">
                            <div className="h-full bg-[#FF441F] rounded-full" style={{ width: `${(p.quantidade / maiorQtdProduto) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] w-9 text-right">{p.quantidade}x</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {dados.categorias_favoritas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {dados.categorias_favoritas.map((c) => (
                        <span key={c.nome} className="text-[11px] font-semibold text-[#FF441F] bg-[#FF441F]/10 rounded-full px-2.5 py-1">
                          {c.nome} ({c.quantidade}x)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Histórico */}
              <div>
                <h4 className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide mb-2">
                  Histórico ({dados.historico.length})
                </h4>
                {dados.historico.length === 0 ? (
                  <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Nenhum pedido ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {dados.historico.map((p) => {
                      const info = STATUS_INFO[p.status] ?? { label: p.status, cor: 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]' };
                      return (
                        <div key={p.id} className="border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon name={p.canal === 'presencial' ? 'UtensilsCrossed' : 'Bike'} size={13} className="text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0" />
                              <span className="text-xs font-semibold text-[#27272A] dark:text-[#F4F4F5] truncate">
                                {p.canal === 'presencial' ? (p.mesa ?? `Comanda #${p.numero_comanda ?? p.id}`) : 'Delivery'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${info.cor}`}>{info.label}</span>
                            </div>
                            <span className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] flex-shrink-0">{fmt(p.total)}</span>
                          </div>
                          <p className="text-[11px] text-[#A1A1AA] mb-1">{fmtDataHora(p.created_at)}</p>
                          {p.itens.length > 0 && (
                            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
                              {p.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Card mobile ────────────────────────────────────────────────── */
const ClienteCard = ({ c, onEditar, onVerHistorico }) => (
  <div onClick={() => onVerHistorico(c)}
    className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3 cursor-pointer hover:border-[#FF441F]/40 transition-colors">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-[#FF441F]/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="User" size={18} className="text-[#FF441F]" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{c.name}</p>
          {c.email && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">{c.email}</p>}
          {c.phone_e164 && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">{c.phone_e164}</p>}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onEditar(c); }}
        className="flex-shrink-0 p-2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#FF441F] hover:bg-[#FF441F]/5 rounded-lg transition-colors">
        <Icon name="Pencil" size={15} />
      </button>
    </div>
    <div className="flex gap-3 text-center">
      <div className="flex-1 bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl p-2">
        <p className="text-lg font-black text-[#FF441F]">{c.pedidos_count}</p>
        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium">pedidos</p>
      </div>
      <div className="flex-1 bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl p-2">
        <p className="text-sm font-black text-[#18181B] dark:text-[#F4F4F5]">{fmt(c.total_gasto)}</p>
        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium">total gasto</p>
      </div>
      <div className="flex-1 bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl p-2">
        <p className="text-xs font-bold text-[#27272A] dark:text-[#F4F4F5]">{fmtData(c.ultimo_pedido)}</p>
        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium">último pedido</p>
      </div>
    </div>
    {c.notes && (
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800 rounded-xl px-3 py-2">{c.notes}</p>
    )}
  </div>
);

/* ── Página principal ───────────────────────────────────────────── */
const RestauranteClientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(null);
  const [detalheId, setDetalheId] = useState(null);
  const [sortCampo, setSortCampo] = useState('nome');
  const [sortAsc, setSortAsc] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getClientes({ busca: busca || undefined });
      setClientes(d.clientes ?? []);
      setTotal(d.total ?? 0);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    const t = setTimeout(carregar, busca ? 400 : 0);
    return () => clearTimeout(t);
  }, [carregar]);

  const escolherOrdenacao = (campo) => {
    if (campo === sortCampo) {
      setSortAsc((v) => !v);
    } else {
      setSortCampo(campo);
      setSortAsc(campo === 'nome'); // nome: A→Z por padrão; números/datas: maior primeiro
    }
  };

  const clientesOrdenados = [...clientes].sort((a, b) => {
    let cmp;
    if (sortCampo === 'nome') cmp = (a.name ?? '').localeCompare(b.name ?? '');
    else if (sortCampo === 'ultimo_pedido') cmp = new Date(a.ultimo_pedido ?? 0) - new Date(b.ultimo_pedido ?? 0);
    else cmp = (a[sortCampo] ?? 0) - (b[sortCampo] ?? 0);
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/clientes" title="Clientes" subtitle={`${total} cliente${total !== 1 ? 's' : ''} neste restaurante`} />

      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Barra de busca + botão */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-0" style={{ minWidth: '200px' }}>
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
            />
          </div>
          <button onClick={() => setModal('novo')}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
            <Icon name="UserPlus" size={15} />
            Novo cliente
          </button>
        </div>

        {/* Ordenação */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide mr-1">Ordenar por</span>
          {SORT_CAMPOS.map((s) => (
            <button key={s.id} onClick={() => escolherOrdenacao(s.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                sortCampo === s.id
                  ? 'bg-[#FF441F]/10 text-[#FF441F]'
                  : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'
              }`}>
              {s.label}
              {sortCampo === s.id && <Icon name={sortAsc ? 'ArrowUp' : 'ArrowDown'} size={12} />}
            </button>
          ))}
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">{erro}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-12 text-center">
            <Icon name="Users" size={48} className="text-[#E4E4E7] mx-auto mb-4" />
            <p className="text-[#27272A] dark:text-[#F4F4F5] font-semibold">
              {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </p>
            <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">
              {busca
                ? 'Tente outro termo de busca'
                : 'Os clientes aparecem aqui automaticamente ao fazerem o primeiro pedido'}
            </p>
          </div>
        ) : (
          <>
            {/* Tabela — desktop */}
            <div className="hidden md:block bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E4E4E7] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#18181B]">
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">Contato</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">Pedidos</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">Total gasto</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">Último pedido</th>
                    <th className="px-4 py-3 w-px whitespace-nowrap" />
                  </tr>
                </thead>
                <tbody>
                  {clientesOrdenados.map((c) => (
                    <tr key={c.id} onClick={() => setDetalheId(c.id)}
                      className="border-b border-[#E4E4E7] dark:border-[#3F3F46] last:border-0 hover:bg-[#FAFAFA] dark:hover:bg-[#18181B] transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#FF441F]/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon name="User" size={14} className="text-[#FF441F]" />
                          </div>
                          <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#71717A] dark:text-[#A1A1AA]">
                        <div>{c.email ?? '—'}</div>
                        {c.phone_e164 && <div className="text-xs font-mono">{c.phone_e164}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-[#FF441F]/10 text-[#FF441F] text-xs font-bold rounded-full">
                          {c.pedidos_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#18181B] dark:text-[#F4F4F5]">{fmt(c.total_gasto)}</td>
                      <td className="px-4 py-3 text-right text-[#71717A] dark:text-[#A1A1AA] text-xs">{fmtData(c.ultimo_pedido)}</td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); setModal(c); }}
                          className="px-3 py-1.5 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#FF441F] hover:bg-[#FF441F]/5 rounded-lg transition-colors flex items-center gap-1">
                          <Icon name="Pencil" size={12} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile */}
            <div className="md:hidden space-y-3">
              {clientesOrdenados.map((c) => (
                <ClienteCard key={c.id} c={c} onEditar={setModal} onVerHistorico={(cli) => setDetalheId(cli.id)} />
              ))}
            </div>
          </>
        )}
      </main>

      {modal && (
        <Modal
          cliente={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}

      {detalheId && (
        <DetalheModal clienteId={detalheId} onClose={() => setDetalheId(null)} />
      )}
    </div>
  );
};

export default RestauranteClientes;
