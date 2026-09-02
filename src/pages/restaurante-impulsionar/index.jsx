import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import PagamentoFaturaModal from '../../components/restaurante/PagamentoFaturaModal';
import {
  getPacotesBoost, getMeusBoosts, criarBoost, getBoostDetalhe, pagarBoost,
  getMeusProdutos, getMeusCombos,
} from '../../services/restauranteService';
import { APP_NAME } from '../../constants/brand';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Seleção de produtos/combos que entram no pacote comprado — mesmo padrão do
// CardapioImpressoModal (checkbox + contador), mas trava exatamente na
// quantidade do pacote (não dá pra selecionar a mais nem gerar com menos).
const SelecionarItensModal = ({ pacote, onClose, onCriado }) => {
  const [carregando, setCarregando] = useState(true);
  const [itens, setItens] = useState([]);
  const [selecionados, setSelecionados] = useState(new Set());
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const buscar = pacote.carrossel === 'combos'
      ? getMeusCombos()
      : getMeusProdutos().then((r) => r.produtos ?? []);
    buscar.then((lista) => setItens(lista ?? [])).catch(() => {}).finally(() => setCarregando(false));
  }, [pacote.carrossel]);

  const toggle = (id) => {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else if (novo.size < pacote.qtd_produtos) novo.add(id);
      return novo;
    });
  };

  const confirmar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      const boost = await criarBoost(pacote.id, [...selecionados]);
      onCriado(boost);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md md:max-w-[85%] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7]">
          <div>
            <h2 className="text-lg font-bold text-[#18181B]">{pacote.nome}</h2>
            <p className="text-xs text-[#71717A]">
              Escolha {pacote.qtd_produtos} item(ns) pra destacar em "{pacote.carrossel_label ?? pacote.carrossel}" por {pacote.dias} dias.
            </p>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-[#18181B]">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
          {carregando ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Nenhum item cadastrado ainda.</p>
          ) : (
            itens.map((item) => (
              <label key={item.id} className="flex items-center justify-between gap-2 cursor-pointer py-1">
                <span className="flex items-center gap-2 text-sm text-[#27272A]">
                  <input
                    type="checkbox"
                    checked={selecionados.has(item.id)}
                    onChange={() => toggle(item.id)}
                    disabled={!selecionados.has(item.id) && selecionados.size >= pacote.qtd_produtos}
                    className="w-4 h-4 accent-[#FF441F]"
                  />
                  {item.name}
                </span>
                <span className="text-xs text-[#71717A]">{fmt(item.preco_promo ?? item.price)}</span>
              </label>
            ))
          )}
        </div>

        {erro && <p className="px-6 pb-2 text-xs text-red-600">{erro}</p>}

        <div className="px-6 py-4 border-t border-[#E4E4E7]">
          <button
            onClick={confirmar}
            disabled={selecionados.size !== pacote.qtd_produtos || enviando}
            className="w-full py-2.5 text-sm font-bold rounded-xl bg-[#FF441F] text-white disabled:opacity-40">
            {enviando ? 'Enviando...' : `Continuar (${selecionados.size}/${pacote.qtd_produtos})`}
          </button>
        </div>
      </div>
    </div>
  );
};

