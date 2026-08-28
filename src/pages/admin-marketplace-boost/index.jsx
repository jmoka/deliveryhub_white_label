import React, { useState, useEffect } from 'react';
import {
  getVagasBoost, salvarVagasBoost, getPacotesBoostAdmin, getCarrosseisBoost,
  criarPacoteBoost, atualizarPacoteBoost, removerPacoteBoost,
} from '../../services/marketplaceBoostAdminService';
import Icon from '../../components/AppIcon';
import AdminHeader from '../../components/admin/AdminHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const Modal = ({ pacote, carrosseis, onClose, onSave }) => {
  const [form, setForm] = useState(
    pacote
      ? {
          nome: pacote.nome,
          carrossel: pacote.carrossel,
          qtd_produtos: String(pacote.qtd_produtos),
          dias: String(pacote.dias),
          preco: String(pacote.preco),
          ativo: pacote.ativo,
        }
      : { nome: '', carrossel: carrosseis[0]?.carrossel ?? '', qtd_produtos: '1', dias: '7', preco: '', ativo: true }
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const isEdicao = !!pacote;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const body = {
        nome: form.nome.trim(),
        carrossel: form.carrossel,
        qtd_produtos: parseInt(form.qtd_produtos, 10),
        dias: parseInt(form.dias, 10),
        preco: parseFloat(form.preco),
      };
      if (isEdicao) {
        await atualizarPacoteBoost(pacote.id, { ...body, ativo: form.ativo });
      } else {
        await criarPacoteBoost(body);
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4">
          {isEdicao ? 'Editar pacote' : 'Novo pacote de destaque'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Nome *</label>
            <input required value={form.nome} onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: 3 produtos / 15 dias"
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Carrossel *</label>
            <select value={form.carrossel} onChange={(e) => set('carrossel', e.target.value)} disabled={isEdicao}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm disabled:opacity-60">
              {carrosseis.map((c) => <option key={c.carrossel} value={c.carrossel}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Produtos *</label>
              <input required type="number" min="1" max="20" value={form.qtd_produtos} onChange={(e) => set('qtd_produtos', e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Dias *</label>
              <input required type="number" min="1" max="365" value={form.dias} onChange={(e) => set('dias', e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Preço (R$) *</label>
              <input required type="number" min="0" step="0.01" value={form.preco} onChange={(e) => set('preco', e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
          {isEdicao && (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Ativo (visível pros restaurantes comprarem)
            </label>
          )}
          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-700 dark:text-zinc-300">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminMarketplaceBoost = () => {
  const [vagas, setVagas] = useState(null);
  const [salvandoVagas, setSalvandoVagas] = useState(false);
  const [pacotes, setPacotes] = useState([]);
  const [carrosseis, setCarrosseis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  const carregar = () => {
    setCarregando(true);
    Promise.all([getVagasBoost(), getPacotesBoostAdmin(), getCarrosseisBoost()])
      .then(([v, p, c]) => { setVagas(v); setPacotes(p.pacotes ?? []); setCarrosseis(c ?? []); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const salvarVagas = async () => {
    setSalvandoVagas(true);
    try {
      const novo = await salvarVagasBoost(vagas);
      setVagas(novo);
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoVagas(false);
    }
  };

  const remover = async (id) => {
    if (!window.confirm('Remover este pacote?')) return;
    try {
      await removerPacoteBoost(id);
      carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  const pacotesPorCarrossel = pacotes.reduce((acc, p) => {
    (acc[p.carrossel] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <AdminHeader active="/admin/marketplace-boost" title="Marketplace — Destaque Pago" subtitle="Vagas e pacotes de posição paga nos carrosséis da home pública" />

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {carregando ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400">Carregando...</p>
        ) : (
          <>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 mb-5">
              <h2 className="font-bold text-gray-900 dark:text-zinc-100 mb-1">Vagas pagas por carrossel</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Quantas posições pagas cabem simultaneamente em cada carrossel (o resto continua orgânico).</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {carrosseis.map((c) => (
                  <div key={c.carrossel}>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">{c.label}</label>
                    <input type="number" min="0" value={vagas?.[c.carrossel] ?? 0}
                      onChange={(e) => setVagas((atual) => ({ ...atual, [c.carrossel]: parseInt(e.target.value || '0', 10) }))}
                      className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>
              <button onClick={salvarVagas} disabled={salvandoVagas}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {salvandoVagas ? 'Salvando...' : 'Salvar vagas'}
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 dark:text-zinc-100">Pacotes</h2>
              <button onClick={() => { setEditando(null); setModalAberto(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg">
                <Icon name="Plus" size={15} /> Novo pacote
              </button>
            </div>

            {carrosseis.map((c) => (
              <div key={c.carrossel} className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-2">{c.label}</h3>
                {(pacotesPorCarrossel[c.carrossel] ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Nenhum pacote cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {pacotesPorCarrossel[c.carrossel].map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            {p.nome} {!p.ativo && <span className="text-xs font-normal text-gray-400">(inativo)</span>}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{p.qtd_produtos} produto(s) · {p.dias} dias · {fmt(p.preco)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setEditando(p); setModalAberto(true); }} className="text-xs font-semibold text-blue-600 hover:underline">Editar</button>
                          <button onClick={() => remover(p.id)} className="text-xs font-semibold text-red-600 hover:underline">Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {modalAberto && (
        <Modal
          pacote={editando}
          carrosseis={carrosseis}
          onClose={() => setModalAberto(false)}
          onSave={() => { setModalAberto(false); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminMarketplaceBoost;
