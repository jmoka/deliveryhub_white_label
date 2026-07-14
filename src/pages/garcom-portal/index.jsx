import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  login, getGarcomToken, setGarcomToken,
  getMesas, getProdutos, getMinhasComandas, getComanda,
  abrirComanda, adicionarItens, enviarItens, fecharComanda,
} from '../../services/garcomService';
import { printTicketSetor } from '../../utils/printComanda';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const MESA_STATUS_COR = {
  livre: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ocupada: 'bg-orange-100 text-orange-700 border-orange-200',
  aguardando_pagamento: 'bg-blue-100 text-blue-700 border-blue-200',
};
const MESA_STATUS_LABEL = { livre: 'Livre', ocupada: 'Ocupada', aguardando_pagamento: 'Aguard. pagamento' };

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
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 w-full max-w-sm shadow-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#FF441F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="UtensilsCrossed" size={28} className="text-[#FF441F]" />
          </div>
          <h1 className="text-lg font-black text-[#18181B]">Portal do Garçom</h1>
          <p className="text-sm text-[#71717A] mt-1">Digite sua senha pra entrar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoFocus
            required
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#FF441F]"
          />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
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
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#18181B] mb-1">
          {mesa ? `Abrir Mesa ${mesa.numero}` : 'Abrir comanda avulsa'}
        </h2>
        <p className="text-xs text-[#71717A] mb-4">Nome e telefone do cliente são obrigatórios antes de vender.</p>
        <form onSubmit={submit} className="space-y-3">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" required
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone do cliente" required
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">
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

const FecharComandaModal = ({ comanda, onFechar, onFechada }) => {
  const [forma, setForma] = useState('pix');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const confirmar = async () => {
    setErro(null);
    setSalvando(true);
    try {
      await fecharComanda(comanda.id, forma);
      onFechada();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível fechar a comanda.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#18181B] mb-1">Fechar comanda</h2>
        <p className="text-xs text-[#71717A] mb-4">
          A mesa fica bloqueada aguardando pagamento — quem finaliza e emite o recibo é o caixa.
        </p>
        <label className="text-xs text-[#71717A]">Forma de pagamento informada pelo cliente</label>
        <select value={forma} onChange={(e) => setForma(e.target.value)}
          className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm mt-1 mb-3">
          <option value="pix">PIX</option>
          <option value="credit_card">Cartão de crédito</option>
          <option value="debit_card">Cartão de débito</option>
          <option value="cash">Dinheiro</option>
        </select>
        {erro && <p className="text-xs text-red-600 mb-2">{erro}</p>}
        <div className="flex gap-2">
          <button onClick={onFechar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">
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

const ComandaDetalhe = ({ comandaId, onVoltar }) => {
  const [comanda, setComanda] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [mostrarFechar, setMostrarFechar] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    const [c, p] = await Promise.all([getComanda(comandaId), getProdutos()]);
    setComanda(c);
    setProdutos(p);
  }, [comandaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const adicionar = async () => {
    if (!produtoSelecionado) return;
    setErro(null);
    try {
      await adicionarItens(comandaId, [{ product_id: Number(produtoSelecionado), quantity: Number(quantidade) || 1 }]);
      setProdutoSelecionado('');
      setQuantidade(1);
      await carregar();
    } catch (err) {
      setErro(err.message ?? 'Não foi possível adicionar o item.');
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

  if (!comanda) return <div className="p-6 text-sm text-[#71717A]">Carregando...</div>;

  const total = (comanda.itens ?? []).reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const temPendente = (comanda.itens ?? []).some((i) => i.status === 'pendente');
  const fechada = comanda.status === 'fechada_garcom';

  return (
    <div className="min-h-screen bg-[#F4F4F5] pb-24">
      <div className="bg-white border-b border-[#E4E4E7] p-4 sticky top-0 z-10">
        <button onClick={onVoltar} className="flex items-center gap-1 text-sm text-[#71717A] mb-2">
          <Icon name="ArrowLeft" size={16} /> Voltar
        </button>
        <h1 className="text-base font-bold text-[#18181B]">
          {comanda.mesa_id ? `Mesa ${comanda.mesas?.numero ?? comanda.mesa_id}` : 'Comanda avulsa'}
        </h1>
        <p className="text-xs text-[#71717A]">{comanda.cliente_mesa_nome} · {comanda.cliente_mesa_telefone}</p>
        {fechada && (
          <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-2 py-1 mt-2 inline-block">
            Fechada — aguardando pagamento no caixa
          </p>
        )}
      </div>

      <div className="p-4 space-y-2">
        {(comanda.itens ?? []).map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-[#E4E4E7] p-3 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                {item.products?.image_url
                  ? <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={16} className="text-[#A1A1AA]" /></div>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#18181B] truncate">{item.quantity}x {item.products?.name}</p>
                <p className="text-xs text-[#71717A]">{fmt(item.unit_price)} un.</p>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
              item.status === 'pendente' ? 'bg-zinc-100 text-zinc-600' : item.status === 'enviado' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {item.status === 'pendente' ? 'Não enviado' : item.status === 'enviado' ? 'Enviado' : 'Pronto'}
            </span>
          </div>
        ))}
        {(comanda.itens ?? []).length === 0 && (
          <p className="text-sm text-[#A1A1AA] text-center py-6">Nenhum item ainda.</p>
        )}
      </div>

      {!fechada && (
        <div className="p-4 bg-white border-t border-[#E4E4E7] fixed bottom-0 left-0 right-0">
          <div className="flex gap-2 mb-2">
            <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)}
              className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm">
              <option value="">Selecione um produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>
              ))}
            </select>
            <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
              className="w-16 border border-[#E4E4E7] rounded-xl px-2 py-2 text-sm text-center" />
            <button onClick={adicionar} className="px-3 py-2 bg-zinc-800 text-white rounded-xl text-sm font-medium">
              <Icon name="Plus" size={16} />
            </button>
          </div>
          {erro && <p className="text-xs text-red-600 mb-2">{erro}</p>}
          <div className="flex gap-2">
            <button onClick={enviar} disabled={!temPendente || enviando}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#FF441F] text-[#FF441F] disabled:opacity-40">
              {enviando ? 'Enviando...' : 'Enviar novos itens'}
            </button>
            <button onClick={() => setMostrarFechar(true)} disabled={(comanda.itens ?? []).length === 0}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] disabled:opacity-40">
              Fechar comanda
            </button>
          </div>
          <p className="text-right text-xs text-[#71717A] mt-2">Total: <strong className="text-[#18181B]">{fmt(total)}</strong></p>
        </div>
      )}

      {mostrarFechar && (
        <FecharComandaModal comanda={comanda} onFechar={() => setMostrarFechar(false)} onFechada={() => { setMostrarFechar(false); onVoltar(); }} />
      )}
    </div>
  );
};

