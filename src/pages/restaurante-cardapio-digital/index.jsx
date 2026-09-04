import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../components/AppIcon';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import {
  getMinhaEmpresa, getMeusProdutos, getObservacoesCategorias, salvarObservacaoCategoria,
} from '../../services/restauranteService';
import { printCartazCardapioDigital, printTicketCardapioDigital } from '../../utils/printComanda';
import { printCardapioImpresso, montarHtmlCardapioImpresso } from '../../utils/printCardapioImpresso';
import ImageUpload from '../../components/ui/ImageUpload';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import { getTermos } from '../../hooks/useTerminologiaEstabelecimento';

const fmtPreco = (v) => `R$ ${Number(v ?? 0).toFixed(2).replace('.', ',')}`;

const LS_RODAPE = 'cardapioImpresso.rodape';
const LS_USAR_LOGO = 'cardapioImpresso.usarLogo';
const LS_OBS_GERAL = 'cardapioImpresso.observacaoGeral';
const LS_IMAGEM_FUNDO = 'cardapioImpresso.imagemFundo';
const LS_OCULTAR_TITULO_CATEGORIA = 'cardapioImpresso.ocultarTituloCategoria';
const LS_ORDEM_CATEGORIAS = 'cardapioImpresso.ordemCategorias';
const LS_ORDEM_GRUPOS = 'cardapioImpresso.ordemGrupos';

