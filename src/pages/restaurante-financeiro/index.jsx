import React, { useState, useEffect } from 'react';
import { getRelatorio, getMinhaEmpresa, getCaixa, getCaixaHistorico, aprovarConferencia, getConfig } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import CaixaAtualPanel from './CaixaAtualPanel';
import HistoricoCaixasPanel from './HistoricoCaixasPanel';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt      = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate  = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const today    = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);
const thisYear  = () => new Date().getFullYear().toString();
const startOf   = (d) => new Date(d + 'T00:00:00-03:00').toISOString();
const endOf     = (d) => new Date(d + 'T23:59:59-03:00').toISOString();
const lastDay   = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
const ANOS      = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i));
const MODOS     = [{ value: 'dia', label: 'Dia' }, { value: 'mes', label: 'Mês' }, { value: 'ano', label: 'Ano' }, { value: 'periodo', label: 'Período' }];
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', cash: 'Dinheiro', taxa_cartao: '+ Taxa cartão' };
const PAYMENT_ICONS  = { pix: 'QrCode', credit_card: 'CreditCard', debit_card: 'CreditCard', cash: 'Banknote' };
const PAYMENT_COLORS = { pix: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400', credit_card: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400', debit_card: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400', cash: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-400' };
const STATUS_LABELS  = { pending: 'Recebido', confirmed: 'Confirmado', preparing: 'Em Preparo', ready: 'Pronto', motoboy_collecting: 'Motoboy', out_for_delivery: 'Em Entrega', delivered: 'Entregue', canceled: 'Cancelado' };
const STATUS_COLORS  = { pending: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400', confirmed: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400', preparing: 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400', ready: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400', motoboy_collecting: 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-400', out_for_delivery: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400', delivered: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400', canceled: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400' };
const ORIGEM_LABELS = { garcom: 'Garçom', estabelecimento: 'Caixa', delivery: 'Delivery' };
const CANAL_LABELS  = { delivery: 'Delivery', presencial: 'Salão', balcao: 'Balcão', marketplace: 'Marketplace' };