const RestauranteImpulsionar = () => {
  const [carregando, setCarregando] = useState(true);
  const [pacotes, setPacotes] = useState([]);
  const [boosts, setBoosts] = useState([]);
  const [pacoteSelecionado, setPacoteSelecionado] = useState(null);
  const [boostParaPagar, setBoostParaPagar] = useState(null);

  const carregar = () => {
    setCarregando(true);
    Promise.all([getPacotesBoost(), getMeusBoosts()])
      .then(([p, b]) => { setPacotes(p.pacotes ?? []); setBoosts(b.boosts ?? []); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  // Grupos na ordem em que os pacotes chegam do backend (já ordenado por
  // carrossel) — dinâmico, não depende de uma lista fixa de carrosséis.
  const gruposPorCarrossel = [];
  const indicePorCarrossel = {};
  for (const p of pacotes) {
    if (!(p.carrossel in indicePorCarrossel)) {
      indicePorCarrossel[p.carrossel] = gruposPorCarrossel.length;
      gruposPorCarrossel.push({ carrossel: p.carrossel, label: p.carrossel_label ?? p.carrossel, pacotes: [] });
    }
    gruposPorCarrossel[indicePorCarrossel[p.carrossel]].pacotes.push(p);
  }

  const statusBoost = (b) => {
    if (!b.pago_em) return { label: 'Aguardando pagamento', cor: 'bg-amber-100 text-amber-700' };
    if (new Date(b.fim_em) > new Date()) {
      return { label: `Ativo até ${new Date(b.fim_em).toLocaleDateString('pt-BR')}`, cor: 'bg-green-100 text-green-700' };
    }
    return { label: 'Expirado', cor: 'bg-gray-100 text-gray-500' };
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <RestauranteHeader active="/restaurante/impulsionar" title="Impulsionar no Marketplace" />

      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-lg font-black text-[#18181B] mb-1">Impulsionar no Marketplace</h1>
        <p className="text-sm text-[#71717A] mb-4">
          Pague pra aparecer em destaque nos carrosséis da home do {APP_NAME}, ao lado de outras lojas. Item patrocinado ganha uma etiqueta "Patrocinado" pro cliente final.
        </p>

        {carregando ? (
          <p className="text-sm text-[#71717A]">Carregando...</p>
        ) : (
          <>
            {gruposPorCarrossel.map((grupo) => (
              <div key={grupo.carrossel} className="bg-white rounded-2xl border border-[#E4E4E7] p-5 mb-4">
                <h2 className="font-bold text-[#18181B] mb-3">{grupo.label}</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {grupo.pacotes.map((p) => (
                    <div key={p.id} className="border border-[#E4E4E7] rounded-xl p-4">
                      <p className="font-semibold text-sm text-[#18181B]">{p.nome}</p>
                      <p className="text-xs text-[#71717A] mt-1">{p.qtd_produtos} item(ns) · {p.dias} dias</p>
                      <p className="text-lg font-black text-[#18181B] mt-2">{fmt(p.preco)}</p>
                      <p className="text-xs mt-1 text-[#71717A]">
                        {p.vagas_disponiveis > 0 ? `${p.vagas_disponiveis} vaga(s) disponível(is)` : 'Sem vagas no momento'}
                      </p>
                      <button
                        onClick={() => setPacoteSelecionado(p)}
                        disabled={p.vagas_disponiveis <= 0}
                        className="mt-3 w-full py-2 text-sm font-bold rounded-lg bg-[#FF441F] text-white disabled:opacity-40">
                        Comprar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {pacotes.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 text-center mb-4">
                <p className="text-sm text-[#71717A]">Nenhum pacote de destaque disponível no momento.</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
              <h2 className="font-bold text-[#18181B] mb-3">Minhas campanhas</h2>
              {boosts.length === 0 ? (
                <p className="text-xs text-[#A1A1AA]">Nenhuma campanha ainda.</p>
              ) : (
                <div className="space-y-2">
                  {boosts.map((b) => {
                    const st = statusBoost(b);
                    return (
                      <div key={b.id} className="flex items-center justify-between border border-[#E4E4E7] rounded-lg px-3 py-2 gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-[#18181B]">{b.marketplace_boost_pacotes?.nome ?? b.carrossel_label}</p>
                          <p className="text-xs text-[#71717A]">{b.carrossel_label ?? b.carrossel} · {b.item_ids?.length ?? 0} item(ns)</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cor}`}>{st.label}</span>
                          {!b.pago_em && (
                            <button onClick={() => setBoostParaPagar(b)} className="text-xs font-bold text-[#FF441F] hover:underline">
                              Pagar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {pacoteSelecionado && (
        <SelecionarItensModal
          pacote={pacoteSelecionado}
          onClose={() => setPacoteSelecionado(null)}
          onCriado={(boost) => { setPacoteSelecionado(null); setBoostParaPagar(boost); carregar(); }}
        />
      )}

      {boostParaPagar && (
        <PagamentoFaturaModal
          fatura={{ ...boostParaPagar, valor: boostParaPagar.valor_centavos / 100 }}
          pagarFn={pagarBoost}
          buscarStatusFn={getBoostDetalhe}
          onClose={() => setBoostParaPagar(null)}
          onPago={() => { setBoostParaPagar(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default RestauranteImpulsionar;