const GarcomHome = () => {
  const [mesas, setMesas] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [aba, setAba] = useState('mesas');
  const [mesaParaAbrir, setMesaParaAbrir] = useState(undefined);
  const [comandaAtivaId, setComandaAtivaId] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([getMesas(), getMinhasComandas()]);
      setMesas(m);
      setComandas(c);
    } catch (err) {
      if (!getGarcomToken()) window.location.reload();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  if (comandaAtivaId) {
    return <ComandaDetalhe comandaId={comandaAtivaId} onVoltar={() => { setComandaAtivaId(null); carregar(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F4F5] pb-6">
      <div className="bg-white border-b border-[#E4E4E7] p-4">
        <h1 className="text-base font-bold text-[#18181B]">Salão</h1>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setAba('mesas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${aba === 'mesas' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>
            Mesas
          </button>
          <button onClick={() => setAba('comandas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${aba === 'comandas' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>
            Minhas comandas ({comandas.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-[#71717A]">Carregando...</div>
      ) : aba === 'mesas' ? (
        <div className="p-4 grid grid-cols-3 gap-3">
          {mesas.map((mesa) => (
            <button
              key={mesa.id}
              onClick={() => (mesa.status === 'livre' ? setMesaParaAbrir(mesa) : null)}
              disabled={mesa.status !== 'livre'}
              className={`rounded-xl border p-3 text-center ${MESA_STATUS_COR[mesa.status] ?? ''} disabled:opacity-70`}
            >
              <p className="text-lg font-black">{mesa.numero}</p>
              <p className="text-[10px] font-medium">{MESA_STATUS_LABEL[mesa.status] ?? mesa.status}</p>
            </button>
          ))}
          {mesas.length === 0 && <p className="col-span-3 text-sm text-[#A1A1AA] text-center py-6">Nenhuma mesa cadastrada.</p>}
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {comandas.map((c) => (
            <button key={c.id} onClick={() => setComandaAtivaId(c.id)}
              className="w-full bg-white rounded-xl border border-[#E4E4E7] p-3 flex justify-between items-center text-left">
              <div>
                <p className="text-sm font-medium text-[#18181B]">
                  {c.mesa_id ? `Mesa ${c.mesa_id}` : 'Avulsa'} — {c.cliente_mesa_nome}
                </p>
                <p className="text-xs text-[#71717A]">{c.status === 'aberta' ? 'Em aberto' : 'Aguardando pagamento'}</p>
              </div>
              <p className="text-sm font-bold text-[#18181B]">{fmt(c.total)}</p>
            </button>
          ))}
          {comandas.length === 0 && <p className="text-sm text-[#A1A1AA] text-center py-6">Nenhuma comanda em aberto.</p>}
        </div>
      )}

      <button
        onClick={() => setMesaParaAbrir(null)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#FF441F] text-white shadow-lg flex items-center justify-center"
      >
        <Icon name="Plus" size={24} />
      </button>

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
  const [authed, setAuthed] = useState(!!getGarcomToken());

  if (!authed) {
    return <GarcomLogin loginKey={loginKey} onLogin={() => setAuthed(true)} />;
  }

  return <GarcomHome />;
};

export default GarcomPortal;
