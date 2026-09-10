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

// Seleção de produtos/combos que entram no pacote comprado — uma seção por
// carrossel da composição do pacote (ex: 1 no Combos + 3 em Bebidas), cada
// uma travada na própria quantidade (não dá pra selecionar a mais nem menos
// em nenhum carrossel). Mesmo padrão de checkbox+contador de antes, só que
// repetido por seção em vez de uma lista única de 1 carrossel só.
const SelecaoCarrossel = ({ carrossel, label, qtd, selecionados, onToggle }) => {
  const [carregando, setCarregando] = useState(true);
  const [itens, setItens] = useState([]);

  useEffect(() => {
    const buscar = carrossel === 'combos'
      ? getMeusCombos().then((r) => r.combos ?? [])
      : getMeusProdutos().then((r) => r.produtos ?? []);
    buscar.then((lista) => setItens(lista ?? [])).catch(() => {}).finally(() => setCarregando(false));
  }, [carrossel]);

  const marcados = selecionados.size;

  return (
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#71717A] mb-2">
        {label} — {marcados}/{qtd}
      </p>
      {carregando ? (
        <p className="text-xs text-[#A1A1AA] py-4 text-center">Carregando...</p>
      ) : itens.length === 0 ? (
        <p className="text-xs text-[#A1A1AA] py-4 text-center">Nenhum item cadastrado ainda.</p>
      ) : (
        <div className="space-y-1.5">
          {itens.map((item) => (
            <label key={item.id} className="flex items-center justify-between gap-2 cursor-pointer py-1">
              <span className="flex items-center gap-2 text-sm text-[#27272A]">
                <input
                  type="checkbox"
                  checked={selecionados.has(item.id)}
                  onChange={() => onToggle(item.id)}
                  disabled={!selecionados.has(item.id) && marcados >= qtd}
                  className="w-4 h-4 accent-[#FF441F]"
                />
                {item.name}
              </span>
              <span className="text-xs text-[#71717A]">{fmt(item.preco_promo ?? item.price)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const SelecionarItensModal = ({ pacote, onClose, onCriado }) => {
  const composicao = Object.entries(pacote.config ?? {}); // [[carrossel, qtd], ...]
  const [selecionados, setSelecionados] = useState(() =>
    Object.fromEntries(composicao.map(([c]) => [c, new Set()]))
  );
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const toggle = (carrossel, qtd, id) => {
    setSelecionados((atual) => {
      const novo = new Set(atual[carrossel]);
      if (novo.has(id)) novo.delete(id);
      else if (novo.size < qtd) novo.add(id);
      return { ...atual, [carrossel]: novo };
    });
  };

  const totalQtd = composicao.reduce((soma, [, qtd]) => soma + qtd, 0);
  const totalSelecionado = Object.values(selecionados).reduce((soma, s) => soma + s.size, 0);
  const completo = composicao.every(([c, qtd]) => (selecionados[c]?.size ?? 0) === qtd);

  const confirmar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      const itens = Object.fromEntries(composicao.map(([c]) => [c, [...selecionados[c]]]));
      const boost = await criarBoost(pacote.id, itens);
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
              Escolha os itens pra destacar por {pacote.dias} dias.
            </p>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-[#18181B]">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {composicao.map(([carrossel, qtd]) => (
            <SelecaoCarrossel
              key={carrossel}
              carrossel={carrossel}
              label={pacote.composicao?.find((c) => c.carrossel === carrossel)?.label ?? carrossel}
              qtd={qtd}
              selecionados={selecionados[carrossel] ?? new Set()}
              onToggle={(id) => toggle(carrossel, qtd, id)}
            />
          ))}
        </div>

        {erro && <p className="px-6 pb-2 text-xs text-red-600">{erro}</p>}

        <div className="px-6 py-4 border-t border-[#E4E4E7]">
          <button
            onClick={confirmar}
            disabled={!completo || enviando}
            className="w-full py-2.5 text-sm font-bold rounded-xl bg-[#FF441F] text-white disabled:opacity-40">
            {enviando ? 'Enviando...' : `Continuar (${totalSelecionado}/${totalQtd})`}
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

  // Um pacote agora pode cobrir vários carrosséis ao mesmo tempo (sua
  // composição), então não faz mais sentido agrupar por carrossel único —
  // lista os pacotes direto, cada um mostrando a própria composição.
  const composicaoTexto = (p) =>
    (p.composicao ?? []).map((c) => `${c.label}: ${c.qtd}`).join(' · ');

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
            {pacotes.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 mb-4">
                <h2 className="font-bold text-[#18181B] mb-3">Pacotes disponíveis</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {pacotes.map((p) => (
                    <div key={p.id} className="border border-[#E4E4E7] rounded-xl p-4">
                      <p className="font-semibold text-sm text-[#18181B]">{p.nome}</p>
                      <p className="text-xs text-[#71717A] mt-1">{composicaoTexto(p)} · {p.dias} dias</p>
                      <p className="text-lg font-black text-[#18181B] mt-2">{fmt(p.preco)}</p>
                      <p className="text-xs mt-1 text-[#71717A]">
                        {p.disponivel ? 'Vagas disponíveis' : 'Sem vagas no momento em ao menos um carrossel'}
                      </p>
                      <button
                        onClick={() => setPacoteSelecionado(p)}
                        disabled={!p.disponivel}
                        className="mt-3 w-full py-2 text-sm font-bold rounded-lg bg-[#FF441F] text-white disabled:opacity-40">
                        Comprar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          <p className="text-sm font-semibold text-[#18181B]">{b.marketplace_boost_pacotes?.nome ?? 'Campanha'}</p>
                          <p className="text-xs text-[#71717A]">{(b.composicao ?? []).map((c) => `${c.label}: ${c.qtd}`).join(' · ')}</p>
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
