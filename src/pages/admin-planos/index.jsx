import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPlanos, criarPlano, atualizarPlano, removerPlano,
  getAssinaturas, atribuirAssinatura, cancelarAssinatura, gerarFaturaManual,
  getFaturas, marcarFaturaPaga,
} from '../../services/planosService';
import {
  getInstalacoes, criarInstalacao, atualizarInstalacao,
  atribuirPlanoInstalacao, gerarFaturaManualInstalacao,
} from '../../services/instalacoesService';
import { getEmpresas } from '../../services/adminService';
import Icon from '../../components/AppIcon';
import AdminHeader from '../../components/admin/AdminHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—';

const PERIODICIDADES = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
];

const STATUS_LABEL = {
  trial: { label: 'Trial', cls: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  ativa: { label: 'Ativa', cls: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' },
  cancelada: { label: 'Cancelada', cls: 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400' },
  pendente: { label: 'Pendente', cls: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  paga: { label: 'Paga', cls: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' },
  vencida: { label: 'Vencida', cls: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
  isenta: { label: 'Isenta', cls: 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400' },
};

const Badge = ({ status }) => {
  const s = STATUS_LABEL[status] ?? { label: status, cls: 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

const EMPTY = { nome: '', valor: '', periodicidade: 'mensal', tipo: 'saas', limite_produtos: '', piso_faturamento: '', trial_dias: '0', ativo: true, inclui_delivery: true, inclui_salao: false };

const Modal = ({ plano, onClose, onSave }) => {
  const [form, setForm] = useState(
    plano
      ? {
          nome: plano.nome,
          valor: String(plano.valor),
          periodicidade: plano.periodicidade,
          tipo: plano.tipo ?? 'saas',
          limite_produtos: plano.limite_produtos != null ? String(plano.limite_produtos) : '',
          piso_faturamento: plano.piso_faturamento != null ? String(plano.piso_faturamento) : '',
          trial_dias: String(plano.trial_dias ?? 0),
          ativo: plano.ativo,
          inclui_delivery: plano.inclui_delivery ?? true,
          inclui_salao: plano.inclui_salao ?? false,
        }
      : { ...EMPTY }
  );
  const isLocal = form.tipo === 'local';
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const isEdicao = !!plano;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.valor) return;
    setSalvando(true);
    setErro(null);
    try {
      const body = {
        nome: form.nome.trim(),
        valor: parseFloat(form.valor),
        periodicidade: form.periodicidade,
        tipo: form.tipo,
        limite_produtos: form.limite_produtos.trim() ? parseInt(form.limite_produtos, 10) : null,
        piso_faturamento: form.piso_faturamento.trim() ? parseFloat(form.piso_faturamento) : null,
        trial_dias: form.trial_dias.trim() ? parseInt(form.trial_dias, 10) : 0,
        inclui_delivery: form.inclui_delivery,
        inclui_salao: form.inclui_salao,
      };
      if (isEdicao) {
        await atualizarPlano(plano.id, { ...body, ativo: form.ativo });
      } else {
        await criarPlano(body);
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
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
            {isEdicao ? 'Editar Plano' : 'Novo Plano'}
          </h3>
          <button type="button" onClick={onClose}
            className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Nome *</label>
            <input required value={form.nome} onChange={(e) => set('nome', e.target.value)}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Plano Básico" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Tipo de cliente</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="radio" name="tipo" checked={form.tipo === 'saas'} onChange={() => set('tipo', 'saas')}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700 dark:text-zinc-300">SaaS (loja multi-tenant)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="radio" name="tipo" checked={form.tipo === 'local'} onChange={() => set('tipo', 'local')}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700 dark:text-zinc-300">Instalação local</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Valor (R$) *</label>
              <input required type="number" min="0" step="0.01" value={form.valor} onChange={(e) => set('valor', e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="120.00" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Periodicidade *</label>
              <select value={form.periodicidade} onChange={(e) => set('periodicidade', e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PERIODICIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {!isLocal && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Limite de produtos</label>
                  <input type="number" min="1" value={form.limite_produtos} onChange={(e) => set('limite_produtos', e.target.value)}
                    className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Vazio = ilimitado" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Piso de faturamento (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.piso_faturamento} onChange={(e) => set('piso_faturamento', e.target.value)}
                    className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Vazio = sempre cobra" />
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-zinc-500 -mt-2">
                Piso de faturamento: só cobra a loja quando o faturamento do período atingir esse valor.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Módulos incluídos</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.inclui_delivery} onChange={(e) => set('inclui_delivery', e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-zinc-300">Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.inclui_salao} onChange={(e) => set('inclui_salao', e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-zinc-300">Salão (mesas/comandas/garçons)</span>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Dias grátis (trial)</label>
              <input type="number" min="0" value={form.trial_dias} onChange={(e) => set('trial_dias', e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {isEdicao && (
              <div className="flex flex-col gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-zinc-300">Ativo</span>
                </label>
              </div>
            )}
          </div>

          {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Aba: Planos (CRUD) ────────────────────────────────────────────
const TabPlanos = () => {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modal, setModal] = useState(null); // null | 'novo' | plano_obj
  const [removendo, setRemovendo] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getPlanos()
      .then((d) => setPlanos(d.planos ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleToggle = async (plano) => {
    try {
      await atualizarPlano(plano.id, { ativo: !plano.ativo });
      setPlanos((prev) => prev.map((p) => p.id === plano.id ? { ...p, ativo: !p.ativo } : p));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRemover = async (plano) => {
    if (!window.confirm(`Remover o plano "${plano.nome}"?`)) return;
    setRemovendo(plano.id);
    try {
      await removerPlano(plano.id);
      setPlanos((prev) => prev.filter((p) => p.id !== plano.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-zinc-400">{planos.length} plano(s)</p>
        <button onClick={() => setModal('novo')}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2">
          <Icon name="Plus" size={16} /> Novo Plano
        </button>
      </div>

      {erro && <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{erro}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : planos.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-14 text-center">
          <Icon name="Wallet" size={44} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-zinc-500 mb-4">Nenhum plano cadastrado</p>
          <button onClick={() => setModal('novo')}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
            Criar primeiro plano
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {planos.map((plano) => (
              <motion.div key={plano.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`bg-white dark:bg-zinc-800 rounded-2xl border px-5 py-4 flex items-center gap-4 group transition-all ${
                  plano.ativo ? 'border-gray-100 dark:border-zinc-700 hover:shadow-md' : 'border-dashed border-gray-200 dark:border-zinc-700 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-zinc-100">{plano.nome}</span>
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                      {fmt(plano.valor)} / {plano.periodicidade}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      plano.tipo === 'local'
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                    }`}>
                      {plano.tipo === 'local' ? 'Instalação local' : 'SaaS'}
                    </span>
                    {!plano.ativo && (
                      <span className="text-xs bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                        Inativo
                      </span>
                    )}
                    {plano.inclui_delivery && (
                      <span className="text-xs font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                        Delivery
                      </span>
                    )}
                    {plano.inclui_salao && (
                      <span className="text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
                        Salão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                    {plano.limite_produtos != null ? `Até ${plano.limite_produtos} produtos` : 'Produtos ilimitados'}
                    {' · '}
                    {plano.piso_faturamento != null ? `cobra a partir de ${fmt(plano.piso_faturamento)} faturados` : 'cobra sempre'}
                    {plano.trial_dias > 0 && ` · ${plano.trial_dias} dias grátis`}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => handleToggle(plano)}
                    title={plano.ativo ? 'Desativar' : 'Ativar'}
                    className={`p-2 rounded-lg transition-colors ${
                      plano.ativo
                        ? 'text-gray-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        : 'text-gray-400 dark:text-zinc-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40'
                    }`}>
                    <Icon name={plano.ativo ? 'EyeOff' : 'Eye'} size={15} />
                  </button>
                  <button onClick={() => setModal(plano)}
                    className="p-2 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                    title="Editar">
                    <Icon name="Pencil" size={15} />
                  </button>
                  <button onClick={() => handleRemover(plano)} disabled={removendo === plano.id}
                    className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-40"
                    title="Remover">
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {modal && (
        <Modal
          plano={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </>
  );
};

// ── Aba: Lojas (assinaturas) ───────────────────────────────────────
const TabLojas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [selecionado, setSelecionado] = useState({}); // restaurantId -> plano_id escolhido no select
  const [processando, setProcessando] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    Promise.all([getEmpresas(), getPlanos(), getAssinaturas()])
      .then(([e, p, a]) => {
        setEmpresas(e.empresas ?? []);
        setPlanos(p.planos ?? []);
        setAssinaturas(a.assinaturas ?? []);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const assinaturaDe = (restaurantId) => assinaturas.find((a) => a.restaurant_id === restaurantId);

  const handleAtribuir = async (restaurantId) => {
    const planoId = selecionado[restaurantId];
    if (!planoId) return;
    setProcessando(restaurantId);
    try {
      await atribuirAssinatura(restaurantId, { plano_id: parseInt(planoId, 10) });
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessando(null);
    }
  };

  const handleCancelar = async (restaurantId) => {
    if (!window.confirm('Cancelar a assinatura desta loja?')) return;
    setProcessando(restaurantId);
    try {
      await cancelarAssinatura(restaurantId);
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessando(null);
    }
  };

  const handleGerarFatura = async (restaurantId) => {
    setProcessando(restaurantId);
    try {
      await gerarFaturaManual(restaurantId);
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessando(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {erro && <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{erro}</p>}

      {planos.length === 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-4 py-3 mb-4">
          Cadastre um plano na aba "Planos" antes de atribuir a uma loja.
        </p>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Loja</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Plano atual</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Trocar plano</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((emp) => {
              const assinatura = assinaturaDe(emp.id);
              return (
                <tr key={emp.id} className="border-b border-gray-200 dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                    {assinatura?.planos?.nome ?? <span className="text-gray-400 dark:text-zinc-500">Sem plano</span>}
                  </td>
                  <td className="px-4 py-3">
                    {assinatura ? <Badge status={assinatura.status} /> : <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={selecionado[emp.id] ?? assinatura?.plano_id ?? ''}
                      onChange={(e) => setSelecionado((s) => ({ ...s, [emp.id]: e.target.value }))}
                      className="border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {!assinatura && <option value="">Selecionar...</option>}
                      {planos.filter((p) => p.ativo).map((p) => (
                        <option key={p.id} value={p.id}>{p.nome} — {fmt(p.valor)}/{p.periodicidade}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleAtribuir(emp.id)}
                        disabled={processando === emp.id || !selecionado[emp.id]}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg disabled:opacity-40"
                      >
                        {assinatura ? 'Trocar' : 'Atribuir'}
                      </button>
                      {assinatura && assinatura.status !== 'cancelada' && (
                        <>
                          <button
                            onClick={() => handleGerarFatura(emp.id)}
                            disabled={processando === emp.id}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-40"
                          >
                            Gerar fatura
                          </button>
                          <button
                            onClick={() => handleCancelar(emp.id)}
                            disabled={processando === emp.id}
                            className="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-40"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ── Aba: Faturas (visão global) ────────────────────────────────────
const TabFaturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [processando, setProcessando] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    const filtros = {};
    if (filtroStatus) filtros.status = filtroStatus;
    if (filtroTipo) filtros.tipo = filtroTipo;
    getFaturas(filtros)
      .then((d) => setFaturas(d.faturas ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [filtroStatus, filtroTipo]);

  useEffect(() => { carregar(); }, [carregar]);

  const nomeFatura = (f) => f.restaurants?.name ?? f.instalacoes_locais?.nome_cliente ?? `#${f.restaurant_id ?? f.instalacao_id}`;

  const handleMarcarPaga = async (fatura) => {
    if (!window.confirm(`Marcar a fatura de ${nomeFatura(fatura)} como paga?`)) return;
    setProcessando(fatura.id);
    try {
      await marcarFaturaPaga(fatura.id);
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessando(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-zinc-400">{faturas.length} fatura(s)</p>
        <div className="flex gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">SaaS + Local</option>
            <option value="saas">Só SaaS</option>
            <option value="local">Só instalações locais</option>
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="vencida">Vencida</option>
            <option value="paga">Paga</option>
            <option value="isenta">Isenta</option>
          </select>
        </div>
      </div>

      {erro && <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{erro}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : faturas.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-14 text-center">
          <p className="text-gray-400 dark:text-zinc-500">Nenhuma fatura encontrada</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Loja</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Período</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Vencimento</th>
                <th className="px-4 py-3 w-px"></th>
              </tr>
            </thead>
            <tbody>
              {faturas.map((f) => (
                <tr key={f.id} className="border-b border-gray-200 dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">{nomeFatura(f)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 text-xs">{fmtData(f.periodo_inicio)} – {fmtData(f.periodo_fim)}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-zinc-100">{fmt(f.valor)}</td>
                  <td className="px-4 py-3"><Badge status={f.status} /></td>
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 text-xs">{fmtData(f.vencimento)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(f.status === 'pendente' || f.status === 'vencida') && (
                      <button
                        onClick={() => handleMarcarPaga(f)}
                        disabled={processando === f.id}
                        className="px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg disabled:opacity-40"
                      >
                        Marcar paga
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ── Aba: Instalações Locais (licenciamento) ─────────────────────────
const ModalNovaInstalacao = ({ planosLocais, onClose, onCriada }) => {
  const [form, setForm] = useState({ nome_cliente: '', contato: '', dominio_ou_ip: '', plano_id: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [criada, setCriada] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const copiar = () => navigator.clipboard?.writeText(criada.serial);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome_cliente.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const nova = await criarInstalacao({
        nome_cliente: form.nome_cliente.trim(),
        contato: form.contato.trim() || undefined,
        dominio_ou_ip: form.dominio_ou_ip.trim() || undefined,
        plano_id: form.plano_id ? parseInt(form.plano_id, 10) : undefined,
      });
      setCriada(nova);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md p-6">
        {criada ? (
          <div className="text-center">
            <Icon name="CheckCircle2" size={40} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-1">Instalação criada</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Copie o serial e envie pro cliente — ele vai usar pra ativar a instalação local.</p>
            <button onClick={copiar}
              className="w-full text-sm font-mono bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-4 py-3 break-all flex items-center justify-between gap-2">
              {criada.serial}
              <Icon name="Copy" size={15} className="flex-shrink-0 text-gray-400" />
            </button>
            <button onClick={() => { onCriada(); onClose(); }}
              className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Nova instalação local</h3>
              <button type="button" onClick={onClose}
                className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg">
                <Icon name="X" size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Nome do cliente *</label>
                <input required value={form.nome_cliente} onChange={(e) => set('nome_cliente', e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Contato (whatsapp/e-mail)</label>
                <input value={form.contato} onChange={(e) => set('contato', e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Domínio/IP (opcional)</label>
                <input value={form.dominio_ou_ip} onChange={(e) => set('dominio_ou_ip', e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Plano</label>
                <select value={form.plano_id} onChange={(e) => set('plano_id', e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sem plano (atribui depois)</option>
                  {planosLocais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} — {fmt(p.valor)}/{p.periodicidade}</option>
                  ))}
                </select>
              </div>

              {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{erro}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {salvando ? 'Criando...' : 'Criar e gerar serial'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const ModalTrocarPlanoInstalacao = ({ instalacao, planosLocais, onClose, onSalvo }) => {
  const [planoId, setPlanoId] = useState(instalacao.assinaturas?.[0]?.plano_id ? String(instalacao.assinaturas[0].plano_id) : '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!planoId) return;
    setSalvando(true);
    setErro(null);
    try {
      await atribuirPlanoInstalacao(instalacao.id, parseInt(planoId, 10));
      onSalvo();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4">Plano — {instalacao.nome_cliente}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select value={planoId} onChange={(e) => setPlanoId(e.target.value)} required
            className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione um plano...</option>
            {planosLocais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} — {fmt(p.valor)}/{p.periodicidade}</option>
            ))}
          </select>
          {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{erro}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TabInstalacoesLocais = () => {
  const [instalacoes, setInstalacoes] = useState([]);
  const [planosLocais, setPlanosLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalNova, setModalNova] = useState(false);
  const [modalPlano, setModalPlano] = useState(null);
  const [gerando, setGerando] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    Promise.all([getInstalacoes(), getPlanos()])
      .then(([i, p]) => {
        setInstalacoes(i.instalacoes ?? []);
        setPlanosLocais((p.planos ?? []).filter((pl) => pl.tipo === 'local'));
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const copiarSerial = (serial) => navigator.clipboard?.writeText(serial);

  const handleToggleAtivo = async (inst) => {
    try {
      await atualizarInstalacao(inst.id, { ativo: !inst.ativo });
      carregar();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleGerarFatura = async (inst) => {
    setGerando(inst.id);
    try {
      await gerarFaturaManualInstalacao(inst.id);
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setGerando(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-zinc-400">{instalacoes.length} instalação(ões)</p>
        <button onClick={() => setModalNova(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2">
          <Icon name="Plus" size={16} /> Nova instalação
        </button>
      </div>

      {erro && <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{erro}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : instalacoes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-14 text-center">
          <Icon name="HardDrive" size={44} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-zinc-500 mb-4">Nenhuma instalação local cadastrada</p>
          <button onClick={() => setModalNova(true)}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
            Criar primeira instalação
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Serial</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Plano</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Visto por último</th>
                <th className="px-4 py-3 w-px"></th>
              </tr>
            </thead>
            <tbody>
              {instalacoes.map((inst) => {
                const assinatura = inst.assinaturas?.[0];
                return (
                  <tr key={inst.id} className={`border-b border-gray-200 dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-700/40 ${!inst.ativo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-zinc-100">{inst.nome_cliente}</p>
                      {inst.contato && <p className="text-xs text-gray-400 dark:text-zinc-500">{inst.contato}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => copiarSerial(inst.serial)}
                        className="font-mono text-xs text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5">
                        {inst.serial} <Icon name="Copy" size={12} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                      {assinatura?.planos?.nome ?? <span className="text-gray-400 dark:text-zinc-500">Sem plano</span>}
                    </td>
                    <td className="px-4 py-3">{assinatura ? <Badge status={assinatura.status} /> : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 text-xs">{fmtData(inst.ultimo_check_em)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModalPlano(inst)}
                          className="p-2 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                          title="Trocar plano">
                          <Icon name="Wallet" size={15} />
                        </button>
                        <button onClick={() => handleGerarFatura(inst)} disabled={gerando === inst.id}
                          className="p-2 text-gray-400 dark:text-zinc-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg disabled:opacity-40"
                          title="Gerar fatura">
                          <Icon name="FileText" size={15} />
                        </button>
                        <button onClick={() => handleToggleAtivo(inst)}
                          className="p-2 text-gray-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                          title={inst.ativo ? 'Revogar serial' : 'Reativar'}>
                          <Icon name={inst.ativo ? 'EyeOff' : 'Eye'} size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalNova && (
        <ModalNovaInstalacao planosLocais={planosLocais} onClose={() => setModalNova(false)} onCriada={carregar} />
      )}
      {modalPlano && (
        <ModalTrocarPlanoInstalacao
          instalacao={modalPlano}
          planosLocais={planosLocais}
          onClose={() => setModalPlano(null)}
          onSalvo={() => { setModalPlano(null); carregar(); }}
        />
      )}
    </>
  );
};

const TABS = [
  { id: 'planos', label: 'Planos' },
  { id: 'lojas', label: 'Lojas' },
  { id: 'faturas', label: 'Faturas' },
  { id: 'instalacoes', label: 'Instalações Locais' },
];

const AdminPlanos = () => {
  const [tabAtiva, setTabAtiva] = useState('planos');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/planos" title="Planos de Assinatura" subtitle="Mensalidades cobradas das lojas, além da comissão por venda" />

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex border-b border-gray-200 dark:border-zinc-700 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTabAtiva(t.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tabAtiva === t.id
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tabAtiva === 'planos' && <TabPlanos />}
        {tabAtiva === 'lojas' && <TabLojas />}
        {tabAtiva === 'faturas' && <TabFaturas />}
        {tabAtiva === 'instalacoes' && <TabInstalacoesLocais />}
      </main>
    </div>
  );
};

export default AdminPlanos;
