import React, { useState, useEffect, useCallback } from 'react';
import { listarMesas, criarMesa, removerMesa, criarMesasEmLote, removerTodasMesas } from '../../services/restauranteService';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const RestauranteMesas = () => {
  const [mesas, setMesas] = useState([]);
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState(null);

  const [loteDe, setLoteDe] = useState('');
  const [loteAte, setLoteAte] = useState('');
  const [loteErro, setLoteErro] = useState(null);
  const [loteSalvando, setLoteSalvando] = useState(false);
  const [loteResultado, setLoteResultado] = useState(null);

  const [limpando, setLimpando] = useState(false);

  const carregar = useCallback(() => listarMesas().then(setMesas), []);
  useEffect(() => { carregar(); }, [carregar]);

  const limparTodas = async () => {
    if (!window.confirm(`Apagar todas as ${mesas.length} mesa(s) cadastradas? Mesas ocupadas/em atendimento não serão removidas.`)) return;
    setLimpando(true);
    try {
      const resultado = await removerTodasMesas();
      carregar();
      if (resultado.bloqueadas > 0) {
        alert(`${resultado.removidas} mesa(s) removida(s). ${resultado.bloqueadas} mesa(s) ocupada(s) não foram removidas.`);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLimpando(false);
    }
  };

  const criar = async (e) => {
    e.preventDefault();
    setErro(null);
    try {
      await criarMesa({ numero: Number(numero), nome: nome || undefined });
      setNumero(''); setNome('');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const criarLote = async (e) => {
    e.preventDefault();
    setLoteErro(null);
    setLoteResultado(null);
    setLoteSalvando(true);
    try {
      const resultado = await criarMesasEmLote(Number(loteDe), Number(loteAte));
      setLoteResultado(resultado);
      setLoteDe(''); setLoteAte('');
      carregar();
    } catch (err) {
      setLoteErro(err.message);
    } finally {
      setLoteSalvando(false);
    }
  };

  const remover = async (id) => {
    if (!window.confirm('Remover esta mesa?')) return;
    try {
      await removerMesa(id);
      carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/mesas" title="Mesas" onRefresh={carregar} />
      <div className="max-w-5xl mx-auto p-4">
        <form onSubmit={criar} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4 flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Número</label>
            <input type="number" value={numero} onChange={(e) => setNumero(e.target.value)} required
              className="w-24 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Nome (opcional)</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
          </div>
          {erro && <p className="text-xs text-red-600 dark:text-red-400 w-full">{erro}</p>}
          <button type="submit" className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl">Adicionar mesa</button>
        </form>

        <form onSubmit={criarLote} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4">
          <p className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-2">Criar várias de uma vez (mesas fixas numeradas)</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">De</label>
              <input type="number" value={loteDe} onChange={(e) => setLoteDe(e.target.value)} required
                className="w-24 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Até</label>
              <input type="number" value={loteAte} onChange={(e) => setLoteAte(e.target.value)} required
                className="w-24 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={loteSalvando}
              className="px-4 py-2 bg-zinc-800 text-white text-sm font-bold rounded-xl disabled:opacity-50">
              {loteSalvando ? 'Criando...' : 'Criar mesas'}
            </button>
          </div>
          {loteErro && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{loteErro}</p>}
          {loteResultado && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
              {loteResultado.criadas} mesa(s) criada(s){loteResultado.ja_existiam > 0 ? `, ${loteResultado.ja_existiam} já existiam (puladas)` : ''}.
            </p>
          )}
        </form>

        {mesas.length > 0 && (
          <div className="flex justify-end mb-3">
            <button onClick={limparTodas} disabled={limpando}
              className="px-3 py-1.5 text-xs font-bold border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50">
              {limpando ? 'Limpando...' : 'Limpar mesas (apagar todas)'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {mesas.map((m) => (
            <div key={m.id} className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3 text-center">
              <p className="text-lg font-black text-[#18181B] dark:text-[#F4F4F5]">{m.numero}</p>
              {m.nome && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{m.nome}</p>}
              <p className="text-[10px] text-[#A1A1AA] mt-1">{m.status}</p>
              {m.status === 'livre' && (
                <button onClick={() => remover(m.id)} className="text-[10px] text-red-500 dark:text-red-400 mt-1">Remover</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestauranteMesas;
