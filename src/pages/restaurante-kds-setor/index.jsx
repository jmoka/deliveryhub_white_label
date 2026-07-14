import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getCozinhaToken, setCozinhaToken, clearCozinhaToken,
  getKdsItens, marcarItemPronto,
} from '../../services/cozinhaPortalService';
import Icon from '../../components/AppIcon';

const KdsLogin = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    setCozinhaToken(token.trim());
    try {
      onLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#2A2A2A] p-6 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="Printer" size={28} className="text-orange-400" />
          </div>
          <h1 className="text-lg font-black text-white">Tela de Setor (KDS)</h1>
          <p className="text-sm text-[#71717A] mt-1">Cole o token de cozinha recebido do restaurante</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token de acesso..." required
            className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-3 py-3 text-sm font-mono text-white focus:outline-none focus:border-orange-500" />
          {erro && <p className="text-xs text-red-400">{erro}</p>}
          <button type="submit" disabled={loading || !token.trim()}
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 text-sm">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

const RestauranteKdsSetor = () => {
  const [searchParams] = useSearchParams();
  const impressoraId = searchParams.get('impressora_id');
  const setorNome = searchParams.get('setor') ?? 'Setor';

  const [authed, setAuthed] = useState(() => {
    const urlToken = searchParams.get('cozinha_token');
    if (urlToken) setCozinhaToken(urlToken);
    return !!getCozinhaToken();
  });
  const [grupos, setGrupos] = useState([]);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!impressoraId) return;
    try {
      const { grupos } = await getKdsItens(impressoraId);
      setGrupos(grupos);
      setErro(null);
    } catch (err) {
      if (!getCozinhaToken()) setAuthed(false);
      setErro(err.message);
    }
  }, [impressoraId]);

  useEffect(() => {
    if (!authed) return;
    carregar();
    const interval = setInterval(carregar, 15000);
    return () => clearInterval(interval);
  }, [authed, carregar]);

  if (!authed) return <KdsLogin onLogin={() => setAuthed(true)} />;
  if (!impressoraId) {
    return <div className="min-h-screen bg-[#1A1A1A] text-white p-6">Adicione ?impressora_id=ID na URL.</div>;
  }

  const marcarPronto = async (itemId) => {
    await marcarItemPronto(itemId);
    carregar();
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-white uppercase">{setorNome}</h1>
        <button onClick={() => { clearCozinhaToken(); setAuthed(false); }} className="text-xs text-[#71717A]">Sair</button>
      </div>
      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {grupos.map((g) => (
          <div key={g.order_id} className="bg-[#232323] border border-[#2A2A2A] rounded-2xl p-4">
            <p className="text-sm font-bold text-white">{g.mesa ?? 'Avulsa'}</p>
            {g.cliente && <p className="text-xs text-[#71717A] mb-2">{g.cliente}</p>}
            <div className="space-y-2 mt-2">
              {g.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#1A1A1A] rounded-xl px-3 py-2">
                  <span className="text-sm text-white">{item.quantity}x {item.product_name}</span>
                  <button onClick={() => marcarPronto(item.id)}
                    className="text-xs font-bold text-emerald-400 border border-emerald-500/40 rounded-lg px-2 py-1 hover:bg-emerald-500/10">
                    Pronto
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {grupos.length === 0 && <p className="text-sm text-[#71717A]">Nenhum item pendente nesse setor.</p>}
      </div>
    </div>
  );
};

export default RestauranteKdsSetor;
