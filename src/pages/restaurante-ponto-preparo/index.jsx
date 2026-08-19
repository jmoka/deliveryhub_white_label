import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, iniciarPreparoItemRestaurante, voltarStatusItemRestaurante, getMinhaEmpresa } from '../../services/restauranteService';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';
import SalaoItemCard from '../../components/restaurante/SalaoItemCard';

// Tela genérica de ponto de preparo — gerada automaticamente pra qualquer impressora
// marcada como ponto_preparo em /restaurante/pontos-preparo (Churrasqueira, Drinks...).
// Mesmo padrão de Cozinha/Bar (fila aguardando/preparo/prontos, busca por código de
// barras, destaque animado), sem precisar codar uma página nova a cada ponto criado.
const RestaurantePontoPreparo = () => {
  const navigate = useNavigate();
  const { id: impressoraId } = useParams();
  const [impressoraInfo, setImpressoraInfo] = useState(undefined); // undefined = carregando, null = não encontrada
  const [restauranteNome, setRestauranteNome] = useState('');
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filtroCanal, setFiltroCanal] = useState('todos'); // 'todos' | 'delivery' | 'salao'
  const [busca, setBusca] = useState('');
  const [verTodosProntos, setVerTodosProntos] = useState(false);
  const now = useNowTick();
  const prevItemIds = useRef(new Set());
  const firstLoad = useRef(true);
  const tocarSom = useNotificacaoSonora('cozinha');

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
    listarImpressoras()
      .then((lista) => {
        const encontrada = (lista ?? []).find((i) => String(i.id) === String(impressoraId));
        setImpressoraInfo(encontrada ?? null);
        if (!encontrada) setLoading(false);
      })
      .catch((e) => { setErro(e.message); setLoading(false); });
  }, [impressoraId]);

  const carregar = useCallback(async () => {
    try {
      const { itens: novosItens } = await getKdsItensRestaurante(impressoraId);
      const idsAgora = new Set(novosItens.map((i) => i.id));
      if (!firstLoad.current) {
        const novos = [...idsAgora].filter((id) => !prevItemIds.current.has(id));
        if (novos.length > 0) tocarSom();
      } else {
        firstLoad.current = false;
      }
      prevItemIds.current = idsAgora;

      setItens(novosItens);
      setLastUpdate(new Date());
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, [impressoraId, tocarSom]);

  useEffect(() => {
    if (!impressoraInfo) return;
    carregar();
    const interval = setInterval(carregar, 15000);
    return () => clearInterval(interval);
  }, [impressoraInfo, carregar]);

  const marcarPronto = async (itemId) => {
    await marcarItemProntoRestaurante(itemId);
    carregar();
  };

  const iniciarPreparo = async (item) => {
    await iniciarPreparoItemRestaurante(item.id);
    carregar();
  };

  const voltar = async (item) => {
    try {
      await voltarStatusItemRestaurante(item.id);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!impressoraInfo) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="text-center">
          <Icon name="Printer" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Ponto de preparo não encontrado</p>
          {erro && <p className="text-[#3A3A3A] text-sm mt-1">{erro}</p>}
          <button onClick={() => navigate('/restaurante/pontos-preparo')}
            className="mt-4 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
            Ir pra Pontos de Preparo
          </button>
        </div>
      </div>
    );
  }

  const buscaNormalizada = busca.trim().toLowerCase();
  // Leitor de código de barras digita os dígitos zero-padded (ver barcodeValue em
  // printComanda.js) e manda Enter — bate exato no numero_comanda, não por substring
  // (senão "00000042" nunca acharia a comanda #42).
  const numeroComandaEscaneado = /^\d+$/.test(busca.trim()) ? parseInt(busca.trim(), 10) : null;
  const passaBusca = (i) => {
    if (!buscaNormalizada) return true;
    if (numeroComandaEscaneado !== null && i.numero_comanda === numeroComandaEscaneado) return true;
    const alvo = [i.cliente, i.mesa, i.mesa_numero, i.numero_comanda, i.garcom]
      .filter((v) => v !== null && v !== undefined)
      .join(' ')
      .toLowerCase();
    return alvo.includes(buscaNormalizada);
  };
  const itensFiltrados = itens.filter((i) => (filtroCanal === 'todos' || i.tipo === filtroCanal) && passaBusca(i));
  const aguardando = itensFiltrados.filter((i) => i.status === 'enviado');
  const emPreparo = itensFiltrados.filter((i) => i.status === 'preparando');
  const prontos = itensFiltrados.filter((i) => i.status === 'pronto')
    .sort((a, b) => new Date(b.pronto_em).getTime() - new Date(a.pronto_em).getTime());
  const totalDelivery = itens.filter((i) => i.tipo === 'delivery').length;
  const totalSalao = itens.filter((i) => i.tipo === 'salao').length;
  const itemEncontradoBusca = numeroComandaEscaneado !== null && itens.some((i) => i.numero_comanda === numeroComandaEscaneado);
  const corBuscaCod = numeroComandaEscaneado === null ? null : itemEncontradoBusca ? 'ok' : 'erro';

  return (
    <div className="min-h-screen bg-[#111111]">
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-5 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/restaurante')} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF441F] rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name={impressoraInfo.icone || 'ChefHat'} size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">{impressoraInfo.nome}</p>
              <p className="text-[#71717A] text-xs">{restauranteNome}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
            </div>
            <button onClick={carregar} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
        </div>

        {/* Busca por cliente, mesa, comanda, garçom ou leitor de código de barras — mesma
            caixa (cor, botão Buscar, texto de confirmação) de Cozinha/Bar/Produção */}
        <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border transition-colors ${
          corBuscaCod === 'ok' ? 'border-green-500 bg-green-900/20' :
          corBuscaCod === 'erro' ? 'border-red-500 bg-red-900/20' :
          'border-[#2A2A2A] bg-[#111111] focus-within:border-[#FF441F]'
        }`}>
          <Icon name="ScanLine" size={16} className={`flex-shrink-0 ${corBuscaCod === 'ok' ? 'text-green-400' : corBuscaCod === 'erro' ? 'text-red-400' : 'text-[#71717A]'}`} />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente, mesa, comanda, garçom ou aponte o leitor..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-[#3A3A3A] outline-none"
          />
          {busca && (
            <>
              <button
                onClick={() => {
                  const alvo = itens.find((i) => i.numero_comanda === numeroComandaEscaneado);
                  if (alvo) document.getElementById(`salao-item-${alvo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="flex-shrink-0 px-3 py-1 bg-[#FF441F] text-white text-xs font-bold rounded-lg hover:bg-[#E63A19]">
                Buscar
              </button>
              <button onClick={() => setBusca('')} className="text-[#71717A] hover:text-white flex-shrink-0">
                <Icon name="X" size={15} />
              </button>
            </>
          )}
        </div>
        {corBuscaCod && (
          <p className={`text-xs font-semibold mt-1.5 ${corBuscaCod === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {corBuscaCod === 'ok' ? `Comanda #${numeroComandaEscaneado} encontrada` : `Comanda #${numeroComandaEscaneado} não encontrada`}
          </p>
        )}

        {/* Filtro de canal — Todos/Delivery/Salão */}
        <div className="flex items-center gap-2 mt-3">
          {[
            { key: 'todos', label: 'Todos', count: totalDelivery + totalSalao },
            { key: 'delivery', label: 'Delivery', count: totalDelivery },
            { key: 'salao', label: 'Salão', count: totalSalao },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroCanal(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filtroCanal === f.key
                  ? 'bg-[#FF441F] text-white'
                  : 'bg-[#111111] text-[#71717A] border border-[#2A2A2A] hover:text-white'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filtroCanal === f.key ? 'bg-white/20' : 'bg-[#2A2A2A]'}`}>{f.count}</span>
            </button>
          ))}
        </div>
      </header>

      {erro && (
        <div className="mx-5 mt-4 bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <main className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Aguardando</h2>
            {aguardando.length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{aguardando.length}</span>
            )}
          </div>
          {aguardando.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
              <Icon name="CheckCircle" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum pedido aguardando</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aguardando.map((item, idx) => (
                <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar}
                  highlighted={numeroComandaEscaneado !== null && item.numero_comanda === numeroComandaEscaneado} />
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
              <Icon name={impressoraInfo.icone || 'ChefHat'} size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum item em preparo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emPreparo.map((item, idx) => (
                <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar}
                  highlighted={numeroComandaEscaneado !== null && item.numero_comanda === numeroComandaEscaneado} />
              ))}
            </div>
          )}
        </div>

        {prontos.length > 0 && (
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Prontos hoje (clicou errado? desfaz aqui)</h2>
              <span className="ml-auto bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{prontos.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(verTodosProntos ? prontos : prontos.slice(0, 5)).map((item, idx) => (
                <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar}
                  highlighted={numeroComandaEscaneado !== null && item.numero_comanda === numeroComandaEscaneado} />
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
      </main>

      {itens.length === 0 && (
        <div className="text-center py-20">
          <Icon name={impressoraInfo.icone || 'ChefHat'} size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Nenhum item pendente nesse ponto de preparo</p>
        </div>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 15 segundos</p>
    </div>
  );
};

export default RestaurantePontoPreparo;