const MEIO_LABELS = { dinheiro: 'Dinheiro', pix: 'PIX', transferencia: 'Transferência', cartao: 'Cartão' };
const PRINT_STYLE = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;padding:16px;max-width:800px;margin:0 auto}h1{font-size:18px;font-weight:900;margin-bottom:2px}h2{font-size:13px;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}.sub{font-size:11px;color:#555;margin-bottom:12px}table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px}th{background:#f0f0f0;padding:6px 8px;text-align:left;font-weight:700;border:1px solid #ddd}td{padding:5px 8px;border:1px solid #ddd;vertical-align:top}.right{text-align:right}.bold{font-weight:700}.green{color:#166534}.red{color:#991b1b}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.kpi{border:1px solid #ddd;border-radius:6px;padding:8px;text-align:center}.kpi .val{font-size:18px;font-weight:900;display:block;margin:2px 0}.kpi .lbl{font-size:10px;color:#555}footer{margin-top:16px;font-size:10px;color:#888;border-top:1px solid #ddd;padding-top:6px}@media print{button{display:none!important}}`;
const buildPrint = (dados, nome, label, caixa, taxaPagbank, historico, de, ate) => {
  const r = dados.resumo;
  const pedidos = dados.pedidos ?? [];
  const naoCancelados = pedidos.filter((p) => p.status !== 'canceled');

  const pgto = Object.entries(r.por_pagamento ?? {}).map(([k, v]) => `<tr><td>${PAYMENT_LABELS[k] ?? k}</td><td class="right">${v.count}</td><td class="right bold green">${fmt(v.total)}</td></tr>`).join('');

  const porCanal = naoCancelados.reduce((acc, p) => {
    const c = p.canal ?? 'outro';
    if (!acc[c]) acc[c] = { count: 0, total: 0 };
    acc[c].count++; acc[c].total += p.total ?? 0;
    return acc;
  }, {});
  const canalRows = Object.entries(porCanal).map(([k, v]) => `<tr><td>${CANAL_LABELS[k] ?? k}</td><td class="right">${v.count}</td><td class="right bold green">${fmt(v.total)}</td></tr>`).join('');

  const saidasRows = (dados.saidas ?? []).map((s) => `<tr><td>${fmtDate(s.criado_em)}</td><td>${s.descricao}</td><td class="right bold red">- ${fmt(s.valor)}</td></tr>`).join('');

  const fluxoRows = (dados.fluxo_caixa ?? []).map((f) => `<tr><td>${fmtDate(f.criado_em)}</td><td>#${f.order_id}</td><td>${PAYMENT_LABELS[f.forma_pagamento] ?? f.forma_pagamento}</td><td>${ORIGEM_LABELS[f.origem] ?? f.origem}</td><td class="right bold green">${fmt(f.valor)}</td><td class="right">${f.troco > 0 ? fmt(f.troco) : '—'}</td></tr>`).join('');

  const pedidosRows = pedidos.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((p) => {
    const itens = (p.itens ?? []).map((i) => `${i.quantity}x ${i.product_name}`).join(', ') || '—';
    return `<tr><td>#${p.id}</td><td>${fmtDate(p.created_at)}</td><td>${p.customers?.name ?? '—'}</td><td>${CANAL_LABELS[p.canal] ?? p.canal ?? '—'}</td><td class="${p.status === 'canceled' ? 'red' : 'green'}">${STATUS_LABELS[p.status] ?? p.status}</td><td>${itens}</td><td class="right bold">${fmt(p.total)}</td></tr>`;
  }).join('');

  const caixaAberto = caixa?.aberto;
  const rc = caixaAberto ? (caixa.resumo ?? {}) : null;
  const porC = rc?.por_pagamento ?? {};
  const digitalCaixa = Object.entries(porC).filter(([k]) => k !== 'cash').reduce((s, [, v]) => s + v, 0);
  const taxaEstCaixa = taxaPagbank > 0 ? digitalCaixa * (taxaPagbank / 100) : 0;
  const sangriasRows = (caixa?.saidas ?? []).map((s) => `<tr><td>${fmtDate(s.criado_em)}</td><td>${MEIO_LABELS[s.meio] ?? s.meio ?? '—'}</td><td>${s.descricao}${s.tipo ? ` (${s.tipo})` : ''}</td><td class="right bold red">- ${fmt(s.valor)}</td></tr>`).join('');
  const adicoesRows = (caixa?.entradas ?? []).map((e) => `<tr><td>${fmtDate(e.criado_em)}</td><td>${MEIO_LABELS[e.meio] ?? e.meio ?? '—'}</td><td>${e.descricao}</td><td class="right bold green">+ ${fmt(e.valor)}</td></tr>`).join('');

  const fechamentoCaixaHtml = caixaAberto ? `
<h2>Fechamento de Caixa — Sessão Atual</h2>
<div class="sub">Operador: ${caixa.nome_operador ?? '—'} · Aberto às: ${fmtDate(caixa.aberto_em)} · Fundo inicial: ${fmt(caixa.valor_inicial)}</div>
<div class="kpi-grid">
  <div class="kpi"><span class="val green">${fmt(rc.especie_calculada)}</span><span class="lbl">Espécie Esperada (Dinheiro)</span></div>
  <div class="kpi"><span class="val">${fmt(digitalCaixa)}</span><span class="lbl">Digital (PagBank)</span></div>
  <div class="kpi"><span class="val red">${fmt(taxaEstCaixa)}</span><span class="lbl">Taxa Estimada (${taxaPagbank}%)</span></div>
  <div class="kpi"><span class="val">${fmt((digitalCaixa - taxaEstCaixa))}</span><span class="lbl">Líquido Digital Esperado</span></div>
</div>
<table><tr><th></th><th class="right">Valor</th></tr>
<tr><td>Fundo Inicial</td><td class="right">${fmt(caixa.valor_inicial)}</td></tr>
<tr><td>+ Adições</td><td class="right bold green">+ ${fmt(rc.total_entradas)}</td></tr>
<tr><td>- Sangrias / Saídas</td><td class="right bold red">- ${fmt(rc.total_saidas)}</td></tr>
<tr><td class="bold">= Espécie Esperada em Caixa</td><td class="right bold">${fmt(rc.especie_calculada)}</td></tr>
</table>
<h2>Sangrias / Saídas do Caixa (${(caixa.saidas ?? []).length})</h2>
<table><tr><th>Hora</th><th>Meio</th><th>Descrição</th><th class="right">Valor</th></tr>${sangriasRows || '<tr><td colspan="4">Nenhuma sangria registrada.</td></tr>'}</table>
<h2>Adições ao Caixa (${(caixa.entradas ?? []).length})</h2>
<table><tr><th>Hora</th><th>Meio</th><th>Descrição</th><th class="right">Valor</th></tr>${adicoesRows || '<tr><td colspan="4">Nenhuma adição registrada.</td></tr>'}</table>
` : '';

  const deD = de ? new Date(de) : null;
  const ateD = ate ? new Date(ate) : null;
  const fechadosPeriodo = (historico ?? []).filter((c) => {
    if (c.status !== 'fechado' || !c.fechado_em) return false;
    if (!deD || !ateD) return true;
    const f = new Date(c.fechado_em);
    return f >= deD && f <= ateD;
  });
  const fechadosRows = fechadosPeriodo.map((c) => {
    const cr = c.resumo ?? {};
    const dc = c.destinacao_fechamento ?? {};
    const dif = dc.diferenca ?? 0;
    const difClass = dif < 0 ? 'red' : dif > 0 ? '' : 'green';
    const conf = dc.conferencia_aprovada === true ? 'Aprovada' : dc.conferencia_aprovada === false ? 'Pendente' : '—';
    return `<tr><td>#${c.id} ${c.nome_operador}</td><td>${fmtDate(c.aberto_em)} → ${fmtDate(c.fechado_em)}</td><td class="right">${fmt(c.valor_inicial)}</td><td class="right">${fmt(cr.total_vendas)}</td><td class="right">${fmt(cr.saldo)}</td><td class="right">${dc.dinheiro_contado !== undefined ? fmt(dc.dinheiro_contado) : '—'}</td><td class="right bold ${difClass}">${dif !== 0 ? (dif > 0 ? '+' : '') + fmt(dif) : fmt(0)}</td><td>${conf}</td></tr>`;
  }).join('');

  const historicoHtml = fechadosPeriodo.length > 0 || (historico && historico.length >= 0 && de && ate) ? `
<h2>Sessões de Caixa Fechadas no Período (${fechadosPeriodo.length})</h2>
<table><tr><th>Operador</th><th>Aberto → Fechado</th><th class="right">Fundo Inicial</th><th class="right">Vendas (Sistema)</th><th class="right">Saldo (Sistema)</th><th class="right">Contado</th><th class="right">Diferença</th><th>Conferência</th></tr>${fechadosRows || '<tr><td colspan="8">Nenhuma sessão fechada no período.</td></tr>'}</table>
` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Financeiro</title><style>${PRINT_STYLE}</style></head><body>
<h1>${nome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório Financeiro Analítico — ${label}</div>

${fechamentoCaixaHtml || '<h2>Fechamento de Caixa</h2><div class="sub">Nenhum caixa aberto no momento.</div>'}
${historicoHtml}

<h2>Resumo Geral do Período</h2>
<div class="kpi-grid">
  <div class="kpi"><span class="val green">${fmt(r.total_vendas)}</span><span class="lbl">Faturamento</span></div>
  <div class="kpi"><span class="val red">- ${fmt(r.total_saidas)}</span><span class="lbl">Saídas</span></div>
  <div class="kpi"><span class="val">${fmt(r.saldo_liquido)}</span><span class="lbl">Saldo Líquido</span></div>
  <div class="kpi"><span class="val">${fmt(r.ticket_medio)}</span><span class="lbl">Ticket Médio</span></div>
</div>
<div class="kpi-grid">
  <div class="kpi"><span class="val">${r.total_pedidos}</span><span class="lbl">Total Pedidos</span></div>
  <div class="kpi"><span class="val green">${r.entregues}</span><span class="lbl">Finalizados</span></div>
  <div class="kpi"><span class="val">${r.em_andamento}</span><span class="lbl">Em Andamento</span></div>
  <div class="kpi"><span class="val red">${r.cancelados}</span><span class="lbl">Cancelados</span></div>
</div>

<h2>Comissões e Gorjetas</h2>
<table><tr><th></th><th class="right">Gerado no Período</th><th class="right">Pago no Período</th></tr>
<tr><td>Comissão Garçom</td><td class="right">${fmt(r.total_comissao)}</td><td class="right bold">${fmt(r.total_comissoes_pagas)}</td></tr>
<tr><td>Gorjeta</td><td class="right">${fmt(r.total_gorjeta)}</td><td class="right bold">${fmt(r.total_gorjetas_pagas)}</td></tr>
<tr><td>Troco</td><td class="right" colspan="2">${fmt(r.total_troco)}</td></tr>
</table>

<h2>Por Forma de Pagamento</h2>
<table><tr><th>Método</th><th class="right">Qtd</th><th class="right">Total</th></tr>${pgto || '<tr><td colspan="3">Sem dados no período.</td></tr>'}</table>

<h2>Por Canal de Venda</h2>
<table><tr><th>Canal</th><th class="right">Pedidos</th><th class="right">Total</th></tr>${canalRows || '<tr><td colspan="3">Sem dados no período.</td></tr>'}</table>

<h2>Saídas (${(dados.saidas ?? []).length})</h2>
<table><tr><th>Data</th><th>Descrição</th><th class="right">Valor</th></tr>${saidasRows || '<tr><td colspan="3">Nenhuma saída no período.</td></tr>'}</table>

<h2>Fluxo de Caixa Detalhado (${(dados.fluxo_caixa ?? []).length})</h2>
<table><tr><th>Hora</th><th>Pedido</th><th>Forma</th><th>Origem</th><th class="right">Valor</th><th class="right">Troco</th></tr>${fluxoRows || '<tr><td colspan="6">Sem movimento no período.</td></tr>'}</table>

<h2>Todos os Pedidos (${pedidos.length})</h2>
<table><tr><th>Pedido</th><th>Data/Hora</th><th>Cliente</th><th>Canal</th><th>Status</th><th>Itens</th><th class="right">Total</th></tr>${pedidosRows || '<tr><td colspan="7">Nenhum pedido no período.</td></tr>'}</table>

<footer>Emitido em: ${new Date().toLocaleString('pt-BR')}</footer>
<script>window.print();setTimeout(()=>{try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}},2000)</script>
</body></html>`;
};
const printIframe = (html) => {
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(f);
  try { f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close(); }
  catch { f.remove(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } }
};

const buildRange = (modo, dia, mes, ano, ini, fim) => {
  if (modo === 'dia')     return { de: startOf(dia), ate: endOf(dia), label: new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR') };
  if (modo === 'mes') { const [y, m] = mes.split('-'); return { de: startOf(`${y}-${m}-01`), ate: endOf(`${y}-${m}-${String(lastDay(mes)).padStart(2, '0')}`), label: new Date(mes + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }; }
  if (modo === 'ano')     return { de: startOf(`${ano}-01-01`), ate: endOf(`${ano}-12-31`), label: `Ano ${ano}` };
  if (modo === 'periodo') return { de: startOf(ini), ate: endOf(fim), label: `${new Date(ini + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(fim + 'T12:00:00').toLocaleDateString('pt-BR')}` };
  return null;
};

const RestauranteFinanceiro = () => {
  const [restauranteNome, setRestauranteNome] = useState('');
  const [modo, setModo] = useState('dia');
  const [dia, setDia]   = useState(today());
  const [mes, setMes]   = useState(thisMonth());
  const [ano, setAno]   = useState(thisYear());
  const [ini, setIni]   = useState(today());
  const [fim, setFim]   = useState(today());
  const [dados, setDados]     = useState(null);
  const [label, setLabel]     = useState('');
  const [rangeAtual, setRangeAtual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [caixa, setCaixa]     = useState(null);
  const [historico, setHistorico] = useState([]);
  const [aprovando, setAprovando] = useState(null);
  const [taxaPagbank, setTaxaPagbank] = useState(0);

  const conferenciasPendentes = historico.filter(
    (cx) => cx.status === 'fechado' && cx.destinacao_fechamento?.conferencia_aprovada === false,
  );

  const carregarDados = async () => {
    const [c, hist] = await Promise.all([getCaixa(), getCaixaHistorico()]);
    setCaixa(c);
    setHistorico(hist.historico ?? []);
  };

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
    getConfig().then((cfg) => setTaxaPagbank(cfg.taxa_pagbank_percent ?? 0)).catch(() => {});
    carregarDados().catch(() => {});
    buscar();
  }, []); // eslint-disable-line

  const buscar = async () => {
    const range = buildRange(modo, dia, mes, ano, ini, fim);
    if (!range) return;
    setLoading(true); setErro(null);
    try { const d = await getRelatorio(range.de, range.ate); setDados(d); setLabel(range.label); setRangeAtual(range); }
    catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  const handleAprovarConferencia = async (caixaId) => {
    setAprovando(caixaId);
    try { await aprovarConferencia(caixaId); await carregarDados(); }
    catch (e) { alert(e.message ?? 'Erro ao aprovar'); }
    finally { setAprovando(null); }
  };

  const r = dados?.resumo;
  const cashTotal    = r?.por_pagamento?.cash?.total ?? 0;
  const digitalTotal = Object.entries(r?.por_pagamento ?? {}).filter(([k]) => k !== 'cash').reduce((s, [, v]) => s + v.total, 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/financeiro" title="Financeiro" subtitle="Gestão financeira gerencial" />

      <main className="p-6 w-[95%] mx-auto max-w-5xl space-y-5">

        {/* Caixa Atual */}
        {caixa?.aberto
          ? <CaixaAtualPanel caixa={caixa} taxaPagbank={taxaPagbank} onRefresh={carregarDados} restauranteNome={restauranteNome} />
          : caixa && (
            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] dark:bg-[#3F3F46] flex items-center justify-center flex-shrink-0">
                <Icon name="Lock" size={18} className="text-[#A1A1AA]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Caixa Fechado</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Abra o caixa no Dashboard para iniciar uma sessão.</p>
              </div>
            </div>
          )
        }

        {/* Conferências Pendentes */}
        {conferenciasPendentes.length > 0 && (
          <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
            <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">Conferências Pendentes</p>
            <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mb-3">Fechamentos aguardando aprovação do gerente</p>
            <div className="space-y-3">
              {conferenciasPendentes.map((cx) => {
                const d   = cx.destinacao_fechamento ?? {};
                const dif = d.diferenca ?? 0;
                const difCor = dif === 0 ? 'text-green-700 dark:text-green-400' : dif > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400';
                return (
                  <div key={cx.id} className="border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">{cx.nome_operador}</p>
                        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{fmtDate(cx.fechado_em)}</p>
                      </div>
                      <button onClick={() => handleAprovarConferencia(cx.id)} disabled={aprovando === cx.id}
                        className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex-shrink-0">
                        {aprovando === cx.id ? '...' : 'Aprovar'}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-lg p-2"><p className="text-[#71717A] dark:text-[#A1A1AA]">Esperado</p><p className="font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(d.especie_calculada)}</p></div>
                      <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-lg p-2"><p className="text-[#71717A] dark:text-[#A1A1AA]">Contou</p><p className="font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(d.dinheiro_contado)}</p></div>
                      <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-lg p-2"><p className="text-[#71717A] dark:text-[#A1A1AA]">Diferença</p><p className={`font-bold ${difCor}`}>{dif > 0 ? '+' : ''}{fmt(dif)}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Análise por Período */}
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="text-xs font-black text-[#A1A1AA] uppercase tracking-widest">Análise por Período</p>
            {dados && (
              <div className="flex gap-2">
                <button onClick={() => setAbaAtiva('saidas')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${abaAtiva === 'saidas' ? 'bg-red-600 border-red-600 text-white' : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'}`}>
                  Sangria ({(dados.saidas ?? []).length})
                </button>
                <button onClick={() => setAbaAtiva('entradas')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${abaAtiva === 'entradas' ? 'bg-green-600 border-green-600 text-white' : 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40'}`}>
                  Adição ({(dados.entradas ?? []).length})
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#3F3F46] p-1 rounded-xl">
              {MODOS.map((m) => (
                <button key={m.value} onClick={() => setModo(m.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${modo === m.value ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'}`}>
                  {m.label}
                </button>
              ))}
            </div>
            {modo === 'dia'     && <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />}
            {modo === 'mes'     && <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />}
            {modo === 'ano'     && <select value={ano} onChange={(e) => setAno(e.target.value)} className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]">{ANOS.map((a) => <option key={a}>{a}</option>)}</select>}
            {modo === 'periodo' && (
              <>
                <input type="date" value={ini} onChange={(e) => setIni(e.target.value)} className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
                <span className="text-sm text-[#71717A] dark:text-[#A1A1AA] self-center">até</span>
                <input type="date" value={fim} min={ini} onChange={(e) => setFim(e.target.value)} className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
              </>
            )}
            <button onClick={buscar} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Search" size={14} />}
              Buscar
            </button>
            {dados && (
              <button onClick={() => printIframe(buildPrint(dados, restauranteNome, label, caixa, taxaPagbank, historico, rangeAtual?.de, rangeAtual?.ate))}
                className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-sm font-bold text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                <Icon name="Printer" size={14} /> Imprimir
              </button>
            )}
          </div>
          {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl mt-3">{erro}</p>}
        </div>

        {dados && r && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-[#27272A] border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Faturamento</p>
                <p className="text-2xl font-black text-green-700 dark:text-green-400">{fmt(r.total_vendas)}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">{r.entregues} pedidos entregues</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Saídas</p>
                <p className="text-2xl font-black text-red-600 dark:text-red-400">- {fmt(r.total_saidas)}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">{(dados.saidas ?? []).length} registros</p>
              </div>
              <div className={`bg-white dark:bg-[#27272A] border rounded-2xl p-4 text-center ${r.saldo_liquido >= 0 ? 'border-[#FF441F]/30' : 'border-red-200 dark:border-red-800'}`}>
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1">Saldo Líquido</p>
                <p className={`text-2xl font-black ${r.saldo_liquido >= 0 ? 'text-[#FF441F]' : 'text-red-600 dark:text-red-400'}`}>{fmt(r.saldo_liquido)}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">Faturamento − Saídas</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1">Ticket Médio</p>
                <p className="text-2xl font-black text-[#18181B] dark:text-[#F4F4F5]">{fmt(r.ticket_medio)}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">{r.total_pedidos} pedidos total</p>
              </div>
            </div>

            <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#3F3F46] p-1 rounded-xl w-fit">
              {[{ id: 'resumo', label: 'Entradas' }, { id: 'canais', label: 'Canais' }, { id: 'saidas', label: `Sangrias (${(dados.saidas ?? []).length})` }, { id: 'entradas', label: `Adições (${(dados.entradas ?? []).length})` }, { id: 'pedidos', label: `Pedidos (${dados.pedidos?.length ?? 0})` }].map((a) => (
                <button key={a.id} onClick={() => setAbaAtiva(a.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${abaAtiva === a.id ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'}`}>
                  {a.label}
                </button>
              ))}
            </div>

            {abaAtiva === 'resumo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(r.por_pagamento ?? {}).length === 0
                  ? <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] col-span-4 text-center py-6">Nenhuma entrada no período.</p>
                  : Object.entries(r.por_pagamento ?? {}).map(([k, v]) => (
                    <div key={k} className={`bg-white dark:bg-[#27272A] border rounded-2xl p-4 ${PAYMENT_COLORS[k] ?? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 text-gray-800 dark:text-gray-400'}`}>
                      <div className="flex items-center gap-2 mb-2"><Icon name={PAYMENT_ICONS[k] ?? 'DollarSign'} size={16} /><p className="text-xs font-bold uppercase tracking-wide">{PAYMENT_LABELS[k] ?? k}</p></div>
                      <p className="text-2xl font-black">{fmt(v.total)}</p>
                      <p className="text-xs mt-1 opacity-70">{v.count} pedido{v.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
              </div>
            )}

            {abaAtiva === 'canais' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#27272A] border border-green-200 dark:border-green-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3"><Icon name="Banknote" size={18} className="text-green-600 dark:text-green-400" /><h3 className="font-bold text-[#18181B] dark:text-[#F4F4F5]">Dinheiro Físico (Caixa)</h3></div>
                  <p className="text-3xl font-black text-green-700 dark:text-green-400 mb-1">{fmt(cashTotal)}</p>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{r.por_pagamento?.cash?.count ?? 0} pagamentos em dinheiro</p>
                  <div className="mt-4 pt-3 border-t border-green-100 dark:border-green-800">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">Estimativa em caixa: {fmt(Math.max(0, cashTotal - r.total_saidas))}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#27272A] border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3"><Icon name="Landmark" size={18} className="text-blue-600 dark:text-blue-400" /><h3 className="font-bold text-[#18181B] dark:text-[#F4F4F5]">Digital / Banco (PagBank)</h3></div>
                  <p className="text-3xl font-black text-blue-700 dark:text-blue-400 mb-1">{fmt(digitalTotal)}</p>
                  {taxaPagbank > 0 && <p className="text-xs text-red-500 dark:text-red-400 font-semibold">Taxa est. ({taxaPagbank}%): - {fmt(digitalTotal * taxaPagbank / 100)}</p>}
                  <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-800 space-y-1">
                    {Object.entries(r.por_pagamento ?? {}).filter(([k]) => k !== 'cash').map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs"><span className="text-[#71717A] dark:text-[#A1A1AA]">{PAYMENT_LABELS[k] ?? k}</span><span className="font-semibold">{fmt(v.total)} ({v.count})</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'saidas' && (
              <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
                {(dados.saidas ?? []).length === 0
                  ? <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhuma saída registrada no período.</p>
                  : (
                    <div>
                      <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] flex justify-between text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest"><span>Data / Descrição</span><span>Valor</span></div>
                      <div className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46] max-h-[400px] overflow-y-auto">
                        {(dados.saidas ?? []).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)).map((s, i) => (
                          <div key={i} className="flex items-center justify-between px-5 py-3">
                            <div><p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">{s.descricao}</p><p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{fmtDate(s.criado_em)}{s.meio && <span className="ml-1.5 px-1.5 py-0.5 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded text-[10px] capitalize">{s.meio}</span>}</p></div>
                            <p className="font-bold text-red-500 dark:text-red-400 text-sm flex-shrink-0">- {fmt(s.valor)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 bg-red-50 dark:bg-red-950/40 border-t border-red-100 dark:border-red-800 flex justify-between"><span className="text-sm font-bold text-red-700 dark:text-red-400">Total saídas</span><span className="text-sm font-black text-red-700 dark:text-red-400">- {fmt(r.total_saidas)}</span></div>
                    </div>
                  )}
              </div>
            )}

            {abaAtiva === 'entradas' && (
              <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
                {(dados.entradas ?? []).length === 0
                  ? <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhuma adição registrada no período.</p>
                  : (
                    <div>
                      <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] flex justify-between text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest"><span>Data / Descrição</span><span>Valor</span></div>
                      <div className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46] max-h-[400px] overflow-y-auto">
                        {(dados.entradas ?? []).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)).map((e, i) => (
                          <div key={i} className="flex items-center justify-between px-5 py-3">
                            <div><p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">{e.descricao}</p><p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{fmtDate(e.criado_em)}{e.meio && <span className="ml-1.5 px-1.5 py-0.5 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded text-[10px] capitalize">{MEIO_LABELS[e.meio] ?? e.meio}</span>}</p></div>
                            <p className="font-bold text-green-600 dark:text-green-400 text-sm flex-shrink-0">+ {fmt(e.valor)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 bg-green-50 dark:bg-green-950/40 border-t border-green-100 dark:border-green-800 flex justify-between"><span className="text-sm font-bold text-green-700 dark:text-green-400">Total adições</span><span className="text-sm font-black text-green-700 dark:text-green-400">+ {fmt(r.total_entradas)}</span></div>
                    </div>
                  )}
              </div>
            )}

            {abaAtiva === 'pedidos' && (
              <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
                {(dados.pedidos ?? []).length === 0
                  ? <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum pedido no período.</p>
                  : (
                    <div>
                      <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] grid grid-cols-4 text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest"><span>Pedido</span><span>Cliente</span><span>Pagamento</span><span className="text-right">Total</span></div>
                      <div className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46] max-h-[500px] overflow-y-auto">
                        {dados.pedidos.map((p) => (
                          <div key={p.id} className="px-5 py-3 grid grid-cols-4 items-center gap-2 hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                            <div><div className="flex items-center gap-1.5"><span className="text-sm font-bold">#{p.id}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[p.status] ?? 'bg-gray-100 dark:bg-gray-950/40 text-gray-700 dark:text-gray-400'}`}>{STATUS_LABELS[p.status] ?? p.status}</span></div><p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{fmtDate(p.created_at)}</p></div>
                            <p className="text-xs truncate">{p.customers?.name ?? '—'}</p>
                            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{PAYMENT_LABELS[p.payment_method] ?? p.payment_method}</p>
                            <p className={`text-sm font-bold text-right ${p.status === 'canceled' ? 'text-red-400 line-through' : 'text-[#18181B] dark:text-[#F4F4F5]'}`}>{fmt(p.total)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-[#18181B] border-t border-[#E4E4E7] dark:border-[#3F3F46] flex justify-between"><span className="text-sm text-[#71717A] dark:text-[#A1A1AA]">{dados.pedidos.length} pedidos · {r.cancelados} cancelados</span><span className="text-sm font-black text-green-700 dark:text-green-400">{fmt(r.total_vendas)} faturados</span></div>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {!dados && !loading && (
          <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-10 text-center">
            <Icon name="BarChart2" size={32} className="text-[#D4D4D8] mx-auto mb-3" />
            <p className="text-[#71717A] dark:text-[#A1A1AA]">Selecione o período e clique em Buscar.</p>
          </div>
        )}

        {/* Histórico de Caixas */}
        <HistoricoCaixasPanel historico={historico} />

      </main>
    </div>
  );
};

export default RestauranteFinanceiro;
