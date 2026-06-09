import React, { useState, useEffect } from 'react';
import { getRelatorio } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', cash: 'Dinheiro' };
const STATUS_LABELS = { pending: 'Recebido', confirmed: 'Confirmado', preparing: 'Em Preparo', ready: 'Pronto', out_for_delivery: 'Em Entrega', delivered: 'Entregue', canceled: 'Cancelado' };
const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800', preparing: 'bg-orange-100 text-orange-800', ready: 'bg-purple-100 text-purple-800', out_for_delivery: 'bg-indigo-100 text-indigo-800', delivered: 'bg-green-100 text-green-800', canceled: 'bg-red-100 text-red-800' };

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);
const thisYear = () => new Date().getFullYear().toString();

// BRT (UTC-3) aware date range
const startOf = (dateStr) => new Date(dateStr + 'T00:00:00-03:00').toISOString();
const endOf = (dateStr) => new Date(dateStr + 'T23:59:59-03:00').toISOString();

const lastDayOfMonth = (yearMonth) => {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

const buildRange = (modo, dia, mes, ano, periodoIni, periodoFim) => {
  if (modo === 'dia') return { de: startOf(dia), ate: endOf(dia), label: new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR') };
  if (modo === 'mes') {
    const [y, m] = mes.split('-');
    const ld = lastDayOfMonth(mes);
    return { de: startOf(`${y}-${m}-01`), ate: endOf(`${y}-${m}-${String(ld).padStart(2, '0')}`), label: new Date(mes + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) };
  }
  if (modo === 'ano') return { de: startOf(`${ano}-01-01`), ate: endOf(`${ano}-12-31`), label: `Ano ${ano}` };
  if (modo === 'periodo') return { de: startOf(periodoIni), ate: endOf(periodoFim), label: `${new Date(periodoIni + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(periodoFim + 'T12:00:00').toLocaleDateString('pt-BR')}` };
  return null;
};

const printIframe = (html) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);
  try { iframe.contentDocument.open(); iframe.contentDocument.write(html); iframe.contentDocument.close(); }
  catch { iframe.remove(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } }
};

