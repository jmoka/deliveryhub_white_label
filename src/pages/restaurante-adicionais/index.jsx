import React, { useState, useEffect, useCallback } from 'react';
import { listarAdicionais, criarAdicional, editarAdicional, removerAdicional } from '../../services/restauranteService';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const RestauranteAdicionais = () => {
  const [adicionais, setAdicionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editPreco, setEditPreco] = useState('');
  const [removendo, setRemovendo] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    listarAdicionais()
      .then((r) => setAdicionais(r.adicionais ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const criar = async (e) => {
    e.preventDefault();
    setErro(null);
    if (!nome.trim() || preco === '') return;
    setSalvando(true);
    try {
      await criarAdicional({ name: nome.trim(), price: parseFloat(preco) });
      setNome(''); setPreco('');
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const iniciarEdicao = (a) => {
    setEditandoId(a.id);
    setEditNome(a.name);
    setEditPreco(String(a.price));
  };

  const cancelarEdicao = () => setEditandoId(null);

  const salvarEdicao = async (a) => {
    const nomeNovo = editNome.trim();
    const precoNovo = parseFloat(editPreco);
    if (!nomeNovo || Number.isNaN(precoNovo)) return;
    try {
      const atualizado = await editarAdicional(a.id, { name: nomeNovo, price: precoNovo });
      setAdicionais((prev) => prev.map((x) => (x.id === a.id ? atualizado : x)));
      setEditandoId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleAtivo = async (a) => {
    try {
      const atualizado = await editarAdicional(a.id, { is_active: !a.is_active });
      setAdicionais((prev) => prev.map((x) => (x.id === a.id ? atualizado : x)));
    } catch (err) {
      alert(err.message);
    }
  };

  const remover = async (a) => {
    if (!window.confirm(`Remover o adicional "${a.name}"? Ele sai de todos os produtos que o usam.`)) return;
    setRemovendo(a.id);
    try {
      await removerAdicional(a.id);
      setAdicionais((prev) => prev.filter((x) => x.id !== a.id));
    } catch (err) {
      alert(err.message);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/adicionais" title="Adicionais" onRefresh={carregar} />
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-4">
          Cadastre aqui os adicionais da loja (ex: bacon, cheddar, borda recheada). Depois, no cadastro de cada
          produto, marque quais adicionais ele tem disponível.
        </p>

        <form onSubmit={criar} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4 flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Bacon"
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Preço (R$)</label>
            <input type="number" min="0" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} required placeholder="0,00"
              className="w-32 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
          </div>
          {erro && <p className="text-xs text-red-600 dark:text-red-400 w-full">{erro}</p>}
          <button type="submit" disabled={salvando} className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl disabled:opacity-50">
            {salvando ? '...' : 'Adicionar'}
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : adicionais.length === 0 ? (
          <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-12 text-center">
            <p className="text-sm text-[#A1A1AA]">Nenhum adicional cadastrado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {adicionais.map((a) => (
              <div key={a.id} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
                {editandoId === a.id ? (
                  <div className="flex flex-col gap-2">
                    <input value={editNome} onChange={(e) => setEditNome(e.target.value)} autoFocus
                      className="w-full border border-[#FF441F] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm" />
                    <input type="number" min="0" step="0.01" value={editPreco} onChange={(e) => setEditPreco(e.target.value)}
                      className="w-32 border border-[#FF441F] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => salvarEdicao(a)} className="flex-1 py-1.5 text-xs font-bold bg-[#FF441F] text-white rounded-lg">Salvar</button>
                      <button onClick={cancelarEdicao} className="flex-1 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg text-[#71717A] dark:text-[#A1A1AA]">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{a.name}</p>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{fmt(a.price)}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${a.is_active ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400'}`}>
                        {a.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => iniciarEdicao(a)} className="flex-1 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                        Editar
                      </button>
                      <button onClick={() => toggleAtivo(a)} className="flex-1 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                        {a.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => remover(a)} disabled={removendo === a.id} className="flex-1 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50">
                        {removendo === a.id ? '...' : 'Remover'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestauranteAdicionais;
