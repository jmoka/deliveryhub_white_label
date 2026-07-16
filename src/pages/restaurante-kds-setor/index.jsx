import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getCozinhaToken, setCozinhaToken, clearCozinhaToken,
  getKdsItens, marcarItemPronto, reimprimirItem, iniciarPreparoItem,
} from '../../services/cozinhaPortalService';
import { printTicketSetor } from '../../utils/printComanda';
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
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!impressoraId) return;
    try {
      const { itens } = await getKdsItens(impressoraId);
      setItens(itens);
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

  const iniciarPreparo = async (item) => {
    await iniciarPreparoItem(item.id);
    carregar();
  };

  const reimprimir = async (item) => {
    try {
      const res = await reimprimirItem(item.id);
      if (res.via === 'navegador') {
        printTicketSetor([item], { mesaLabel: item.mesa, cliente_mesa_nome: item.cliente }, setorNome);
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-white uppercase">{setorNome}</h1>
        <button onClick={() => { clearCozinhaToken(); setAuthed(false); }} className="text-xs text-[#71717A]">Sair</button>
      </div>
      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {itens.map((item, idx) => (
          <div key={item.id} className={`bg-[#232323] border rounded-2xl p-4 ${idx === 0 ? 'border-yellow-400/70 ring-1 ring-yellow-400/30' : 'border-[#2A2A2A]'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-yellow-400 text-black' : 'bg-[#2A2A2A] text-white'}`}>
                  {idx + 1}
                </span>
                <span className="text-sm font-bold text-white">{item.quantity}x {item.product_name}</span>
              </div>
              <button onClick={() => reimprimir(item)}
                className="text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-500/10 flex items-center gap-1 flex-shrink-0">
                <Icon name="Printer" size={11} /> Reimpressão
              </button>
            </div>
            {idx === 0 && <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide mb-1">Próximo da fila</p>}
            <div className="flex items-center gap-2 text-xs text-[#71717A] mb-3">
              <Icon name="MapPin" size={12} />
              <span>{item.mesa ?? item.cliente ?? 'Avulsa'}</span>
              {item.garcom && (
                <>
                  <span className="text-[#3A3A3A]">•</span>
                  <Icon name="User" size={12} />
                  <span>{item.garcom}</span>
                </>
              )}
            </div>
            {item.status === 'enviado' ? (
              <button onClick={() => iniciarPreparo(item)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                <Icon name="ChefHat" size={13} /> Iniciar Preparo
              </button>
            ) : (
              <button onClick={() => marcarPronto(item.id)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                <Icon name="Check" size={13} /> Pronto
              </button>
            )}
          </div>
        ))}
        {itens.length === 0 && <p className="text-sm text-[#71717A]">Nenhum item pendente nesse setor.</p>}
      </div>
    </div>
  );
};

export default RestauranteKdsSetor;
