import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../components/AppIcon';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import {
  getMinhaEmpresa, getMeusProdutos, getObservacoesCategorias, salvarObservacaoCategoria,
  getCardapioImpressoConfig, updateCardapioImpressoConfig,
} from '../../services/restauranteService';
import { printCartazCardapioDigital, printTicketCardapioDigital } from '../../utils/printComanda';
import { printCardapioImpresso, montarHtmlCardapioImpresso } from '../../utils/printCardapioImpresso';
import OrganizarPosicaoModal from './OrganizarPosicaoModal';
import ImageUpload from '../../components/ui/ImageUpload';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import { getTermos } from '../../hooks/useTerminologiaEstabelecimento';

const fmtPreco = (v) => `R$ ${Number(v ?? 0).toFixed(2).replace('.', ',')}`;

const CardapioImpressoModal = ({ onClose }) => {
  const [carregando, setCarregando] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [selecionados, setSelecionados] = useState(new Set());
  // Toda essa configuração (abaixo) fica salva no banco (restaurants.cardapio_impresso_config,
  // ver GET/PATCH /restaurante/cardapio-impresso/config) — antes ficava só no
  // localStorage do navegador e se perdia ao trocar de dispositivo/limpar dados.
  const [usarLogo, setUsarLogo] = useState(true);
  const [rodape, setRodape] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [imagemFundo, setImagemFundo] = useState('');
  const [ocultarTituloCategoria, setOcultarTituloCategoria] = useState(false);
  // Nomes de categoria na ordem manual escolhida pelo dono (ex: Lanches antes de
  // Bebidas) — categoria que ainda não apareceu aqui cai no fim, em ordem alfabética.
  const [ordemCategorias, setOrdemCategorias] = useState([]);
  // Mesma ideia, mas pro nível de GRUPO (ex: mover "Tira Gosto" inteiro pra
  // cima de "Refeição 4 Pessoas") — grupo "sem grupo" (nome null) não entra
  // aqui, fica sempre por último como já era antes.
  const [ordemGrupos, setOrdemGrupos] = useState([]);
  // Tamanho de fonte (px) editável — texto vazio = usa o tamanho padrão fixo
  // de sempre (13/14/17/26, ver printCardapioImpresso.js), pra não mudar a
  // impressão de quem nunca mexeu nesse campo novo.
  const [fonteItemPx, setFonteItemPx] = useState('');
  const [fonteTituloPx, setFonteTituloPx] = useState('');
  const [fonteNomeRestaurantePx, setFonteNomeRestaurantePx] = useState('');
  const [fonteDescricaoPx, setFonteDescricaoPx] = useState('');
  // Layout manual de colunas (organizador visual, arrastar/soltar) —
  // {col1: [chave], col2: [chave]}; null/vazio = usa o algoritmo automático
  // por peso de sempre (ver printCardapioImpresso.js distribuirEmColunas).
  const [layoutColunas, setLayoutColunas] = useState(null);
  const [organizarAberto, setOrganizarAberto] = useState(false);
  // category_id -> observação (salva no banco, ver GET/PUT /restaurante/categorias/observacoes)
  const [observacoesCategoria, setObservacoesCategoria] = useState({});
  // HTML da prévia (null = prévia fechada) — só computador, ver botão "Visualizar".
  const [htmlPreview, setHtmlPreview] = useState(null);

  useEffect(() => {
    Promise.all([getMeusProdutos(), getMinhaEmpresa(), getObservacoesCategorias(), getCardapioImpressoConfig()])
      .then(([p, e, obs, cfg]) => {
        const lista = p.produtos ?? [];
        setProdutos(lista);
        setEmpresa(e.empresa);
        // Produto novo (nunca visto na config salva) entra selecionado por
        // padrão — só quem foi explicitamente desmarcado antes fica de fora.
        const excluidosSalvos = new Set(cfg.produtos_excluidos ?? []);
        setSelecionados(new Set(lista.filter((item) => !excluidosSalvos.has(item.id)).map((item) => item.id)));
        const mapa = {};
        for (const o of obs.observacoes ?? []) mapa[o.category_id] = o.observacao;
        setObservacoesCategoria(mapa);

        setUsarLogo(cfg.usar_logo ?? true);
        setRodape(cfg.rodape ?? '');
        setObservacaoGeral(cfg.observacao_geral ?? '');
        setImagemFundo(cfg.imagem_fundo ?? '');
        setOcultarTituloCategoria(cfg.ocultar_titulo_categoria ?? false);
        setOrdemCategorias(cfg.ordem_categorias ?? []);
        setOrdemGrupos(cfg.ordem_grupos ?? []);
        setFonteItemPx(cfg.fonte_item_px != null ? String(cfg.fonte_item_px) : '');
        setFonteTituloPx(cfg.fonte_titulo_px != null ? String(cfg.fonte_titulo_px) : '');
        setFonteNomeRestaurantePx(cfg.fonte_nome_restaurante_px != null ? String(cfg.fonte_nome_restaurante_px) : '');
        setFonteDescricaoPx(cfg.fonte_descricao_px != null ? String(cfg.fonte_descricao_px) : '');
        setLayoutColunas(cfg.layout_colunas ?? null);
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

  // Pura (não toca estado) — usada tanto pro clique único ↑/↓ quanto, em
  // sucessivos passos de 1, por "mover para posição" (digitar o número).
  const calcularNovaOrdem = (baseAtual, itensDoBucket, indice, direcao) => {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= itensDoBucket.length) return baseAtual;
    const nomeA = itensDoBucket[indice].nome;
    const nomeB = itensDoBucket[alvo].nome;
    const base = [...baseAtual];
    for (const item of itensDoBucket) if (!base.includes(item.nome)) base.push(item.nome);
    const ia = base.indexOf(nomeA);
    const ib = base.indexOf(nomeB);
    [base[ia], base[ib]] = [base[ib], base[ia]];
    return base;
  };

  const moverCategoria = (categoriasDoBucket, indice, direcao) => {
    const nova = calcularNovaOrdem(ordemCategorias, categoriasDoBucket, indice, direcao);
    setOrdemCategorias(nova);
    salvarConfigAtual({ ordem_categorias: nova });
  };

  // Digitar a posição direto, em vez de clicar ↑/↓ várias vezes — acumula a
  // ordem em variáveis locais (não em estado) a cada passo, pra não depender
  // de re-render entre eles, e só salva uma vez no final.
  const moverCategoriaParaPosicao = (categoriasDoBucket, indiceAtual, novaPosicao1based) => {
    const total = categoriasDoBucket.length;
    const alvoFinal = Math.min(Math.max(1, novaPosicao1based || 1), total) - 1;
    let ordemAcumulada = ordemCategorias;
    const listaAcumulada = [...categoriasDoBucket];
    let idx = indiceAtual;
    while (idx !== alvoFinal) {
      const direcao = alvoFinal > idx ? 1 : -1;
      ordemAcumulada = calcularNovaOrdem(ordemAcumulada, listaAcumulada, idx, direcao);
      const tmp = listaAcumulada[idx]; listaAcumulada[idx] = listaAcumulada[idx + direcao]; listaAcumulada[idx + direcao] = tmp;
      idx += direcao;
    }
    setOrdemCategorias(ordemAcumulada);
    salvarConfigAtual({ ordem_categorias: ordemAcumulada });
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
    const nova = calcularNovaOrdem(ordemGrupos, gruposNomeados, indice, direcao);
    setOrdemGrupos(nova);
    salvarConfigAtual({ ordem_grupos: nova });
  };

  const moverGrupoParaPosicao = (gruposNomeados, indiceAtual, novaPosicao1based) => {
    const total = gruposNomeados.length;
    const alvoFinal = Math.min(Math.max(1, novaPosicao1based || 1), total) - 1;
    let ordemAcumulada = ordemGrupos;
    const listaAcumulada = [...gruposNomeados];
    let idx = indiceAtual;
    while (idx !== alvoFinal) {
      const direcao = alvoFinal > idx ? 1 : -1;
      ordemAcumulada = calcularNovaOrdem(ordemAcumulada, listaAcumulada, idx, direcao);
      const tmp = listaAcumulada[idx]; listaAcumulada[idx] = listaAcumulada[idx + direcao]; listaAcumulada[idx + direcao] = tmp;
      idx += direcao;
    }
    setOrdemGrupos(ordemAcumulada);
    salvarConfigAtual({ ordem_grupos: ordemAcumulada });
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

  // Quais produtos entram no cardápio impresso também é persistido — sem
  // isso, desmarcar um produto (ex: fora de estoque no momento) só durava até
  // a página recarregar. Guarda a lista de EXCLUÍDOS (não os selecionados),
  // assim um produto novo entra selecionado por padrão sem precisar de ajuste.
  const persistirSelecao = (novoSet) => {
    const excluidos = produtos.map((p) => p.id).filter((id) => !novoSet.has(id));
    salvarConfigAtual({ produtos_excluidos: excluidos });
  };

  const toggleProduto = (id) => {
    const novo = new Set(selecionados);
    if (novo.has(id)) novo.delete(id); else novo.add(id);
    setSelecionados(novo);
    persistirSelecao(novo);
  };

  const toggleCategoria = (categoria) => {
    const ids = categoria.produtos.map((p) => p.id);
    const todosSelecionados = ids.every((id) => selecionados.has(id));
    const novo = new Set(selecionados);
    ids.forEach((id) => (todosSelecionados ? novo.delete(id) : novo.add(id)));
    setSelecionados(novo);
    persistirSelecao(novo);
  };

  const selecionarTodos = () => {
    const novo = selecionados.size === produtos.length ? new Set() : new Set(produtos.map((p) => p.id));
    setSelecionados(novo);
    persistirSelecao(novo);
  };

  // Salva a configuração no banco na hora — `overrides` serve pros campos que
  // acabaram de mudar (o setState ainda não refletiu no closure quando isso é
  // chamado dentro do próprio onChange, então o valor novo entra explícito
  // em vez de confiar no state, que ainda está com o valor antigo).
  const salvarConfigAtual = (overrides = {}) => {
    updateCardapioImpressoConfig({
      usar_logo: usarLogo,
      rodape,
      observacao_geral: observacaoGeral,
      imagem_fundo: imagemFundo,
      ocultar_titulo_categoria: ocultarTituloCategoria,
      ordem_categorias: ordemCategorias,
      ordem_grupos: ordemGrupos,
      fonte_item_px: fonteItemPx ? parseInt(fonteItemPx, 10) : null,
      fonte_titulo_px: fonteTituloPx ? parseInt(fonteTituloPx, 10) : null,
      fonte_nome_restaurante_px: fonteNomeRestaurantePx ? parseInt(fonteNomeRestaurantePx, 10) : null,
      fonte_descricao_px: fonteDescricaoPx ? parseInt(fonteDescricaoPx, 10) : null,
      layout_colunas: layoutColunas,
      ...overrides,
    }).catch(() => {});
  };

  const montarArgsImpressao = () => {
    salvarConfigAtual();

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
      fonteItemPx: fonteItemPx ? parseInt(fonteItemPx, 10) : undefined,
      fonteTituloPx: fonteTituloPx ? parseInt(fonteTituloPx, 10) : undefined,
      fonteNomeRestaurantePx: fonteNomeRestaurantePx ? parseInt(fonteNomeRestaurantePx, 10) : undefined,
      fonteDescricaoPx: fonteDescricaoPx ? parseInt(fonteDescricaoPx, 10) : undefined,
      layoutColunas: layoutColunas ?? undefined,
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

  // Uma vez que o layout visual (organizador arrastar/soltar) é salvo, ele
  // manda na ordem/coluna de verdade na impressão (ver printCardapioImpresso.js
  // distribuirEmColunas) — as setas/número abaixo, se continuassem editáveis,
  // pareceriam funcionar mas não mudariam nada na impressão real, recriando a
  // mesma confusão que motivou esse organizador. Por isso ficam desativadas
  // (só leitura) enquanto existir um layout visual salvo.
  const layoutVisualAtivo = !!(layoutColunas && ((layoutColunas.col1?.length ?? 0) + (layoutColunas.col2?.length ?? 0) > 0));
  const voltarModoNumerico = () => {
    if (!window.confirm('Voltar pro modo numérico? O layout visual salvo é descartado.')) return;
    setLayoutColunas(null);
    salvarConfigAtual({ layout_colunas: null });
  };

  // A impressão remove grupo/categoria sem nenhum produto marcado (ver
  // montarArgsImpressao) — contar a posição sobre a lista CHEIA (com os vazios)
  // fazia o número mostrado aqui não bater com a posição real na impressão/
  // prévia (ex: grupo aparecia como "posição 8" no editor, mas saía na 5ª
  // posição de verdade, porque 2 grupos antes dele ficaram sem item nenhum
  // selecionado). Contar só sobre quem tem pelo menos 1 item marcado resolve.
  const categoriaTemSelecao = (categoria) => categoria.produtos.some((p) => selecionados.has(p.id));
  const grupoTemSelecao = (grupo) => grupo.categorias.some(categoriaTemSelecao);
  const gruposComSelecaoOrdenados = gruposNomeadosOrdenados.filter(grupoTemSelecao);

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
              <input type="checkbox" checked={usarLogo} onChange={(e) => { setUsarLogo(e.target.checked); salvarConfigAtual({ usar_logo: e.target.checked }); }} className="w-4 h-4 accent-[#FF441F]" />
              Incluir logomarca no topo
            </label>
            <label className="flex items-start gap-2 text-sm text-[#27272A] dark:text-[#F4F4F5] cursor-pointer">
              <input type="checkbox" checked={ocultarTituloCategoria} onChange={(e) => { setOcultarTituloCategoria(e.target.checked); salvarConfigAtual({ ocultar_titulo_categoria: e.target.checked }); }} className="w-4 h-4 accent-[#FF441F] mt-0.5" />
              <span>Ocultar título das categorias (ex: "BEBIDAS") na impressão — reduz a altura e ajuda a caber em menos páginas</span>
            </label>
            <div>
              <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Observação geral (opcional)</label>
              <input type="text" value={observacaoGeral} onChange={(e) => setObservacaoGeral(e.target.value)}
                onBlur={(e) => salvarConfigAtual({ observacao_geral: e.target.value })}
                placeholder="Ex: Preços sujeitos a alteração sem aviso prévio"
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Frase do rodapé (opcional)</label>
              <input type="text" value={rodape} onChange={(e) => setRodape(e.target.value)}
                onBlur={(e) => salvarConfigAtual({ rodape: e.target.value })}
                placeholder="Ex: Peça também pelo nosso delivery!"
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Imagem de fundo (opcional)</label>
              <ImageUpload value={imagemFundo} onChange={(url) => { setImagemFundo(url); salvarConfigAtual({ imagem_fundo: url }); }} folder="cardapio-impresso" aspect="wide" previewOpacity={0.3} />
            </div>

            <div className="pt-2 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
              <p className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-2">Tamanho da fonte (px) — vazio usa o padrão</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#A1A1AA] mb-0.5">Itens</label>
                  <input type="number" min="6" max="30" value={fonteItemPx} onChange={(e) => setFonteItemPx(e.target.value)}
                    onBlur={(e) => salvarConfigAtual({ fonte_item_px: e.target.value ? parseInt(e.target.value, 10) : null })}
                    placeholder="13"
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A1A1AA] mb-0.5">Títulos</label>
                  <input type="number" min="6" max="40" value={fonteTituloPx} onChange={(e) => setFonteTituloPx(e.target.value)}
                    onBlur={(e) => salvarConfigAtual({ fonte_titulo_px: e.target.value ? parseInt(e.target.value, 10) : null })}
                    placeholder="14/17"
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A1A1AA] mb-0.5">Nome loja</label>
                  <input type="number" min="6" max="60" value={fonteNomeRestaurantePx} onChange={(e) => setFonteNomeRestaurantePx(e.target.value)}
                    onBlur={(e) => salvarConfigAtual({ fonte_nome_restaurante_px: e.target.value ? parseInt(e.target.value, 10) : null })}
                    placeholder="26"
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A1A1AA] mb-0.5">Descrição</label>
                  <input type="number" min="6" max="24" value={fonteDescricaoPx} onChange={(e) => setFonteDescricaoPx(e.target.value)}
                    onBlur={(e) => salvarConfigAtual({ fonte_descricao_px: e.target.value ? parseInt(e.target.value, 10) : null })}
                    placeholder="10.5"
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
                </div>
              </div>
              <p className="text-[10px] text-[#A1A1AA] mt-1">"Títulos" define categoria e grupo com o mesmo tamanho. "Descrição" define a descrição do produto e a observação da categoria com o mesmo tamanho.</p>
            </div>

            <button type="button" onClick={() => setOrganizarAberto(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-[#FF441F]/40 text-[#FF441F] text-sm font-bold rounded-xl hover:bg-[#FF441F]/5">
              <Icon name="LayoutGrid" size={15} /> Organizar posição (arrastar)
            </button>
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
          {layoutVisualAtivo && (
            <div className="flex items-center justify-between gap-2 bg-[#FF441F]/10 border border-[#FF441F]/30 rounded-xl px-3 py-2">
              <p className="text-xs text-[#FF441F] font-semibold">Layout visual ativo — a ordem por número abaixo está desativada.</p>
              <button type="button" onClick={voltarModoNumerico} className="text-xs font-bold text-[#FF441F] hover:underline flex-shrink-0">
                Voltar pro modo numérico
              </button>
            </div>
          )}
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
                    {grupoTemSelecao(grupo) ? (
                      <div className={`flex items-center gap-1 flex-shrink-0 ${layoutVisualAtivo ? 'opacity-40' : ''}`}>
                        <input
                          type="number"
                          min={1}
                          max={gruposComSelecaoOrdenados.length}
                          value={gruposComSelecaoOrdenados.indexOf(grupo) + 1}
                          onChange={(e) => moverGrupoParaPosicao(gruposComSelecaoOrdenados, gruposComSelecaoOrdenados.indexOf(grupo), parseInt(e.target.value, 10))}
                          disabled={layoutVisualAtivo}
                          title="Posição deste grupo na impressão"
                          className="w-11 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-1 py-0.5 text-xs text-center"
                        />
                        <button type="button"
                          onClick={() => moverGrupo(gruposComSelecaoOrdenados, gruposComSelecaoOrdenados.indexOf(grupo), -1)}
                          disabled={layoutVisualAtivo || gruposComSelecaoOrdenados.indexOf(grupo) === 0}
                          title="Mover grupo pra cima na impressão"
                          className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed">
                          <Icon name="ChevronUp" size={14} />
                        </button>
                        <button type="button"
                          onClick={() => moverGrupo(gruposComSelecaoOrdenados, gruposComSelecaoOrdenados.indexOf(grupo), 1)}
                          disabled={layoutVisualAtivo || gruposComSelecaoOrdenados.indexOf(grupo) === gruposComSelecaoOrdenados.length - 1}
                          title="Mover grupo pra baixo na impressão"
                          className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed">
                          <Icon name="ChevronDown" size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#A1A1AA] flex-shrink-0" title="Nenhum item marcado neste grupo — não entra na impressão">
                        sem itens
                      </span>
                    )}
                  </div>
                )}
                {ordenarCategorias(grupo.categorias).map((categoria, _indice, categoriasDoBucket) => {
                  const ids = categoria.produtos.map((p) => p.id);
                  const todosSelecionados = ids.every((id) => selecionados.has(id));
                  const categoriasComSelecao = categoriasDoBucket.filter(categoriaTemSelecao);
                  const temSelecao = categoriaTemSelecao(categoria);
                  return (
                    <div key={categoria.nome}>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input type="checkbox" checked={todosSelecionados} onChange={() => toggleCategoria(categoria)} className="w-4 h-4 accent-[#FF441F] flex-shrink-0" />
                          <span className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">{categoria.nome}</span>
                        </label>
                        {temSelecao ? (
                          <div className={`flex items-center gap-1 flex-shrink-0 ${layoutVisualAtivo ? 'opacity-40' : ''}`}>
                            <input
                              type="number"
                              min={1}
                              max={categoriasComSelecao.length}
                              value={categoriasComSelecao.indexOf(categoria) + 1}
                              onChange={(e) => moverCategoriaParaPosicao(categoriasComSelecao, categoriasComSelecao.indexOf(categoria), parseInt(e.target.value, 10))}
                              disabled={layoutVisualAtivo}
                              title="Posição desta categoria na impressão"
                              className="w-11 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-1 py-0.5 text-xs text-center"
                            />
                            <button type="button" onClick={() => moverCategoria(categoriasComSelecao, categoriasComSelecao.indexOf(categoria), -1)} disabled={layoutVisualAtivo || categoriasComSelecao.indexOf(categoria) === 0}
                              title="Mover pra cima na impressão"
                              className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed">
                              <Icon name="ChevronUp" size={14} />
                            </button>
                            <button type="button" onClick={() => moverCategoria(categoriasComSelecao, categoriasComSelecao.indexOf(categoria), 1)} disabled={layoutVisualAtivo || categoriasComSelecao.indexOf(categoria) === categoriasComSelecao.length - 1}
                              title="Mover pra baixo na impressão"
                              className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed">
                              <Icon name="ChevronDown" size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#A1A1AA] flex-shrink-0" title="Nenhum item marcado nesta categoria — não entra na impressão">
                            sem itens
                          </span>
                        )}
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

      {organizarAberto && (
        <OrganizarPosicaoModal
          grupos={gruposOrdenados}
          selecionados={selecionados}
          layoutInicial={layoutColunas}
          onSalvar={(novoLayout) => { setLayoutColunas(novoLayout); salvarConfigAtual({ layout_colunas: novoLayout }); }}
          onClose={() => setOrganizarAberto(false)}
        />
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
