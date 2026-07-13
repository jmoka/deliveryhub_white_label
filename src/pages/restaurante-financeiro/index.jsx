import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRelatorio, getMinhaEmpresa, getCaixa, getCaixaHistorico, aprovarConferencia, getConfig } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import CaixaAtualPanel from './CaixaAtualPanel';
import HistoricoCaixasPanel from './HistoricoCaixasPanel';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';

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
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', cash: 'Dinheiro' };
const PAYMENT_ICONS  = { pix: 'QrCode', credit_card: 'CreditCard', debit_card: 'CreditCard', cash: 'Banknote' };
const PAYMENT_COLORS = { pix: 'border-blue-200 bg-blue-50 text-blue-800', credit_card: 'border-purple-200 bg-purple-50 text-purple-800', debit_card: 'border-indigo-200 bg-indigo-50 text-indigo-800', cash: 'border-green-200 bg-green-50 text-green-800' };
const STATUS_LABELS  = { pending: 'Recebido', confirmed: 'Confirmado', preparing: 'Em Preparo', ready: 'Pronto', motoboy_collecting: 'Motoboy', out_for_delivery: 'Em Entrega', delivered: 'Entregue', canceled: 'Cancelado' };
const STATUS_COLORS  = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800', preparing: 'bg-orange-100 text-orange-800', ready: 'bg-purple-100 text-purple-800', motoboy_collecting: 'bg-sky-100 text-sky-800', out_for_delivery: 'bg-indigo-100 text-indigo-800', delivered: 'bg-green-100 text-green-800', canceled: 'bg-red-100 text-red-800' };

