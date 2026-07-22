import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes, criarCliente, atualizarCliente } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtData = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

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
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#18181B]">{cliente ? 'Editar cliente' : 'Novo cliente'}</h3>
          <button onClick={onClose} className="p-1 text-[#71717A] hover:text-[#27272A]">
            <Icon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#27272A] mb-1">Nome *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#27272A] mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#27272A] mb-1">Telefone</label>
            <input
              value={form.phone_e164}
              onChange={(e) => setForm((f) => ({ ...f, phone_e164: e.target.value }))}
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
              placeholder="+5511999999999"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#27272A] mb-1">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
              rows={2}
              placeholder="Preferências, restrições alimentares..."
            />
          </div>
          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{erro}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-[#E4E4E7] text-[#27272A] text-sm font-semibold rounded-xl hover:bg-[#F4F4F5]">
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

/* ── Card mobile ────────────────────────────────────────────────── */
const ClienteCard = ({ c, onEditar }) => (
  <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-[#FF441F]/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="User" size={18} className="text-[#FF441F]" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#18181B] truncate">{c.name}</p>
          {c.email && <p className="text-xs text-[#71717A] truncate">{c.email}</p>}
          {c.phone_e164 && <p className="text-xs text-[#71717A] font-mono">{c.phone_e164}</p>}
        </div>
      </div>
      <button onClick={() => onEditar(c)}
        className="flex-shrink-0 p-2 text-[#71717A] hover:text-[#FF441F] hover:bg-[#FF441F]/5 rounded-lg transition-colors">
        <Icon name="Pencil" size={15} />
      </button>
    </div>
    <div className="flex gap-3 text-center">
      <div className="flex-1 bg-[#FAFAFA] rounded-xl p-2">
        <p className="text-lg font-black text-[#FF441F]">{c.pedidos_count}</p>
        <p className="text-[10px] text-[#71717A] font-medium">pedidos</p>
      </div>
      <div className="flex-1 bg-[#FAFAFA] rounded-xl p-2">
        <p className="text-sm font-black text-[#18181B]">{fmt(c.total_gasto)}</p>
        <p className="text-[10px] text-[#71717A] font-medium">total gasto</p>
      </div>
      <div className="flex-1 bg-[#FAFAFA] rounded-xl p-2">
        <p className="text-xs font-bold text-[#27272A]">{fmtData(c.ultimo_pedido)}</p>
        <p className="text-[10px] text-[#71717A] font-medium">último pedido</p>
      </div>
    </div>
    {c.notes && (
      <p className="text-xs text-[#71717A] bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{c.notes}</p>
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <RestauranteHeader active="/restaurante/clientes" title="Clientes" subtitle={`${total} cliente${total !== 1 ? 's' : ''} neste restaurante`} />

      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Barra de busca + botão */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-0" style={{ minWidth: '200px' }}>
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full border border-[#E4E4E7] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/20 focus:border-[#FF441F]"
            />
          </div>
          <button onClick={() => setModal('novo')}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
            <Icon name="UserPlus" size={15} />
            Novo cliente
          </button>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{erro}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-12 text-center">
            <Icon name="Users" size={48} className="text-[#E4E4E7] mx-auto mb-4" />
            <p className="text-[#27272A] font-semibold">
              {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </p>
            <p className="text-sm text-[#71717A] mt-1">
              {busca
                ? 'Tente outro termo de busca'
                : 'Os clientes aparecem aqui automaticamente ao fazerem o primeiro pedido'}
            </p>
          </div>
        ) : (
          <>
            {/* Tabela — desktop */}
            <div className="hidden md:block bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA]">
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] uppercase tracking-wide">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#71717A] uppercase tracking-wide">Contato</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#71717A] uppercase tracking-wide">Pedidos</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#71717A] uppercase tracking-wide">Total gasto</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#71717A] uppercase tracking-wide">Último pedido</th>
                    <th className="px-4 py-3 w-px whitespace-nowrap" />
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b border-[#E4E4E7] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#FF441F]/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon name="User" size={14} className="text-[#FF441F]" />
                          </div>
                          <span className="font-semibold text-[#18181B]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#71717A]">
                        <div>{c.email ?? '—'}</div>
                        {c.phone_e164 && <div className="text-xs font-mono">{c.phone_e164}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-[#FF441F]/10 text-[#FF441F] text-xs font-bold rounded-full">
                          {c.pedidos_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#18181B]">{fmt(c.total_gasto)}</td>
                      <td className="px-4 py-3 text-right text-[#71717A] text-xs">{fmtData(c.ultimo_pedido)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setModal(c)}
                          className="px-3 py-1.5 text-xs font-medium text-[#71717A] hover:text-[#FF441F] hover:bg-[#FF441F]/5 rounded-lg transition-colors flex items-center gap-1">
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
              {clientes.map((c) => (
                <ClienteCard key={c.id} c={c} onEditar={setModal} />
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
    </div>
  );
};

export default RestauranteClientes;