const reportBaseStyle = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:16px;max-width:800px;margin:0 auto}
h1{font-size:18px;font-weight:900;margin-bottom:2px}
h2{font-size:13px;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}
.sub{font-size:11px;color:#555;margin-bottom:12px}
table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px}
th{background:#f0f0f0;padding:6px 8px;text-align:left;font-weight:700;border:1px solid #ddd}
td{padding:5px 8px;border:1px solid #ddd;vertical-align:top}
.right{text-align:right}.bold{font-weight:700}.green{color:#166534}.red{color:#991b1b}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
.kpi{border:1px solid #ddd;border-radius:6px;padding:8px;text-align:center}
.kpi .val{font-size:20px;font-weight:900;display:block;margin:2px 0}
.kpi .lbl{font-size:10px;color:#555}
.item-sub{font-size:10px;color:#555;padding-left:8px}
footer{margin-top:16px;font-size:10px;color:#888;border-top:1px solid #ddd;padding-top:6px}
@media print{button{display:none!important}}
`;

const buildSintetico = (dados, restauranteNome, label) => {
  const r = dados.resumo;
  const pgto = Object.entries(r.por_pagamento ?? {})
    .map(([k, v]) => `<tr><td>${PAYMENT_LABELS[k] ?? k}</td><td class="right">${v.count}</td><td class="right bold green">${fmt(v.total)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Sintético</title>
<style>${reportBaseStyle}</style></head><body>
<h1>${restauranteNome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório Sintético — ${label}</div>
<div class="kpi-grid">
  <div class="kpi"><span class="val">${r.total_pedidos}</span><span class="lbl">Total Pedidos</span></div>
  <div class="kpi"><span class="val green">${r.entregues}</span><span class="lbl">Entregues</span></div>
  <div class="kpi"><span class="val red">${r.cancelados}</span><span class="lbl">Cancelados</span></div>
  <div class="kpi"><span class="val">${r.em_andamento}</span><span class="lbl">Em Andamento</span></div>
</div>
<h2>Faturamento</h2>
<table><tr><td>Total de Vendas (entregues)</td><td class="right bold green">${fmt(r.total_vendas)}</td></tr>
<tr><td>Ticket Médio</td><td class="right">${fmt(r.ticket_medio)}</td></tr></table>
<h2>Por Forma de Pagamento</h2>
<table><tr><th>Método</th><th class="right">Pedidos</th><th class="right">Total</th></tr>${pgto}</table>
<footer>Emitido em: ${new Date().toLocaleString('pt-BR')}</footer>
<script>window.print();setTimeout(()=>{try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}},2000)</script>
</body></html>`;
};

const buildDetalhado = (dados, restauranteNome, label) => {
  const r = dados.resumo;
  const rows = (dados.pedidos ?? []).map((p) => {
    const itensStr = (p.itens ?? []).map((i) => `${i.quantity}x ${i.product_name ?? `#${i.product_id}`}`).join(', ');
    const sc = p.status === 'delivered' ? 'green' : p.status === 'canceled' ? 'red' : '';
    return `<tr>
      <td>#${p.id}</td>
      <td>${new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
      <td class="${sc}">${STATUS_LABELS[p.status] ?? p.status}</td>
      <td>${p.customers?.name ?? '—'}</td>
      <td>${PAYMENT_LABELS[p.payment_method] ?? p.payment_method}</td>
      <td>${itensStr}</td>
      <td class="right bold">${fmt(p.total)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Detalhado</title>
<style>${reportBaseStyle}table{font-size:10px}</style></head><body>
<h1>${restauranteNome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório Detalhado — ${label}</div>
<div class="kpi-grid">
  <div class="kpi"><span class="val">${r.total_pedidos}</span><span class="lbl">Total Pedidos</span></div>
  <div class="kpi"><span class="val green">${r.entregues}</span><span class="lbl">Entregues</span></div>
  <div class="kpi"><span class="val red">${r.cancelados}</span><span class="lbl">Cancelados</span></div>
  <div class="kpi"><span class="val bold green">${fmt(r.total_vendas)}</span><span class="lbl">Total Vendas</span></div>
</div>
<h2>Pedidos (${(dados.pedidos ?? []).length})</h2>
<table>
  <tr><th>#</th><th>Hora</th><th>Status</th><th>Cliente</th><th>Pgto</th><th>Itens</th><th class="right">Total</th></tr>
  ${rows}
</table>
<footer>Emitido em: ${new Date().toLocaleString('pt-BR')}</footer>
<script>window.print();setTimeout(()=>{try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}},2000)</script>
</body></html>`;
};

const ANOS = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i));
const MODOS = [
  { value: 'dia', label: 'Por Dia' },
  { value: 'mes', label: 'Por Mês' },
  { value: 'ano', label: 'Por Ano' },
  { value: 'periodo', label: 'Período' },
];

const RelatorioPanel = ({ restauranteNome }) => {
  const [modo, setModo] = useState('dia');
  const [dia, setDia] = useState(today());
  const [mes, setMes] = useState(thisMonth());
  const [ano, setAno] = useState(thisYear());
  const [periodoIni, setPeriodoIni] = useState(today());
  const [periodoFim, setPeriodoFim] = useState(today());
  const [dados, setDados] = useState(null);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [aberto, setAberto] = useState(false);

  const buscar = async () => {
    const range = buildRange(modo, dia, mes, ano, periodoIni, periodoFim);
    if (!range) return;
    setLoading(true); setErro(null);
    try {
      const d = await getRelatorio(range.de, range.ate);
      setDados(d); setLabel(range.label);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  // Auto-fetch on mount (default: today)
  useEffect(() => { buscar(); }, []); // eslint-disable-line

  const r = dados?.resumo;

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7]">
      {/* Header colapsável */}
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="font-bold text-[#18181B] flex items-center gap-2">
          <Icon name="BarChart2" size={16} className="text-[#FF441F]" />
          Relatórios
          {dados && <span className="text-xs font-normal text-[#71717A]">— {label}</span>}
        </h2>
        <Icon name={aberto ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-[#71717A]" />
      </button>

      {aberto && (
        <div className="px-5 pb-5 space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-end">
            {/* Modo tabs */}
            <div className="flex gap-1 bg-[#F4F4F5] p-1 rounded-xl">
              {MODOS.map((m) => (
                <button key={m.value} onClick={() => setModo(m.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${modo === m.value ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#27272A]'}`}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Inputs por modo */}
            {modo === 'dia' && (
              <input type="date" value={dia} onChange={(e) => setDia(e.target.value)}
                className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
            )}
            {modo === 'mes' && (
              <input type="month" value={mes} onChange={(e) => setMes(e.target.value)}
                className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
            )}
            {modo === 'ano' && (
              <select value={ano} onChange={(e) => setAno(e.target.value)}
                className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]">
                {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            {modo === 'periodo' && (
              <>
                <input type="date" value={periodoIni} onChange={(e) => setPeriodoIni(e.target.value)}
                  className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
                <span className="text-sm text-[#71717A] self-center">até</span>
                <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)}
                  min={periodoIni}
                  className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
              </>
            )}

            <button onClick={buscar} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 transition-colors">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Search" size={14} />}
              Buscar
            </button>
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{erro}</p>}

          {dados && r && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border border-[#E4E4E7] rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-[#18181B]">{r.total_pedidos}</p>
                  <p className="text-xs text-[#71717A]">Total Pedidos</p>
                </div>
                <div className="border border-green-200 bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-green-700">{r.entregues}</p>
                  <p className="text-xs text-green-600">Entregues</p>
                </div>
                <div className="border border-red-200 bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-red-600">{r.cancelados}</p>
                  <p className="text-xs text-red-500">Cancelados</p>
                </div>
                <div className="border border-[#FF441F]/20 bg-[#FFF4F1] rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-[#FF441F]">{fmt(r.total_vendas)}</p>
                  <p className="text-xs text-[#FF441F]/70">Total Vendas</p>
                </div>
              </div>

              {/* Pagamentos + ticket */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-[#E4E4E7] rounded-xl p-4">
                  <p className="text-xs font-bold text-[#71717A] mb-2 uppercase tracking-wide">Por Forma de Pagamento</p>
                  <div className="space-y-1.5">
                    {Object.entries(r.por_pagamento ?? {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-sm">
                        <span className="text-[#27272A]">{PAYMENT_LABELS[k] ?? k} <span className="text-[#71717A] text-xs">({v.count})</span></span>
                        <span className="font-bold text-green-700">{fmt(v.total)}</span>
                      </div>
                    ))}
                    {Object.keys(r.por_pagamento ?? {}).length === 0 && (
                      <p className="text-xs text-[#71717A]">Sem dados</p>
                    )}
                  </div>
                </div>
                <div className="border border-[#E4E4E7] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#71717A] mb-1 uppercase tracking-wide">Ticket Médio</p>
                    <p className="text-2xl font-black text-[#18181B]">{fmt(r.ticket_medio)}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-[#71717A] mb-1 uppercase tracking-wide">Em Andamento</p>
                    <p className="text-lg font-black text-blue-600">{r.em_andamento}</p>
                  </div>
                </div>
              </div>

              {/* Print buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => printIframe(buildSintetico(dados, restauranteNome, label))}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] rounded-xl text-sm font-bold text-[#27272A] hover:bg-[#F4F4F5] transition-colors">
                  <Icon name="FileText" size={14} />
                  Imprimir Sintético
                </button>
                <button
                  onClick={() => printIframe(buildDetalhado(dados, restauranteNome, label))}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] rounded-xl text-sm font-bold text-[#27272A] hover:bg-[#F4F4F5] transition-colors">
                  <Icon name="FileSpreadsheet" size={14} />
                  Imprimir Detalhado
                </button>
              </div>

              {/* Lista de pedidos */}
              {(dados.pedidos?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#71717A] uppercase tracking-wide mb-2">Pedidos ({dados.pedidos.length})</p>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {dados.pedidos.map((p) => {
                      const sc = STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-700';
                      return (
                        <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#F4F4F5] hover:bg-[#FAFAFA]">
                          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                            p.status === 'delivered' ? 'bg-green-400' :
                            p.status === 'canceled' ? 'bg-red-300' :
                            p.status === 'preparing' ? 'bg-orange-400' : 'bg-blue-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-[#18181B]">#{p.id}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sc}`}>{STATUS_LABELS[p.status] ?? p.status}</span>
                            </div>
                            {p.customers?.name && <p className="text-xs text-[#71717A] truncate">{p.customers.name}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-[#18181B]">{fmt(p.total)}</p>
                            <p className="text-[10px] text-[#71717A]">{new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {dados.pedidos?.length === 0 && (
                <p className="text-sm text-[#71717A] text-center py-4">Nenhum pedido neste período.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RelatorioPanel;
