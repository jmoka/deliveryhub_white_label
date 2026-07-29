import React, { useState, useEffect, useMemo } from 'react';
import { getRelatorioProdutos, getMinhaEmpresa } from '../../services/restauranteService';
import RelatorioNav from './RelatorioNav';
import FiltroPeriodo from './FiltroPeriodo';
import { fmt, buildRange, printIframe, reportBaseStyle, printFooterScript, defaultFiltroState } from '../../utils/relatorioPrint';

const ABAS = [
  { id: 'todos', label: 'Lista' },
  { id: 'sem_estoque', label: 'Sem Estoque' },
  { id: 'reposicao', label: 'Reposição' },
  { id: 'status', label: 'Ativos / Bloqueados' },
  { id: 'vendas', label: 'Vendas no Período' },
  { id: 'sem_giro', label: 'Sem Giro' },
  { id: 'lucro', label: 'Lucro no Período' },
];

const QTD_FILTRO_INICIAL = { modo: 'todos', valor: '' };

const aplicarFiltroQtd = (lista, campo, filtro) => {
  if (!filtro || filtro.modo === 'todos') return lista;
  if (filtro.modo === 'zero') return lista.filter((x) => (x[campo] ?? 0) === 0);
  if (filtro.modo === 'valor') {
    if (filtro.valor === '' || filtro.valor == null) return lista;
    const v = Number(filtro.valor);
    return lista.filter((x) => (x[campo] ?? 0) <= v);
  }
  return lista;
};

const QtdFiltroBar = ({ filtro, onChange, labelZero }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#3F3F46] p-1 rounded-xl w-fit">
      {[{ id: 'todos', label: 'Todos' }, { id: 'zero', label: labelZero }, { id: 'valor', label: 'Valor' }].map((o) => (
        <button key={o.id} onClick={() => onChange({ ...filtro, modo: o.id })}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtro.modo === o.id ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'}`}>
          {o.label}
        </button>
      ))}
    </div>
    {filtro.modo === 'valor' && (
      <input
        type="number" min="0" step="1"
        value={filtro.valor}
        onChange={(e) => onChange({ ...filtro, valor: e.target.value })}
        placeholder="Até quantidade..."
        className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-1.5 text-xs w-36"
      />
    )}
  </div>
);

const OrdemToggle = ({ ordem, onChange }) => (
  <button onClick={() => onChange(ordem === 'desc' ? 'asc' : 'desc')}
    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] transition-colors">
    {ordem === 'desc' ? '↓ Maior → Menor' : '↑ Menor → Maior'}
  </button>
);

const DestaqueCard = ({ label, nome, valor, onClick }) => (
  <button onClick={onClick} disabled={!nome}
    className="text-left bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 hover:border-[#FF441F]/40 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-default disabled:hover:border-[#E4E4E7] dark:disabled:hover:border-[#3F3F46]">
    <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">{nome ?? '—'}</p>
    {nome && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{valor}</p>}
  </button>
);