const PRINT_STYLE = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;padding:16px;max-width:800px;margin:0 auto}h1{font-size:18px;font-weight:900;margin-bottom:2px}h2{font-size:13px;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}.sub{font-size:11px;color:#555;margin-bottom:12px}table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px}th{background:#f0f0f0;padding:6px 8px;text-align:left;font-weight:700;border:1px solid #ddd}td{padding:5px 8px;border:1px solid #ddd}.right{text-align:right}.bold{font-weight:700}.green{color:#166534}.red{color:#991b1b}.kpi{display:inline-block;border:1px solid #ddd;border-radius:6px;padding:8px 14px;margin:4px;text-align:center;min-width:120px}.kpi .val{font-size:18px;font-weight:900;display:block}.kpi .lbl{font-size:10px;color:#555}@media print{button{display:none!important}}`;
const buildPrint = (dados, nome, label) => {
  const r = dados.resumo;
  const pgto = Object.entries(r.por_pagamento ?? {}).map(([k, v]) => `<tr><td>${PAYMENT_LABELS[k] ?? k}</td><td class="right">${v.count}</td><td class="right bold green">${fmt(v.total)}</td></tr>`).join('');
  const saidasRows = (dados.saidas ?? []).map((s) => `<tr><td>${fmtDate(s.criado_em)}</td><td>${s.descricao}</td><td class="right bold red">- ${fmt(s.valor)}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Financeiro</title><style>${PRINT_STYLE}</style></head><body><h1>${nome ?? 'RESTAURANTE'}</h1><div class="sub">Relatório Financeiro — ${label}</div><div><div class="kpi"><span class="val green">${fmt(r.total_vendas)}</span><span class="lbl">Faturamento</span></div><div class="kpi"><span class="val red">- ${fmt(r.total_saidas)}</span><span class="lbl">Saídas</span></div><div class="kpi"><span class="val">${fmt(r.saldo_liquido)}</span><span class="lbl">Saldo Líquido</span></div><div class="kpi"><span class="val">${r.total_pedidos}</span><span class="lbl">Pedidos</span></div></div><h2>Por Forma de Pagamento</h2><table><tr><th>Método</th><th class="right">Qtd</th><th class="right">Total</th></tr>${pgto}</table>${(dados.saidas ?? []).length > 0 ? `<h2>Saídas</h2><table><tr><th>Data</th><th>Descrição</th><th class="right">Valor</th></tr>${saidasRows}</table>` : ''}<footer>Emitido em: ${new Date().toLocaleString('pt-BR')}</footer><script>window.print();setTimeout(()=>{try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}},2000)</script></body></html>`;
};
const printIframe = (html) => {
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(f);
  try { f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close(); }
  catch { f.remove(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } }
};

const LINKS = [
  { label: 'Dashboard', path: '/restaurante' },
  { label: 'Cozinha', path: '/restaurante/cozinha' },
  { label: 'Produtos', path: '/restaurante/produtos' },
  { label: 'Pedidos', path: '/restaurante/pedidos' },
  { label: 'Motoboys', path: '/restaurante/motoboys' },
  { label: 'Clientes', path: '/restaurante/clientes' },
  { label: 'Financeiro', path: '/restaurante/financeiro' },
  { label: 'Designer', path: '/restaurante/aparencia' },
  { label: 'Config', path: '/restaurante/config' },
];

const buildRange = (modo, dia, mes, ano, ini, fim) => {
  if (modo === 'dia')     return { de: startOf(dia), ate: endOf(dia), label: new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR') };
  if (modo === 'mes') { const [y, m] = mes.split('-'); return { de: startOf(`${y}-${m}-01`), ate: endOf(`${y}-${m}-${String(lastDay(mes)).padStart(2, '0')}`), label: new Date(mes + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }; }
  if (modo === 'ano')     return { de: startOf(`${ano}-01-01`), ate: endOf(`${ano}-12-31`), label: `Ano ${ano}` };
  if (modo === 'periodo') return { de: startOf(ini), ate: endOf(fim), label: `${new Date(ini + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(fim + 'T12:00:00').toLocaleDateString('pt-BR')}` };
  return null;
};

const RestauranteFinanceiro = () => {
  const navigate = useNavigate();
  const pendentesMotoboy = useSolicitacoesMotoboyCount();
  const [restauranteNome, setRestauranteNome] = useState('');
  const [modo, setModo] = useState('dia');
  const [dia, setDia]   = useState(today());
  const [mes, setMes]   = useState(thisMonth());
  const [ano, setAno]   = useState(thisYear());
  const [ini, setIni]   = useState(today());
  const [fim, setFim]   = useState(today());
  const [dados, setDados]     = useState(null);
  const [label, setLabel]     = useState('');
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
    try { const d = await getRelatorio(range.de, range.ate); setDados(d); setLabel(range.label); }
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#18181B]">Financeiro</h1>
          <p className="text-sm text-[#71717A]">Gestão financeira gerencial</p>
        </div>
        <nav className="hidden md:flex gap-1.5 flex-wrap items-center">
          {LINKS.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${l.path === '/restaurante/financeiro' ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30' : 'text-[#27272A] hover:bg-[#F4F4F5]'}`}>
              {l.label}
              {l.path === '/restaurante/motoboys' && pendentesMotoboy > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                  {pendentesMotoboy}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button onClick={() => navigate('/restaurante')} className="md:hidden flex items-center gap-1.5 text-sm text-[#71717A]">
          <Icon name="ChevronLeft" size={16} /> Voltar
        </button>
      </header>

      <main className="p-6 w-[95%] mx-auto max-w-5xl space-y-5">

        {/* Caixa Atual */}
        {caixa?.aberto
          ? <CaixaAtualPanel caixa={caixa} taxaPagbank={taxaPagbank} onRefresh={carregarDados} />
          : caixa && (
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
                <Icon name="Lock" size={18} className="text-[#A1A1AA]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#18181B]">Caixa Fechado</p>
                <p className="text-xs text-[#71717A]">Abra o caixa no Dashboard para iniciar uma sessão.</p>
              </div>
            </div>
          )
        }

        {/* Conferências Pendentes */}
        {conferenciasPendentes.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <p className="text-sm font-bold text-[#18181B] mb-1">Conferências Pendentes</p>
            <p className="text-[10px] text-[#71717A] mb-3">Fechamentos aguardando aprovação do gerente</p>
            <div className="space-y-3">
              {conferenciasPendentes.map((cx) => {
                const d   = cx.destinacao_fechamento ?? {};
                const dif = d.diferenca ?? 0;
                const difCor = dif === 0 ? 'text-green-700' : dif > 0 ? 'text-blue-600' : 'text-red-600';
                return (
                  <div key={cx.id} className="border border-[#E4E4E7] rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#18181B]">{cx.nome_operador}</p>
                        <p className="text-[10px] text-[#71717A]">{fmtDate(cx.fechado_em)}</p>
                      </div>
                      <button onClick={() => handleAprovarConferencia(cx.id)} disabled={aprovando === cx.id}
                        className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex-shrink-0">
                        {aprovando === cx.id ? '...' : 'Aprovar'}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="bg-[#FAFAFA] rounded-lg p-2"><p className="text-[#71717A]">Esperado</p><p className="font-bold text-[#18181B]">{fmt(d.especie_calculada)}</p></div>
                      <div className="bg-[#FAFAFA] rounded-lg p-2"><p className="text-[#71717A]">Contou</p><p className="font-bold text-[#18181B]">{fmt(d.dinheiro_contado)}</p></div>
                      <div className="bg-[#FAFAFA] rounded-lg p-2"><p className="text-[#71717A]">Diferença</p><p className={`font-bold ${difCor}`}>{dif > 0 ? '+' : ''}{fmt(dif)}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Análise por Período */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
          <p className="text-xs font-black text-[#A1A1AA] uppercase tracking-widest mb-3">Análise por Período</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex gap-1 bg-[#F4F4F5] p-1 rounded-xl">
              {MODOS.map((m) => (
                <button key={m.value} onClick={() => setModo(m.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${modo === m.value ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#27272A]'}`}>
                  {m.label}
                </button>
              ))}
            </div>
            {modo === 'dia'     && <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />}
            {modo === 'mes'     && <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />}
            {modo === 'ano'     && <select value={ano} onChange={(e) => setAno(e.target.value)} className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]">{ANOS.map((a) => <option key={a}>{a}</option>)}</select>}
            {modo === 'periodo' && (
              <>
                <input type="date" value={ini} onChange={(e) => setIni(e.target.value)} className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
                <span className="text-sm text-[#71717A] self-center">até</span>
                <input type="date" value={fim} min={ini} onChange={(e) => setFim(e.target.value)} className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
              </>
            )}
            <button onClick={buscar} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Search" size={14} />}
              Buscar
            </button>
            {dados && (
              <button onClick={() => printIframe(buildPrint(dados, restauranteNome, label))}
                className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] rounded-xl text-sm font-bold text-[#27272A] hover:bg-[#F4F4F5]">
                <Icon name="Printer" size={14} /> Imprimir
              </button>
            )}
          </div>
          {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mt-3">{erro}</p>}
        </div>

        {dados && r && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Faturamento</p>
                <p className="text-2xl font-black text-green-700">{fmt(r.total_vendas)}</p>
                <p className="text-xs text-[#71717A] mt-1">{r.entregues} pedidos entregues</p>
              </div>
              <div className="bg-white border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Saídas</p>
                <p className="text-2xl font-black text-red-600">- {fmt(r.total_saidas)}</p>
                <p className="text-xs text-[#71717A] mt-1">{(dados.saidas ?? []).length} registros</p>
              </div>
              <div className={`bg-white border rounded-2xl p-4 text-center ${r.saldo_liquido >= 0 ? 'border-[#FF441F]/30' : 'border-red-200'}`}>
                <p className="text-[10px] font-black text-[#71717A] uppercase tracking-widest mb-1">Saldo Líquido</p>
                <p className={`text-2xl font-black ${r.saldo_liquido >= 0 ? 'text-[#FF441F]' : 'text-red-600'}`}>{fmt(r.saldo_liquido)}</p>
                <p className="text-xs text-[#71717A] mt-1">Faturamento − Saídas</p>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] uppercase tracking-widest mb-1">Ticket Médio</p>
                <p className="text-2xl font-black text-[#18181B]">{fmt(r.ticket_medio)}</p>
                <p className="text-xs text-[#71717A] mt-1">{r.total_pedidos} pedidos total</p>
              </div>
            </div>

            <div className="flex gap-1 bg-[#F4F4F5] p-1 rounded-xl w-fit">
              {[{ id: 'resumo', label: 'Entradas' }, { id: 'canais', label: 'Canais' }, { id: 'saidas', label: `Saídas (${(dados.saidas ?? []).length})` }, { id: 'pedidos', label: `Pedidos (${dados.pedidos?.length ?? 0})` }].map((a) => (
                <button key={a.id} onClick={() => setAbaAtiva(a.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${abaAtiva === a.id ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#27272A]'}`}>
                  {a.label}
                </button>
              ))}
            </div>

            {abaAtiva === 'resumo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(r.por_pagamento ?? {}).length === 0
                  ? <p className="text-sm text-[#71717A] col-span-4 text-center py-6">Nenhuma entrada no período.</p>
                  : Object.entries(r.por_pagamento ?? {}).map(([k, v]) => (
                    <div key={k} className={`bg-white border rounded-2xl p-4 ${PAYMENT_COLORS[k] ?? 'border-gray-200 bg-gray-50 text-gray-800'}`}>
                      <div className="flex items-center gap-2 mb-2"><Icon name={PAYMENT_ICONS[k] ?? 'DollarSign'} size={16} /><p className="text-xs font-bold uppercase tracking-wide">{PAYMENT_LABELS[k] ?? k}</p></div>
                      <p className="text-2xl font-black">{fmt(v.total)}</p>
                      <p className="text-xs mt-1 opacity-70">{v.count} pedido{v.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
              </div>
            )}

            {abaAtiva === 'canais' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border border-green-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3"><Icon name="Banknote" size={18} className="text-green-600" /><h3 className="font-bold text-[#18181B]">Dinheiro Físico (Caixa)</h3></div>
                  <p className="text-3xl font-black text-green-700 mb-1">{fmt(cashTotal)}</p>
                  <p className="text-xs text-[#71717A]">{r.por_pagamento?.cash?.count ?? 0} pagamentos em dinheiro</p>
                  <div className="mt-4 pt-3 border-t border-green-100">
                    <p className="text-xs font-semibold text-green-700">Estimativa em caixa: {fmt(Math.max(0, cashTotal - r.total_saidas))}</p>
                  </div>
                </div>
                <div className="bg-white border border-blue-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3"><Icon name="Landmark" size={18} className="text-blue-600" /><h3 className="font-bold text-[#18181B]">Digital / Banco (PagBank)</h3></div>
                  <p className="text-3xl font-black text-blue-700 mb-1">{fmt(digitalTotal)}</p>
                  {taxaPagbank > 0 && <p className="text-xs text-red-500 font-semibold">Taxa est. ({taxaPagbank}%): - {fmt(digitalTotal * taxaPagbank / 100)}</p>}
                  <div className="mt-4 pt-3 border-t border-blue-100 space-y-1">
                    {Object.entries(r.por_pagamento ?? {}).filter(([k]) => k !== 'cash').map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs"><span className="text-[#71717A]">{PAYMENT_LABELS[k] ?? k}</span><span className="font-semibold">{fmt(v.total)} ({v.count})</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'saidas' && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
                {(dados.saidas ?? []).length === 0
                  ? <p className="text-sm text-[#71717A] text-center py-10">Nenhuma saída registrada no período.</p>
                  : (
                    <div>
                      <div className="px-5 py-3 bg-[#FAFAFA] border-b border-[#F4F4F5] flex justify-between text-xs font-bold text-[#71717A] uppercase tracking-widest"><span>Data / Descrição</span><span>Valor</span></div>
                      <div className="divide-y divide-[#F4F4F5] max-h-[400px] overflow-y-auto">
                        {(dados.saidas ?? []).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)).map((s, i) => (
                          <div key={i} className="flex items-center justify-between px-5 py-3">
                            <div><p className="text-sm font-semibold text-[#18181B]">{s.descricao}</p><p className="text-xs text-[#71717A]">{fmtDate(s.criado_em)}{s.meio && <span className="ml-1.5 px-1.5 py-0.5 bg-[#F4F4F5] rounded text-[10px] capitalize">{s.meio}</span>}</p></div>
                            <p className="font-bold text-red-500 text-sm flex-shrink-0">- {fmt(s.valor)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex justify-between"><span className="text-sm font-bold text-red-700">Total saídas</span><span className="text-sm font-black text-red-700">- {fmt(r.total_saidas)}</span></div>
                    </div>
                  )}
              </div>
            )}

            {abaAtiva === 'pedidos' && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
                {(dados.pedidos ?? []).length === 0
                  ? <p className="text-sm text-[#71717A] text-center py-10">Nenhum pedido no período.</p>
                  : (
                    <div>
                      <div className="px-5 py-3 bg-[#FAFAFA] border-b border-[#F4F4F5] grid grid-cols-4 text-xs font-bold text-[#71717A] uppercase tracking-widest"><span>Pedido</span><span>Cliente</span><span>Pagamento</span><span className="text-right">Total</span></div>
                      <div className="divide-y divide-[#F4F4F5] max-h-[500px] overflow-y-auto">
                        {dados.pedidos.map((p) => (
                          <div key={p.id} className="px-5 py-3 grid grid-cols-4 items-center gap-2 hover:bg-[#FAFAFA]">
                            <div><div className="flex items-center gap-1.5"><span className="text-sm font-bold">#{p.id}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-700'}`}>{STATUS_LABELS[p.status] ?? p.status}</span></div><p className="text-[10px] text-[#71717A]">{fmtDate(p.created_at)}</p></div>
                            <p className="text-xs truncate">{p.customers?.name ?? '—'}</p>
                            <p className="text-xs text-[#71717A]">{PAYMENT_LABELS[p.payment_method] ?? p.payment_method}</p>
                            <p className={`text-sm font-bold text-right ${p.status === 'canceled' ? 'text-red-400 line-through' : 'text-[#18181B]'}`}>{fmt(p.total)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 bg-[#FAFAFA] border-t border-[#E4E4E7] flex justify-between"><span className="text-sm text-[#71717A]">{dados.pedidos.length} pedidos · {r.cancelados} cancelados</span><span className="text-sm font-black text-green-700">{fmt(r.total_vendas)} faturados</span></div>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {!dados && !loading && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-10 text-center">
            <Icon name="BarChart2" size={32} className="text-[#D4D4D8] mx-auto mb-3" />
            <p className="text-[#71717A]">Selecione o período e clique em Buscar.</p>
          </div>
        )}

        {/* Histórico de Caixas */}
        <HistoricoCaixasPanel historico={historico} />

      </main>
    </div>
  );
};

export default RestauranteFinanceiro;
