import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getCozinhaToken, setCozinhaToken, clearCozinhaToken, resgatarToken,
  getKdsItens, marcarItemPronto, reimprimirItem, iniciarPreparoItem, voltarStatusItem,
} from '../../services/cozinhaPortalService';
import { printTicketSetor } from '../../utils/printComanda';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';
import SalaoItemCard from '../../components/restaurante/SalaoItemCard';

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
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">Cole o token de cozinha recebido do restaurante</p>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const impressoraId = searchParams.get('impressora_id');
  const setorNome = searchParams.get('setor') ?? 'Setor';

  const [authed, setAuthed] = useState(() => {
    const urlToken = searchParams.get('cozinha_token');
    if (urlToken) setCozinhaToken(urlToken);
    return !!getCozinhaToken();
  });

  // Token já foi salvo no localStorage acima — tira ele da URL visível pra não
  // ficar sentado no histórico do navegador / bookmarks indefinidamente. Se o
  // localStorage for limpo depois, o link original (QR/admin) ainda funciona,
  // só não fica mais exposto na barra de endereço depois do primeiro acesso.
  //
  // Além disso, resgata um token novo em troca do que veio na URL — o link
  // original (QR/mensagem) passa a valer só pra esse resgate único; se alguém
  // tiver copiado/fotografado a URL antes, não consegue mais nada com ela
  // depois que o token já foi trocado (ver F2 da auditoria de segurança).
  useEffect(() => {
    if (!searchParams.get('cozinha_token')) return;
    const limpo = new URLSearchParams(searchParams);
    limpo.delete('cozinha_token');
    setSearchParams(limpo, { replace: true });

    resgatarToken()
      .then(({ token }) => setCozinhaToken(token))
      .catch(() => {}); // falhou: segue com o token da URL, já persistido acima
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState(null);
  const [verTodosProntos, setVerTodosProntos] = useState(false);
  const now = useNowTick();

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

  const voltar = async (item) => {
    await voltarStatusItem(item.id);
    carregar();
  };

  const reimprimir = async (item) => {
    try {
      const res = await reimprimirItem(item.id);
      if (res.via === 'navegador') {
        printTicketSetor([item], { mesaLabel: item.mesa, cliente_mesa_nome: item.cliente, numero_comanda: item.numero_comanda }, setorNome);
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const aguardandoPreparo = itens.filter((i) => i.status === 'enviado');
  const emPreparo = itens.filter((i) => i.status === 'preparando');
  const prontos = itens
    .filter((i) => i.status === 'pronto')
    .sort((a, b) => new Date(b.pronto_em).getTime() - new Date(a.pronto_em).getTime());

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="p-4 max-w-5xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-black text-white uppercase">{setorNome}</h1>
        <button onClick={() => { clearCozinhaToken(); setAuthed(false); }} className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Sair</button>
      </div>
      {erro && <p className="text-sm text-red-400 mb-3 px-4 max-w-5xl mx-auto">{erro}</p>}

      <main className="p-5 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Aguardando Preparo</h2>
            {aguardandoPreparo.length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{aguardandoPreparo.length}</span>
            )}
          </div>
          {aguardandoPreparo.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
              <Icon name="CheckCircle" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum pedido aguardando</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aguardandoPreparo.map((item, idx) => (
                <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now}
                  onReimprimir={reimprimir} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Em Preparo</h2>
            {emPreparo.length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{emPreparo.length}</span>
            )}
          </div>
          {emPreparo.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
              <Icon name="ChefHat" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum pedido em preparo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emPreparo.map((item, idx) => (
                <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now}
                  onReimprimir={reimprimir} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar} />
              ))}
            </div>
          )}
        </div>
      </main>

      {prontos.length > 0 && (
        <div className="px-5 pb-5 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Prontos hoje (clicou errado? desfaz aqui)</h2>
            <span className="ml-auto bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{prontos.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(verTodosProntos ? prontos : prontos.slice(0, 5)).map((item, idx) => (
              <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now}
                onReimprimir={reimprimir} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar} />
            ))}
          </div>
          {prontos.length > 5 && (
            <button onClick={() => setVerTodosProntos((v) => !v)}
              className="mt-3 w-full py-2 text-xs font-bold text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10">
              {verTodosProntos ? 'Mostrar menos' : `Ver todos (${prontos.length})`}
            </button>
          )}
        </div>
      )}

      {itens.length === 0 && (
        <div className="text-center py-20">
          <Icon name="UtensilsCrossed" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Nenhum item pendente nesse setor</p>
        </div>
      )}
    </div>
  );
};

export default RestauranteKdsSetor;
