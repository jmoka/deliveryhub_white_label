import React, { useState, useEffect } from 'react';
import {
  getVagasBoost, salvarVagasBoost, getPacotesBoostAdmin, getCarrosseisBoost,
  criarPacoteBoost, atualizarPacoteBoost, removerPacoteBoost,
  getPresetsVagasBoost, criarPresetVagasBoost, aplicarPresetVagasBoost, removerPresetVagasBoost,
  getLimiteOrganicoBoost, salvarLimiteOrganicoBoost,
} from '../../services/marketplaceBoostAdminService';
import Icon from '../../components/AppIcon';
import AdminHeader from '../../components/admin/AdminHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const Modal = ({ pacote, carrosseis, presets, onClose, onSave }) => {
  const [form, setForm] = useState(
    pacote
      ? { nome: pacote.nome, dias: String(pacote.dias), preco: String(pacote.preco), ativo: pacote.ativo }
      : { nome: '', dias: '7', preco: '', ativo: true }
  );
  // Composição (quais carrosséis + quanto de cada) vem sempre de um perfil de
  // vagas salvo — não dá pra escolher carrossel/quantidade na mão aqui. Uma
  // vez criado, o pacote é congelado; editar não muda a composição.
  const [perfilId, setPerfilId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const isEdicao = !!pacote;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const labelDoCarrossel = (c) => carrosseis.find((x) => x.carrossel === c)?.label ?? c;

  const composicaoEdicao = isEdicao ? Object.entries(pacote.config ?? {}) : [];
  const perfilEscolhido = presets.find((p) => String(p.id) === perfilId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdicao && !perfilId) {
      setErro('Escolha um perfil de vagas.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const base = {
        nome: form.nome.trim(),
        dias: parseInt(form.dias, 10),
        preco: parseFloat(form.preco),
      };
      if (isEdicao) {
        await atualizarPacoteBoost(pacote.id, { ...base, ativo: form.ativo });
      } else {
        await criarPacoteBoost({ ...base, preset_id: parseInt(perfilId, 10) });
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Composição *</label>
            {isEdicao ? (
              <p className="text-sm text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
                {composicaoEdicao.map(([c, qtd]) => `${labelDoCarrossel(c)}: ${qtd}`).join(' · ')}
              </p>
            ) : (
              <>
                <select required value={perfilId} onChange={(e) => setPerfilId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Escolha um perfil de vagas...</option>
                  {presets.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                {presets.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Nenhum perfil de vagas salvo ainda — crie um na seção "Vagas pagas por carrossel" acima antes de criar um pacote.
                  </p>
                ) : perfilEscolhido && (
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                    {Object.entries(perfilEscolhido.config).map(([c, qtd]) => `${labelDoCarrossel(c)}: ${qtd}`).join(' · ')}
                    {' — '}esse é o pacote inteiro (1 preço, 1 prazo), não um pacote por carrossel.
                  </p>
                )}
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
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
  // Espelha o que está de fato salvo no banco (platform_settings) — `vagas`
  // é o rascunho editável nos campos, que pode divergir disso até clicar em
  // "Salvar vagas". Sem essa cópia separada não dá pra saber, só olhando a
  // tela, se um número já está valendo ou é só o que está digitado agora.
  const [vagasSalvas, setVagasSalvas] = useState(null);
  const [salvandoVagas, setSalvandoVagas] = useState(false);
  const [pacotes, setPacotes] = useState([]);
  const [carrosseis, setCarrosseis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [presets, setPresets] = useState([]);
  const [nomePerfil, setNomePerfil] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [aplicandoPerfilId, setAplicandoPerfilId] = useState(null);

  // Limite orgânico (grátis): um único número vale igual pra qualquer tag e
  // pra combos — não é por carrossel como "vagas", por isso guardado à
  // parte. Mesmo padrão rascunho/salvo de "vagas" pra mostrar o valor real.
  const [limiteOrganico, setLimiteOrganico] = useState('');
  const [limiteOrganicoSalvo, setLimiteOrganicoSalvo] = useState(null);
  const [salvandoLimiteOrganico, setSalvandoLimiteOrganico] = useState(false);

  const carregar = () => {
    setCarregando(true);
    Promise.all([getVagasBoost(), getPacotesBoostAdmin(), getCarrosseisBoost(), getPresetsVagasBoost(), getLimiteOrganicoBoost()])
      .then(([v, p, c, presetsResp, limiteResp]) => {
        setVagas(v); setVagasSalvas(v); setPacotes(p.pacotes ?? []); setCarrosseis(c ?? []); setPresets(presetsResp ?? []);
        setLimiteOrganico(String(limiteResp.limite)); setLimiteOrganicoSalvo(limiteResp.limite);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const salvarVagas = async () => {
    setSalvandoVagas(true);
    try {
      const novo = await salvarVagasBoost(vagas);
      setVagas(novo);
      setVagasSalvas(novo);
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoVagas(false);
    }
  };

  const salvarLimiteOrganico = async () => {
    setSalvandoLimiteOrganico(true);
    try {
      const { limite } = await salvarLimiteOrganicoBoost(parseInt(limiteOrganico || '0', 10));
      setLimiteOrganico(String(limite));
      setLimiteOrganicoSalvo(limite);
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoLimiteOrganico(false);
    }
  };

  // Salva a grade atual como um perfil nomeado novo (ex: "Black Friday") — não
  // mexe no que está valendo agora, só guarda pra poder aplicar depois.
  const salvarPerfil = async () => {
    if (!nomePerfil.trim()) return;
    setSalvandoPerfil(true);
    try {
      await criarPresetVagasBoost(nomePerfil.trim(), vagas);
      setNomePerfil('');
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const aplicarPerfil = async (preset) => {
    if (!window.confirm(`Aplicar o perfil "${preset.nome}"? Isso substitui as vagas em vigor agora.`)) return;
    setAplicandoPerfilId(preset.id);
    try {
      const novo = await aplicarPresetVagasBoost(preset.id);
      setVagas(novo);
      setVagasSalvas(novo);
    } catch (err) {
      alert(err.message);
    } finally {
      setAplicandoPerfilId(null);
    }
  };

  const removerPerfil = async (id) => {
    if (!window.confirm('Remover este perfil salvo?')) return;
    try {
      await removerPresetVagasBoost(id);
      carregar();
    } catch (err) {
      alert(err.message);
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

  const labelPorCarrossel = Object.fromEntries(carrosseis.map((c) => [c.carrossel, c.label]));
  const composicaoDoPacote = (p) =>
    Object.entries(p.config ?? {}).map(([c, qtd]) => `${labelPorCarrossel[c] ?? c}: ${qtd}`).join(' · ');

  // "Vagas pagas por carrossel" é um teto ÚNICO compartilhado por todos os
  // pacotes ao mesmo tempo — se um pacote pede mais do que o teto atual
  // permite em algum carrossel, ele nunca fica comprável, mesmo sem nenhum
  // outro pacote ocupando vaga nenhuma. Avisa aqui pra não descobrir só
  // quando o restaurante reclamar que o botão "Comprar" está desabilitado.
  const carrosseisInsuficientes = (p) =>
    Object.entries(p.config ?? {}).filter(([c, qtd]) => qtd > (vagasSalvas?.[c] ?? 0));

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
                {carrosseis.map((c) => {
                  const salvo = vagasSalvas?.[c.carrossel] ?? 0;
                  const naoSalvo = (vagas?.[c.carrossel] ?? 0) !== salvo;
                  return (
                    <div key={c.carrossel}>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">{c.label}</label>
                      <input type="number" min="0" value={vagas?.[c.carrossel] ?? 0}
                        onChange={(e) => setVagas((atual) => ({ ...atual, [c.carrossel]: parseInt(e.target.value || '0', 10) }))}
                        className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 ${
                          naoSalvo ? 'border-amber-400 dark:border-amber-600' : 'border-gray-300 dark:border-zinc-700'
                        }`} />
                      <p className={`text-[11px] mt-1 ${naoSalvo ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-400 dark:text-zinc-500'}`}>
                        {naoSalvo ? `Salvo: ${salvo} (não salvo)` : `Salvo: ${salvo}`}
                      </p>
                    </div>
                  );
                })}
              </div>
              <button onClick={salvarVagas} disabled={salvandoVagas}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {salvandoVagas ? 'Salvando...' : 'Salvar vagas'}
              </button>

              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">
                  Salvar esta combinação como um perfil nomeado (ex: "Padrão", "Black Friday") pra reaplicar depois sem precisar redigitar os números.
                </p>
                <div className="flex gap-2">
                  <input value={nomePerfil} onChange={(e) => setNomePerfil(e.target.value)}
                    placeholder="Nome do perfil"
                    className="flex-1 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={salvarPerfil} disabled={salvandoPerfil || !nomePerfil.trim()}
                    className="px-4 py-2 bg-gray-800 dark:bg-zinc-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 whitespace-nowrap">
                    {salvandoPerfil ? 'Salvando...' : 'Salvar como novo perfil'}
                  </button>
                </div>

                {presets.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {presets.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{p.nome}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {Object.entries(p.config).map(([carrossel, n]) => `${labelPorCarrossel[carrossel] ?? carrossel}: ${n}`).join(' · ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button onClick={() => aplicarPerfil(p)} disabled={aplicandoPerfilId === p.id}
                            className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50">
                            {aplicandoPerfilId === p.id ? 'Aplicando...' : 'Aplicar'}
                          </button>
                          <button onClick={() => removerPerfil(p.id)} className="text-xs font-semibold text-red-600 hover:underline">Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 mb-5">
              <h2 className="font-bold text-gray-900 dark:text-zinc-100 mb-1">Limite orgânico grátis por empresa</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                Quantos produtos (por tag) e quantos combos uma empresa pode ter em cada carrossel sem pagar destaque — mesmo número vale pra Combos e pra qualquer tag (Lançamentos, Promoção etc.), inclusive tags criadas depois. Produtos/combos que já passavam desse número antes de configurar continuam valendo — o limite só barra adicionar mais.
              </p>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Itens grátis por carrossel</label>
                  <input type="number" min="0" value={limiteOrganico}
                    onChange={(e) => setLimiteOrganico(e.target.value)}
                    className={`w-32 border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 ${
                      parseInt(limiteOrganico || '0', 10) !== limiteOrganicoSalvo ? 'border-amber-400 dark:border-amber-600' : 'border-gray-300 dark:border-zinc-700'
                    }`} />
                </div>
                <button onClick={salvarLimiteOrganico} disabled={salvandoLimiteOrganico}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {salvandoLimiteOrganico ? 'Salvando...' : 'Salvar limite'}
                </button>
              </div>
              <p className={`text-[11px] mt-1.5 ${parseInt(limiteOrganico || '0', 10) !== limiteOrganicoSalvo ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-400 dark:text-zinc-500'}`}>
                {parseInt(limiteOrganico || '0', 10) !== limiteOrganicoSalvo ? `Salvo: ${limiteOrganicoSalvo} (não salvo)` : `Salvo: ${limiteOrganicoSalvo}`}
              </p>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 dark:text-zinc-100">Pacotes</h2>
              <button onClick={() => { setEditando(null); setModalAberto(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg">
                <Icon name="Plus" size={15} /> Novo pacote
              </button>
            </div>

            {pacotes.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500">Nenhum pacote cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {pacotes.map((p) => {
                  const insuficientes = carrosseisInsuficientes(p);
                  return (
                  <div key={p.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        {p.nome} {!p.ativo && <span className="text-xs font-normal text-gray-400">(inativo)</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{composicaoDoPacote(p)}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{p.dias} dias · {fmt(p.preco)}</p>
                      {p.ativo && insuficientes.length > 0 && (
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                          ⚠ Teto de vagas insuficiente em {insuficientes.map(([c, qtd]) => `${labelPorCarrossel[c] ?? c} (pede ${qtd}, teto salvo é ${vagasSalvas?.[c] ?? 0})`).join(', ')} — nunca fica comprável até subir "Vagas pagas por carrossel" acima.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditando(p); setModalAberto(true); }} className="text-xs font-semibold text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => remover(p.id)} className="text-xs font-semibold text-red-600 hover:underline">Remover</button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {modalAberto && (
        <Modal
          pacote={editando}
          carrosseis={carrosseis}
          presets={presets}
          onClose={() => setModalAberto(false)}
          onSave={() => { setModalAberto(false); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminMarketplaceBoost;
