import React, { useState, useEffect } from 'react';
import { getRelatorioProdutos, getMinhaEmpresa } from '../../services/restauranteService';
import RelatorioNav from './RelatorioNav';
import FiltroPeriodo from './FiltroPeriodo';
import { fmt, buildRange, printIframe, reportBaseStyle, printFooterScript, defaultFiltroState } from '../../utils/relatorioPrint';

const ABAS = [
  { id: 'todos', label: 'Lista' },
  { id: 'sem_estoque', label: 'Sem Estoque' },
  { id: 'status', label: 'Ativos / Bloqueados' },
  { id: 'vendas', label: 'Vendas no Período' },
];

const buildPrintHtml = (dados, aba, restauranteNome, label) => {
  const listaAtual = aba === 'sem_estoque' ? dados.sem_estoque
    : aba === 'vendas' ? dados.vendas
    : dados.produtos;

  const rows = aba === 'vendas'
    ? listaAtual.map((p) => `<tr><td>${p.name}</td><td class="right">${p.quantidade_vendida}</td><td class="right bold green">${fmt(p.receita)}</td></tr>`).join('')
    : listaAtual.map((p) => `<tr><td>${p.name}</td><td>${p.category_name}</td><td class="right">${fmt(p.price)}</td><td class="right">${p.quantidade_estoque}</td><td>${p.is_active ? 'Ativo' : 'Bloqueado'}</td></tr>`).join('');

  const header = aba === 'vendas'
    ? '<tr><th>Produto</th><th class="right">Qtd Vendida</th><th class="right">Receita</th></tr>'
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

  const listaStatus = dados
    ? statusFiltro === 'ativos' ? dados.ativos
    : statusFiltro === 'bloqueados' ? dados.bloqueados
    : dados.produtos
    : [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <RelatorioNav titulo="Produtos" />
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <FiltroPeriodo
          filtro={filtro} setFiltro={setFiltro} onBuscar={buscar} loading={loading}
          podeImprimir={!!dados} onImprimir={() => printIframe(buildPrintHtml(dados, aba, restauranteNome, label))}
        />

        {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{erro}</p>}

        {dados && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-[#18181B]">{dados.produtos.length}</p>
                <p className="text-xs text-[#71717A]">Total Produtos</p>
              </div>
              <div className="bg-white border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-red-600">{dados.sem_estoque.length}</p>
                <p className="text-xs text-[#71717A]">Sem Estoque</p>
              </div>
              <div className="bg-white border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-green-700">{dados.ativos.length}</p>
                <p className="text-xs text-[#71717A]">Ativos</p>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-[#71717A]">{dados.bloqueados.length}</p>
                <p className="text-xs text-[#71717A]">Bloqueados</p>
              </div>
            </div>

            <div className="flex gap-1 bg-[#F4F4F5] p-1 rounded-xl w-fit flex-wrap">
              {ABAS.map((a) => (
                <button key={a.id} onClick={() => setAba(a.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${aba === a.id ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#27272A]'}`}>
                  {a.label}
                </button>
              ))}
            </div>

            {aba === 'todos' && (
              <ProdutosTabela produtos={dados.produtos} />
            )}

            {aba === 'sem_estoque' && (
              dados.sem_estoque.length === 0
                ? <p className="text-sm text-[#71717A] text-center py-10 bg-white rounded-2xl border border-[#E4E4E7]">Nenhum produto sem estoque.</p>
                : <ProdutosTabela produtos={dados.sem_estoque} />
            )}

            {aba === 'status' && (
              <div className="space-y-3">
                <div className="flex gap-1 bg-[#F4F4F5] p-1 rounded-xl w-fit">
                  {[{ id: 'todos', label: 'Todos' }, { id: 'ativos', label: 'Ativos' }, { id: 'bloqueados', label: 'Bloqueados' }].map((s) => (
                    <button key={s.id} onClick={() => setStatusFiltro(s.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFiltro === s.id ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#27272A]'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <ProdutosTabela produtos={listaStatus} />
              </div>
            )}

            {aba === 'vendas' && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
                {dados.vendas.length === 0 ? (
                  <p className="text-sm text-[#71717A] text-center py-10">Nenhuma venda no período.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#FAFAFA] border-b border-[#F4F4F5] text-xs font-bold text-[#71717A] uppercase tracking-widest">
                          <th className="text-left px-5 py-3">Produto</th>
                          <th className="text-right px-5 py-3">Qtd Vendida</th>
                          <th className="text-right px-5 py-3">Receita</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4F4F5]">
                        {dados.vendas.map((p) => (
                          <tr key={p.product_id} className="hover:bg-[#FAFAFA]">
                            <td className="px-5 py-3 font-semibold text-[#18181B]">{p.name}</td>
                            <td className="px-5 py-3 text-right">{p.quantidade_vendida}</td>
                            <td className="px-5 py-3 text-right font-bold text-green-700">{fmt(p.receita)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const ProdutosTabela = ({ produtos }) => (
  <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
    {produtos.length === 0 ? (
      <p className="text-sm text-[#71717A] text-center py-10">Nenhum produto encontrado.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#F4F4F5] text-xs font-bold text-[#71717A] uppercase tracking-widest">
              <th className="text-left px-5 py-3">Produto</th>
              <th className="text-left px-5 py-3">Categoria</th>
              <th className="text-right px-5 py-3">Preço</th>
              <th className="text-right px-5 py-3">Estoque</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5]">
            {produtos.map((p) => (
              <tr key={p.id} className="hover:bg-[#FAFAFA]">
                <td className="px-5 py-3 font-semibold text-[#18181B]">{p.name}</td>
                <td className="px-5 py-3 text-[#71717A]">{p.category_name}</td>
                <td className="px-5 py-3 text-right">{fmt(p.price)}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(p.quantidade_estoque ?? 0) <= 0 ? 'bg-red-100 text-red-700' : 'bg-[#F4F4F5] text-[#27272A]'}`}>
                    {p.quantidade_estoque ?? 0}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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

export default RelatorioProdutos;