const buildPrintHtml = (dados, aba, restauranteNome, label, listaOverride) => {
  const listaAtual = listaOverride ?? (aba === 'sem_estoque' ? dados.sem_estoque
    : aba === 'reposicao' ? dados.reposicao
    : aba === 'vendas' ? dados.vendas
    : aba === 'sem_giro' ? dados.sem_giro
    : aba === 'lucro' ? dados.vendas
    : dados.produtos);

  const rows = aba === 'vendas' || aba === 'sem_giro'
    ? listaAtual.map((p) => `<tr><td>${p.name}</td><td class="right">${p.quantidade_vendida}</td><td class="right bold green">${fmt(p.receita)}</td></tr>`).join('')
    : aba === 'lucro'
    ? listaAtual.map((p) => `<tr><td>${p.name}</td><td class="right">${p.quantidade_vendida}</td><td class="right">${fmt(p.receita)}</td><td class="right">${fmt(p.custo_total)}</td><td class="right bold green">${fmt(p.lucro)}</td></tr>`).join('')
    : aba === 'reposicao'
    ? listaAtual.map((p) => `<tr><td>${p.name}</td><td>${p.category_name}</td><td class="right">${p.quantidade_estoque}</td><td class="right">${p.quantidade_minima}</td></tr>`).join('')
    : listaAtual.map((p) => `<tr><td>${p.name}</td><td>${p.category_name}</td><td class="right">${fmt(p.price)}</td><td class="right">${p.quantidade_estoque}</td><td>${p.is_active ? 'Ativo' : 'Bloqueado'}</td></tr>`).join('');

  const header = aba === 'vendas' || aba === 'sem_giro'
    ? '<tr><th>Produto</th><th class="right">Qtd Vendida</th><th class="right">Receita</th></tr>'
    : aba === 'lucro'
    ? '<tr><th>Produto</th><th class="right">Qtd Vendida</th><th class="right">Receita</th><th class="right">Custo</th><th class="right">Lucro</th></tr>'
    : aba === 'reposicao'
    ? '<tr><th>Produto</th><th>Categoria</th><th class="right">Estoque</th><th class="right">Mínimo</th></tr>'
    : '<tr><th>Produto</th><th>Categoria</th><th class="right">Preço</th><th class="right">Estoque</th><th>Status</th></tr>';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Produtos</title>
<style>${reportBaseStyle}</style></head><body>
<h1>${restauranteNome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório de Produtos — ${ABAS.find((a) => a.id === aba)?.label} ${aba === 'vendas' ? `— ${label}` : ''}</div>
<table>${header}${rows || '<tr><td colspan="5">Nenhum produto encontrado.</td></tr>'}</table>
<footer>Emitido em: ${new Date().toLocaleString('pt-BR')}</footer>
${printFooterScript}
</body></html>`;
};

const RelatorioProdutos = () => {
  const [restauranteNome, setRestauranteNome] = useState('');
  const [filtro, setFiltro] = useState(defaultFiltroState());
  const [dados, setDados] = useState(null);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [aba, setAba] = useState('todos');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [repFiltro, setRepFiltro] = useState('minimo');
  const [qtdFiltroLista, setQtdFiltroLista] = useState(QTD_FILTRO_INICIAL);
  const [qtdFiltroSemEstoque, setQtdFiltroSemEstoque] = useState({ modo: 'zero', valor: '' });
  const [qtdFiltroSemGiro, setQtdFiltroSemGiro] = useState({ modo: 'zero', valor: '' });
  const [qtdFiltroLucro, setQtdFiltroLucro] = useState(QTD_FILTRO_INICIAL);
  const [qtdFiltroVendas, setQtdFiltroVendas] = useState(QTD_FILTRO_INICIAL);
  const [ordemVendas, setOrdemVendas] = useState('desc');
  const [ordemLucro, setOrdemLucro] = useState('desc');

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
  }, []);

  const buscar = async () => {
    const range = buildRange(filtro.modo, filtro.dia, filtro.mes, filtro.ano, filtro.periodoIni, filtro.periodoFim);
    if (!range) return;
    setLoading(true); setErro(null);
    try {
      const d = await getRelatorioProdutos(range.de, range.ate);
      setDados(d);
      setLabel(range.label);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { buscar(); }, []); // eslint-disable-line

  const exportarJson = () => {
    if (!dados) return;
    const lista = dados.produtos.map((p) => ({
      id: p.id,
      nome: p.name,
      categoria: p.category_name,
      preco: p.price,
      preco_custo: p.preco_custo,
      quantidade_estoque: p.quantidade_estoque,
      quantidade_minima: p.quantidade_minima,
      ativo: p.is_active,
    }));
    const blob = new Blob([JSON.stringify(lista, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produtos_${(restauranteNome || 'restaurante').toLowerCase().replace(/\s+/g, '-')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const listaStatus = dados
    ? statusFiltro === 'ativos' ? dados.ativos
    : statusFiltro === 'bloqueados' ? dados.bloqueados
    : dados.produtos
    : [];

  const listaReposicao = dados
    ? repFiltro === 'geral' ? dados.produtos
    : dados.reposicao
    : [];

  const listaLista = dados ? aplicarFiltroQtd(dados.produtos, 'quantidade_estoque', qtdFiltroLista) : [];
  const listaSemEstoque = dados ? aplicarFiltroQtd(dados.produtos, 'quantidade_estoque', qtdFiltroSemEstoque) : [];
  const listaSemGiro = dados ? aplicarFiltroQtd(dados.vendas, 'quantidade_vendida', qtdFiltroSemGiro) : [];
  const listaLucroBase = dados ? aplicarFiltroQtd(dados.vendas, 'quantidade_vendida', qtdFiltroLucro) : [];
  const listaVendasBase = dados ? aplicarFiltroQtd(dados.vendas, 'quantidade_vendida', qtdFiltroVendas) : [];

  const listaVendas = useMemo(() => [...listaVendasBase].sort((a, b) =>
    ordemVendas === 'desc' ? b.quantidade_vendida - a.quantidade_vendida : a.quantidade_vendida - b.quantidade_vendida
  ), [listaVendasBase, ordemVendas]);
  const listaLucro = useMemo(() => [...listaLucroBase].sort((a, b) =>
    ordemLucro === 'desc' ? b.lucro - a.lucro : a.lucro - b.lucro
  ), [listaLucroBase, ordemLucro]);

  const vendas = dados?.vendas ?? [];
  const maisVendido = useMemo(() => vendas.length ? [...vendas].sort((a, b) => b.quantidade_vendida - a.quantidade_vendida)[0] : null, [vendas]);
  const menosVendido = useMemo(() => {
    const comVenda = vendas.filter((v) => v.quantidade_vendida > 0);
    return comVenda.length ? [...comVenda].sort((a, b) => a.quantidade_vendida - b.quantidade_vendida)[0] : null;
  }, [vendas]);
  const maisLucrativo = useMemo(() => vendas.length ? [...vendas].sort((a, b) => b.lucro - a.lucro)[0] : null, [vendas]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RelatorioNav titulo="Produtos" />
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <FiltroPeriodo
          filtro={filtro} setFiltro={setFiltro} onBuscar={buscar} loading={loading}
          podeExportar={!!dados} onExportarJson={exportarJson}
          podeImprimir={!!dados} onImprimir={() => printIframe(buildPrintHtml(dados, aba, restauranteNome, label,
            aba === 'todos' ? listaLista
            : aba === 'sem_estoque' ? listaSemEstoque
            : aba === 'reposicao' ? listaReposicao
            : aba === 'vendas' ? listaVendas
            : aba === 'sem_giro' ? listaSemGiro
            : aba === 'lucro' ? listaLucro
            : aba === 'status' ? listaStatus
            : undefined))}
        />

        {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl">{erro}</p>}

        {dados && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-[#18181B] dark:text-[#F4F4F5]">{dados.produtos.length}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Total Produtos</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-red-600 dark:text-red-400">{dados.sem_estoque.length}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Sem Estoque</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-green-700 dark:text-green-400">{dados.ativos.length}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Ativos</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-[#71717A] dark:text-[#A1A1AA]">{dados.bloqueados.length}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Bloqueados</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{dados.reposicao.length}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">P/ Repor</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-[#71717A] dark:text-[#A1A1AA]">{dados.sem_giro.length}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Sem Giro</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-green-700 dark:text-green-400">{fmt(dados.receita_total)}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Receita Período</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-green-700 dark:text-green-400">{fmt(dados.lucro_total)}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Lucro Período</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DestaqueCard label="Mais Vendido" nome={maisVendido?.name}
                valor={maisVendido ? `${maisVendido.quantidade_vendida} un. · ${fmt(maisVendido.receita)}` : null}
                onClick={() => { setAba('vendas'); setOrdemVendas('desc'); }} />
              <DestaqueCard label="Menos Vendido" nome={menosVendido?.name}
                valor={menosVendido ? `${menosVendido.quantidade_vendida} un. · ${fmt(menosVendido.receita)}` : null}
                onClick={() => { setAba('vendas'); setOrdemVendas('asc'); }} />
              <DestaqueCard label="Mais Lucrativo" nome={maisLucrativo?.name}
                valor={maisLucrativo ? fmt(maisLucrativo.lucro) : null}
                onClick={() => { setAba('lucro'); setOrdemLucro('desc'); }} />
            </div>

            <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#3F3F46] p-1 rounded-xl w-fit flex-wrap">
              {ABAS.map((a) => (
                <button key={a.id} onClick={() => setAba(a.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${aba === a.id ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'}`}>
                  {a.label}
                </button>
              ))}
            </div>

            {aba === 'todos' && (
              <div className="space-y-3">
                <QtdFiltroBar filtro={qtdFiltroLista} onChange={setQtdFiltroLista} labelZero="Estoque Zero" />
                {listaLista.length === 0
                  ? <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10 bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46]">Nenhum produto encontrado.</p>
                  : <ProdutosTabela produtos={listaLista} />}
              </div>
            )}

            {aba === 'sem_estoque' && (
              <div className="space-y-3">
                <QtdFiltroBar filtro={qtdFiltroSemEstoque} onChange={setQtdFiltroSemEstoque} labelZero="Estoque Zero" />
                {listaSemEstoque.length === 0
                  ? <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10 bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46]">Nenhum produto sem estoque.</p>
                  : <ProdutosTabela produtos={listaSemEstoque} />}
              </div>
            )}

            {aba === 'reposicao' && (
              <div className="space-y-3">
                <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#3F3F46] p-1 rounded-xl w-fit">
                  {[{ id: 'minimo', label: 'No Mínimo' }, { id: 'geral', label: 'Geral' }].map((s) => (
                    <button key={s.id} onClick={() => setRepFiltro(s.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${repFiltro === s.id ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {listaReposicao.length === 0
                  ? <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10 bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46]">Nenhum produto {repFiltro === 'geral' ? 'cadastrado' : 'abaixo do estoque mínimo'}.</p>
                  : <ReposicaoTabela produtos={listaReposicao} />}
              </div>
            )}

            {aba === 'status' && (
              <div className="space-y-3">
                <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#3F3F46] p-1 rounded-xl w-fit">
                  {[{ id: 'todos', label: 'Todos' }, { id: 'ativos', label: 'Ativos' }, { id: 'bloqueados', label: 'Bloqueados' }].map((s) => (
                    <button key={s.id} onClick={() => setStatusFiltro(s.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFiltro === s.id ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <ProdutosTabela produtos={listaStatus} />
              </div>
            )}

            {aba === 'vendas' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <QtdFiltroBar filtro={qtdFiltroVendas} onChange={setQtdFiltroVendas} labelZero="Quantidade Zero" />
                  <OrdemToggle ordem={ordemVendas} onChange={setOrdemVendas} />
                </div>
                <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
                  {listaVendas.length === 0 ? (
                    <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum produto encontrado.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
                            <th className="text-left px-5 py-3">Produto</th>
                            <th className="text-right px-5 py-3">Qtd Vendida</th>
                            <th className="text-right px-5 py-3">Receita</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                          {listaVendas.map((p) => (
                            <tr key={p.product_id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                              <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{p.name}</td>
                              <td className="px-5 py-3 text-right">{p.quantidade_vendida}</td>
                              <td className="px-5 py-3 text-right font-bold text-green-700 dark:text-green-400">{fmt(p.receita)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {aba === 'sem_giro' && (
              <div className="space-y-3">
                <QtdFiltroBar filtro={qtdFiltroSemGiro} onChange={setQtdFiltroSemGiro} labelZero="Quantidade Zero" />
                {listaSemGiro.length === 0 ? (
                  <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10 bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46]">Nenhum produto encontrado.</p>
                ) : (
                  <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
                            <th className="text-left px-5 py-3">Produto</th>
                            <th className="text-right px-5 py-3">Qtd Vendida</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                          {listaSemGiro.map((p) => (
                            <tr key={p.product_id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                              <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{p.name}</td>
                              <td className="px-5 py-3 text-right">{p.quantidade_vendida}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {aba === 'lucro' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <QtdFiltroBar filtro={qtdFiltroLucro} onChange={setQtdFiltroLucro} labelZero="Quantidade Zero" />
                  <OrdemToggle ordem={ordemLucro} onChange={setOrdemLucro} />
                </div>
                <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
                  {listaLucro.length === 0 ? (
                    <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum produto encontrado.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
                            <th className="text-left px-5 py-3">Produto</th>
                            <th className="text-right px-5 py-3">Qtd Vendida</th>
                            <th className="text-right px-5 py-3">Receita</th>
                            <th className="text-right px-5 py-3">Custo</th>
                            <th className="text-right px-5 py-3">Lucro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                          {listaLucro.map((p) => (
                            <tr key={p.product_id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                              <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{p.name}</td>
                              <td className="px-5 py-3 text-right">{p.quantidade_vendida}</td>
                              <td className="px-5 py-3 text-right">{fmt(p.receita)}</td>
                              <td className="px-5 py-3 text-right">{fmt(p.custo_total)}</td>
                              <td className="px-5 py-3 text-right font-bold text-green-700 dark:text-green-400">{fmt(p.lucro)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-[#E4E4E7] dark:border-[#3F3F46] font-bold">
                            <td className="px-5 py-3">Total</td>
                            <td className="px-5 py-3 text-right"></td>
                            <td className="px-5 py-3 text-right">{fmt(dados.receita_total)}</td>
                            <td className="px-5 py-3 text-right"></td>
                            <td className="px-5 py-3 text-right text-green-700 dark:text-green-400">{fmt(dados.lucro_total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const ProdutosTabela = ({ produtos }) => (
  <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
    {produtos.length === 0 ? (
      <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum produto encontrado.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
              <th className="text-left px-5 py-3">Produto</th>
              <th className="text-left px-5 py-3">Categoria</th>
              <th className="text-right px-5 py-3">Preço</th>
              <th className="text-right px-5 py-3">Estoque</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
            {produtos.map((p) => (
              <tr key={p.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{p.name}</td>
                <td className="px-5 py-3 text-[#71717A] dark:text-[#A1A1AA]">{p.category_name}</td>
                <td className="px-5 py-3 text-right">{fmt(p.price)}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(p.quantidade_estoque ?? 0) <= 0 ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5]'}`}>
                    {p.quantidade_estoque ?? 0}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.is_active ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400'}`}>
                    {p.is_active ? 'Ativo' : 'Bloqueado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const ReposicaoTabela = ({ produtos }) => (
  <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
            <th className="text-left px-5 py-3">Produto</th>
            <th className="text-left px-5 py-3">Categoria</th>
            <th className="text-right px-5 py-3">Estoque</th>
            <th className="text-right px-5 py-3">Mínimo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
          {produtos.map((p) => (
            <tr key={p.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
              <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{p.name}</td>
              <td className="px-5 py-3 text-[#71717A] dark:text-[#A1A1AA]">{p.category_name}</td>
              <td className="px-5 py-3 text-right">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                  {p.quantidade_estoque ?? 0}
                </span>
              </td>
              <td className="px-5 py-3 text-right text-[#71717A] dark:text-[#A1A1AA]">{p.quantidade_minima ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default RelatorioProdutos;