const CardapioImpressoModal = ({ onClose }) => {
  const [carregando, setCarregando] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [selecionados, setSelecionados] = useState(new Set());
  const [usarLogo, setUsarLogo] = useState(() => localStorage.getItem(LS_USAR_LOGO) !== 'false');
  const [rodape, setRodape] = useState(() => localStorage.getItem(LS_RODAPE) ?? '');
  const [observacaoGeral, setObservacaoGeral] = useState(() => localStorage.getItem(LS_OBS_GERAL) ?? '');
  const [imagemFundo, setImagemFundo] = useState(() => localStorage.getItem(LS_IMAGEM_FUNDO) ?? '');
  const [ocultarTituloCategoria, setOcultarTituloCategoria] = useState(() => localStorage.getItem(LS_OCULTAR_TITULO_CATEGORIA) === 'true');
  // Nomes de categoria na ordem manual escolhida pelo dono (ex: Lanches antes de
  // Bebidas) — categoria que ainda não apareceu aqui cai no fim, em ordem alfabética.
  const [ordemCategorias, setOrdemCategorias] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_ORDEM_CATEGORIAS) ?? '[]'); } catch { return []; }
  });
  // Mesma ideia, mas pro nível de GRUPO (ex: mover "Tira Gosto" inteiro pra
  // cima de "Refeição 4 Pessoas") — grupo "sem grupo" (nome null) não entra
  // aqui, fica sempre por último como já era antes.
  const [ordemGrupos, setOrdemGrupos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_ORDEM_GRUPOS) ?? '[]'); } catch { return []; }
  });
  // category_id -> observação (salva no banco, ver GET/PUT /restaurante/categorias/observacoes)
  const [observacoesCategoria, setObservacoesCategoria] = useState({});
  // HTML da prévia (null = prévia fechada) — só computador, ver botão "Visualizar".
  const [htmlPreview, setHtmlPreview] = useState(null);

  useEffect(() => {
    Promise.all([getMeusProdutos(), getMinhaEmpresa(), getObservacoesCategorias()])
      .then(([p, e, obs]) => {
        const lista = p.produtos ?? [];
        setProdutos(lista);
        setEmpresa(e.empresa);
        setSelecionados(new Set(lista.map((item) => item.id)));
        const mapa = {};
        for (const o of obs.observacoes ?? []) mapa[o.category_id] = o.observacao;
        setObservacoesCategoria(mapa);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const alterarObservacaoCategoria = (categoryId, texto) => {
    setObservacoesCategoria((atual) => ({ ...atual, [categoryId]: texto }));
  };

  const salvarObservacaoAoSair = (categoryId, texto) => {
    salvarObservacaoCategoria(categoryId, texto).catch(() => {});
  };

  // Aplica a ordem manual (por nome) dentro de um mesmo bucket (grupo ou "sem
  // grupo") — quem ainda não foi reordenado cai no fim, alfabético entre si.
  const ordenarCategorias = (categorias) => {
    const comIndice = categorias.map((c) => ({ c, i: ordemCategorias.indexOf(c.nome) }));
    comIndice.sort((a, b) => {
      if (a.i === -1 && b.i === -1) return a.c.nome.localeCompare(b.c.nome);
      if (a.i === -1) return 1;
      if (b.i === -1) return -1;
      return a.i - b.i;
    });
    return comIndice.map(({ c }) => c);
  };

  const moverCategoria = (categoriasDoBucket, indice, direcao) => {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= categoriasDoBucket.length) return;
    const nomeA = categoriasDoBucket[indice].nome;
    const nomeB = categoriasDoBucket[alvo].nome;
    setOrdemCategorias((atual) => {
      const base = [...atual];
      for (const c of categoriasDoBucket) if (!base.includes(c.nome)) base.push(c.nome);
      const ia = base.indexOf(nomeA);
      const ib = base.indexOf(nomeB);
      [base[ia], base[ib]] = [base[ib], base[ia]];
      return base;
    });
  };

  // Digitar a posição direto, em vez de clicar ↑/↓ várias vezes — reaproveita
  // moverCategoria em sucessivos passos de 1, que já sabe reordenar certo.
  const moverCategoriaParaPosicao = (categoriasDoBucket, indiceAtual, novaPosicao1based) => {
    const total = categoriasDoBucket.length;
    const alvo = Math.min(Math.max(1, novaPosicao1based || 1), total) - 1;
    let atual = [...categoriasDoBucket];
    let idx = indiceAtual;
    while (idx !== alvo) {
      const direcao = alvo > idx ? 1 : -1;
      moverCategoria(atual, idx, direcao);
      const tmp = atual[idx]; atual[idx] = atual[idx + direcao]; atual[idx + direcao] = tmp;
      idx += direcao;
    }
  };

  // Mesma lógica de ordenarCategorias/moverCategoria, um nível acima (grupos
  // nomeados entre si — "sem grupo" nunca entra, sempre fica por último).
  const ordenarGrupos = (listaGrupos) => {
    const nomeados = listaGrupos.filter((g) => g.nome);
    const semGrupo = listaGrupos.filter((g) => !g.nome);
    const comIndice = nomeados.map((g) => ({ g, i: ordemGrupos.indexOf(g.nome) }));
    comIndice.sort((a, b) => {
      if (a.i === -1 && b.i === -1) return a.g.nome.localeCompare(b.g.nome);
      if (a.i === -1) return 1;
      if (b.i === -1) return -1;
      return a.i - b.i;
    });
    return [...comIndice.map(({ g }) => g), ...semGrupo];
  };

  const moverGrupo = (gruposNomeados, indice, direcao) => {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= gruposNomeados.length) return;
    const nomeA = gruposNomeados[indice].nome;
    const nomeB = gruposNomeados[alvo].nome;
    setOrdemGrupos((atual) => {
      const base = [...atual];
      for (const g of gruposNomeados) if (!base.includes(g.nome)) base.push(g.nome);
      const ia = base.indexOf(nomeA);
      const ib = base.indexOf(nomeB);
      [base[ia], base[ib]] = [base[ib], base[ia]];
      return base;
    });
  };

  const moverGrupoParaPosicao = (gruposNomeados, indiceAtual, novaPosicao1based) => {
    const total = gruposNomeados.length;
    const alvo = Math.min(Math.max(1, novaPosicao1based || 1), total) - 1;
    let atual = [...gruposNomeados];
    let idx = indiceAtual;
    while (idx !== alvo) {
      const direcao = alvo > idx ? 1 : -1;
      moverGrupo(atual, idx, direcao);
      const tmp = atual[idx]; atual[idx] = atual[idx + direcao]; atual[idx + direcao] = tmp;
      idx += direcao;
    }
  };

  // Agrupa em 2 níveis direto dos produtos (já vêm com category_name/grupo_name)
  // — não precisa buscar /categorias à parte pra montar essa lista. Grupo é
  // opcional: produto sem grupo_name cai no bucket "sem grupo" (nome: null),
  // renderizado por último, sem cabeçalho de grupo.
  const grupos = useMemo(() => {
    const porGrupo = new Map();
    for (const p of produtos) {
      const grupoNome = p.grupo_name || null;
      const categoriaNome = p.category_name || 'Outros';
      if (!porGrupo.has(grupoNome)) porGrupo.set(grupoNome, new Map());
      const porCategoria = porGrupo.get(grupoNome);
      if (!porCategoria.has(categoriaNome)) porCategoria.set(categoriaNome, []);
      porCategoria.get(categoriaNome).push(p);
    }

    const montarCategorias = (porCategoria) =>
      [...porCategoria.entries()]
        // category_id vem igual pra todo produto do mesmo nome de categoria
        // dentro desta loja — pega do primeiro item só pra ligar com a
        // observação salva.
        .map(([nome, itens]) => ({ nome, id: itens[0]?.category_id ?? null, produtos: itens }))
        .sort((a, b) => a.nome.localeCompare(b.nome));

    const nomeados = [...porGrupo.entries()]
      .filter(([nome]) => nome !== null)
      .map(([nome, porCategoria]) => ({ nome, categorias: montarCategorias(porCategoria) }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const semGrupo = porGrupo.has(null)
      ? [{ nome: null, categorias: montarCategorias(porGrupo.get(null)) }]
      : [];

    return [...nomeados, ...semGrupo];
  }, [produtos]);

  const toggleProduto = (id) => {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  const toggleCategoria = (categoria) => {
    const ids = categoria.produtos.map((p) => p.id);
    const todosSelecionados = ids.every((id) => selecionados.has(id));
    setSelecionados((atual) => {
      const novo = new Set(atual);
      ids.forEach((id) => (todosSelecionados ? novo.delete(id) : novo.add(id)));
      return novo;
    });
  };

  const selecionarTodos = () => {
    setSelecionados((atual) => (atual.size === produtos.length ? new Set() : new Set(produtos.map((p) => p.id))));
  };

  const montarArgsImpressao = () => {
    localStorage.setItem(LS_RODAPE, rodape);
    localStorage.setItem(LS_USAR_LOGO, String(usarLogo));
    localStorage.setItem(LS_OBS_GERAL, observacaoGeral);
    localStorage.setItem(LS_IMAGEM_FUNDO, imagemFundo);
    localStorage.setItem(LS_OCULTAR_TITULO_CATEGORIA, String(ocultarTituloCategoria));
    localStorage.setItem(LS_ORDEM_CATEGORIAS, JSON.stringify(ordemCategorias));
    localStorage.setItem(LS_ORDEM_GRUPOS, JSON.stringify(ordemGrupos));

    const gruposSelecionados = ordenarGrupos(grupos)
      .map((g) => ({
        nome: g.nome,
        categorias: ordenarCategorias(g.categorias)
          .map((c) => ({
            nome: c.nome,
            produtos: c.produtos.filter((p) => selecionados.has(p.id)),
            observacao: (observacoesCategoria[c.id] ?? '').trim(),
          }))
          .filter((c) => c.produtos.length > 0),
      }))
      .filter((g) => g.categorias.length > 0);

    const endereco = empresa
      ? [empresa.address, empresa.neighborhood, empresa.city].filter(Boolean).join(', ')
      : '';

    return {
      grupos: gruposSelecionados,
      restauranteNome: empresa?.name,
      logoUrl: empresa?.logo_url,
      usarLogo,
      endereco,
      whatsapp: empresa?.whatsapp ?? '',
      rodape: rodape.trim(),
      observacaoGeral: observacaoGeral.trim(),
      imagemFundoUrl: imagemFundo,
      ocultarTituloCategoria,
    };
  };

  const gerar = () => {
    printCardapioImpresso(montarArgsImpressao());
    onClose();
  };

  const visualizar = () => {
    setHtmlPreview(montarHtmlCardapioImpresso({ ...montarArgsImpressao(), autoImprimir: false, mostrarNumeracao: true }));
  };

  const gruposOrdenados = ordenarGrupos(grupos);
  const gruposNomeadosOrdenados = gruposOrdenados.filter((g) => g.nome);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-md md:max-w-[85%] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7] dark:border-[#3F3F46]">
          <div>
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Cardápio impresso</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Escolha os produtos que entram na folha pra imprimir e plastificar.</p>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-[#E4E4E7] dark:border-[#3F3F46] overflow-y-auto px-6 py-3 space-y-3">
            <label className="flex items-center gap-2 text-sm text-[#27272A] dark:text-[#F4F4F5] cursor-pointer">
              <input type="checkbox" checked={usarLogo} onChange={(e) => setUsarLogo(e.target.checked)} className="w-4 h-4 accent-[#FF441F]" />
              Incluir logomarca no topo
            </label>
            <label className="flex items-start gap-2 text-sm text-[#27272A] dark:text-[#F4F4F5] cursor-pointer">
              <input type="checkbox" checked={ocultarTituloCategoria} onChange={(e) => setOcultarTituloCategoria(e.target.checked)} className="w-4 h-4 accent-[#FF441F] mt-0.5" />
              <span>Ocultar título das categorias (ex: "BEBIDAS") na impressão — reduz a altura e ajuda a caber em menos páginas</span>
            </label>
            <div>
              <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Observação geral (opcional)</label>
              <input type="text" value={observacaoGeral} onChange={(e) => setObservacaoGeral(e.target.value)}
                placeholder="Ex: Preços sujeitos a alteração sem aviso prévio"
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Frase do rodapé (opcional)</label>
              <input type="text" value={rodape} onChange={(e) => setRodape(e.target.value)}
                placeholder="Ex: Peça também pelo nosso delivery!"
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Imagem de fundo (opcional)</label>
              <ImageUpload value={imagemFundo} onChange={setImagemFundo} folder="cardapio-impresso" aspect="wide" previewOpacity={0.3} />
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#E4E4E7] dark:border-[#3F3F46] shrink-0">
              <label className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] cursor-pointer">
                <input type="checkbox" checked={produtos.length > 0 && selecionados.size === produtos.length} onChange={selecionarTodos} className="w-4 h-4 accent-[#FF441F]" />
                Selecionar todos ({produtos.length})
              </label>
              <span className="text-xs font-semibold text-[#18181B] dark:text-[#F4F4F5]">{selecionados.size} selecionado(s)</span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {carregando ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Carregando...</p>
          ) : grupos.length === 0 ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Nenhum produto cadastrado ainda.</p>
          ) : (
            gruposOrdenados.map((grupo) => (
              <div key={grupo.nome ?? '__sem_grupo__'} className="space-y-3">
                {grupo.nome && (
                  <div className="flex items-center gap-2 border-b border-[#FF441F]/30 pb-1">
                    <div className="text-xs font-black uppercase tracking-wide text-[#FF441F] flex-1 min-w-0 truncate">
                      {grupo.nome}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={gruposNomeadosOrdenados.length}
                        value={gruposNomeadosOrdenados.indexOf(grupo) + 1}
                        onChange={(e) => moverGrupoParaPosicao(gruposNomeadosOrdenados, gruposNomeadosOrdenados.indexOf(grupo), parseInt(e.target.value, 10))}
                        title="Posição deste grupo na impressão"
                        className="w-11 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-1 py-0.5 text-xs text-center"
                      />
                      <button type="button"
                        onClick={() => moverGrupo(gruposNomeadosOrdenados, gruposNomeadosOrdenados.indexOf(grupo), -1)}
                        disabled={gruposNomeadosOrdenados.indexOf(grupo) === 0}
                        title="Mover grupo pra cima na impressão"
                        className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed">
                        <Icon name="ChevronUp" size={14} />
                      </button>
                      <button type="button"
                        onClick={() => moverGrupo(gruposNomeadosOrdenados, gruposNomeadosOrdenados.indexOf(grupo), 1)}
                        disabled={gruposNomeadosOrdenados.indexOf(grupo) === gruposNomeadosOrdenados.length - 1}
                        title="Mover grupo pra baixo na impressão"
                        className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed">
                        <Icon name="ChevronDown" size={14} />
                      </button>
                    </div>
                  </div>
                )}
                {ordenarCategorias(grupo.categorias).map((categoria, indice, categoriasDoBucket) => {
                  const ids = categoria.produtos.map((p) => p.id);
                  const todosSelecionados = ids.every((id) => selecionados.has(id));
                  return (
                    <div key={categoria.nome}>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input type="checkbox" checked={todosSelecionados} onChange={() => toggleCategoria(categoria)} className="w-4 h-4 accent-[#FF441F] flex-shrink-0" />
                          <span className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">{categoria.nome}</span>
                        </label>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input
                            type="number"
                            min={1}
                            max={categoriasDoBucket.length}
                            value={indice + 1}
                            onChange={(e) => moverCategoriaParaPosicao(categoriasDoBucket, indice, parseInt(e.target.value, 10))}
                            title="Posição desta categoria na impressão"
                            className="w-11 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-1 py-0.5 text-xs text-center"
                          />
                          <button type="button" onClick={() => moverCategoria(categoriasDoBucket, indice, -1)} disabled={indice === 0}
                            title="Mover pra cima na impressão"
                            className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed">
                            <Icon name="ChevronUp" size={14} />
                          </button>
                          <button type="button" onClick={() => moverCategoria(categoriasDoBucket, indice, 1)} disabled={indice === categoriasDoBucket.length - 1}
                            title="Mover pra baixo na impressão"
                            className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed">
                            <Icon name="ChevronDown" size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="pl-6 space-y-1.5">
                        {categoria.produtos.map((p) => (
                          <label key={p.id} className="flex items-center justify-between gap-2 cursor-pointer">
                            <span className="flex items-center gap-2 text-sm text-[#27272A] dark:text-[#F4F4F5]">
                              <input type="checkbox" checked={selecionados.has(p.id)} onChange={() => toggleProduto(p.id)} className="w-4 h-4 accent-[#FF441F]" />
                              {p.name}
                            </span>
                            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{fmtPreco(p.preco_promo ?? p.price)}</span>
                          </label>
                        ))}
                        {categoria.id != null && (
                          <input
                            type="text"
                            value={observacoesCategoria[categoria.id] ?? ''}
                            onChange={(e) => alterarObservacaoCategoria(categoria.id, e.target.value)}
                            onBlur={(e) => salvarObservacaoAoSair(categoria.id, e.target.value)}
                            placeholder={`Observação de "${categoria.nome}" (aparece no fim da lista)`}
                            className="mt-1 w-full border border-dashed border-[#E4E4E7] dark:border-[#3F3F46] bg-transparent text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2.5 py-1.5 text-xs text-[#71717A] dark:placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#FF441F]"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E4E4E7] dark:border-[#3F3F46] flex gap-2">
          {/* Prévia de página inteira só faz sentido com espaço de tela — em
              celular o formulário já ocupa tudo, então some fora do desktop. */}
          <button onClick={visualizar} disabled={selecionados.size === 0}
            className="hidden md:flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-40">
            <Icon name="Eye" size={15} /> Visualizar
          </button>
          <button onClick={gerar} disabled={selecionados.size === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl bg-[#FF441F] text-white hover:bg-[#E63A19] disabled:opacity-40">
            <Icon name="Printer" size={15} /> Gerar cardápio impresso ({selecionados.size})
          </button>
        </div>
      </div>

      {htmlPreview != null && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E4E4E7] dark:border-[#3F3F46]">
              <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Prévia da impressão</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => document.getElementById('cardapio-preview-iframe')?.contentWindow?.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FF441F] text-white hover:bg-[#E63A19]">
                  <Icon name="Printer" size={13} /> Imprimir
                </button>
                <button onClick={() => setHtmlPreview(null)} className="text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
                  <Icon name="X" size={20} />
                </button>
              </div>
            </div>
            <iframe id="cardapio-preview-iframe" title="Prévia do cardápio impresso" srcDoc={htmlPreview} className="flex-1 w-full border-0 bg-[#525659]" />
          </div>
        </div>
      )}
    </div>
  );
};

// Roda em localhost só o próprio PC alcança — celular do cliente escaneando o QR na
// mesa precisa do IP de rede (VITE_LAN_URL), mesmo esquema do QR de acompanhamento
// da mesa (ver utils/mesaAcompanharUrl.js).
const getCardapioUrls = (slug) => {
  const path = `/cardapio/${slug}`;
  const rodandoLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const lanUrl = import.meta.env.VITE_LAN_URL;
  return {
    principal: `${window.location.origin}${path}`,
    lan: rodandoLocal && lanUrl ? `${lanUrl}${path}` : null,
  };
};

const RestauranteCardapioDigital = () => {
  const slugLoja = useMinhaLojaSlug();
  const { tipoRestaurante } = useModulosEmpresa();
  const termos = getTermos(tipoRestaurante);
  const [copiado, setCopiado] = useState(false);
  const [modo, setModo] = useState('online'); // 'online' | 'local'
  const [mostrarModalCardapioImpresso, setMostrarModalCardapioImpresso] = useState(false);

  // Busca a empresa na hora do clique (não guarda em state) — evita imprimir sem
  // logo quando o botão é clicado antes do fetch inicial da tela terminar.
  const imprimirComLogo = async (imprimirFn, qrUrl) => {
    const d = await getMinhaEmpresa().catch(() => null);
    imprimirFn(qrUrl, d?.empresa?.name, d?.empresa?.logo_url, tipoRestaurante);
  };

  const copiarLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/cardapio-digital" title={termos.cardapio} />

      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-lg font-black text-[#18181B] dark:text-[#F4F4F5] mb-1">{termos.cardapio}</h1>
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-4">
          Gere um QR code pras mesas — o cliente escaneia e vê produtos e preços, sem precisar pedir pelo app.
        </p>

        {!slugLoja ? (
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Carregando...</p>
        ) : (() => {
          const urls = getCardapioUrls(slugLoja);
          const urlAtiva = modo === 'local' && urls.lan ? urls.lan : urls.principal;
          const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(urlAtiva)}`;

          return (
            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-6 flex flex-col items-center">
              {urls.lan && (
                <div className="flex gap-2 mb-4 self-start">
                  <button onClick={() => setModo('online')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold ${modo === 'online' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                    ONLINE
                  </button>
                  <button onClick={() => setModo('local')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold ${modo === 'local' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                    LOCAL
                  </button>
                </div>
              )}

              <img src={qrSrc} alt="QR code do cardápio digital" width={260} height={260} className="rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46]" />

              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-3 break-all text-center">{urlAtiva}</p>

              <div className="flex gap-2 mt-4 w-full">
                <button onClick={() => copiarLink(urlAtiva)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                  <Icon name={copiado ? 'Check' : 'Copy'} size={15} /> {copiado ? 'Copiado!' : 'Copiar link'}
                </button>
                <a href={urlAtiva} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl bg-[#FF441F] text-white hover:bg-[#E63A19]">
                  <Icon name="ExternalLink" size={15} /> Abrir cardápio
                </a>
              </div>
              <a href={qrSrc} download={`cardapio-${slugLoja}.png`}
                className="mt-2 text-xs font-semibold text-[#FF441F] hover:underline">
                Baixar QR code (PNG)
              </a>

              <div className="flex gap-2 mt-4 w-full border-t border-[#E4E4E7] dark:border-[#3F3F46] pt-4">
                <button
                  onClick={() => imprimirComLogo(
                    printCartazCardapioDigital,
                    `https://api.qrserver.com/v1/create-qr-code/?size=340x340&data=${encodeURIComponent(urlAtiva)}`,
                  )}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                  <Icon name="Printer" size={15} /> Cartaz A4
                </button>
                <button
                  onClick={() => imprimirComLogo(
                    printTicketCardapioDigital,
                    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(urlAtiva)}`,
                  )}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                  <Icon name="Printer" size={15} /> Ticket térmico
                </button>
              </div>

              <button
                onClick={() => setMostrarModalCardapioImpresso(true)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                <Icon name="Printer" size={15} /> Cardápio impresso (pra plastificar)
              </button>
            </div>
          );
        })()}
      </div>

      {mostrarModalCardapioImpresso && (
        <CardapioImpressoModal onClose={() => setMostrarModalCardapioImpresso(false)} />
      )}
    </div>
  );
};

export default RestauranteCardapioDigital;
