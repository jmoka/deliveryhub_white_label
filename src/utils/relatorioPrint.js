export const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

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

export const defaultFiltroState = () => ({
  modo: 'dia',
  dia: today(),
  mes: thisMonth(),
  ano: thisYear(),
  periodoIni: today(),
  periodoFim: today(),
});

export const ANOS = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i));
export const MODOS = [
  { value: 'dia', label: 'Por Dia' },
  { value: 'mes', label: 'Por Mês' },
  { value: 'ano', label: 'Por Ano' },
  { value: 'periodo', label: 'Período' },
];

export const buildRange = (modo, dia, mes, ano, periodoIni, periodoFim) => {
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

export const printIframe = (html) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);
  try { iframe.contentDocument.open(); iframe.contentDocument.write(html); iframe.contentDocument.close(); }
  catch { iframe.remove(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } }
};

export const reportBaseStyle = `
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
footer{margin-top:16px;font-size:10px;color:#888;border-top:1px solid #ddd;padding-top:6px}
@media print{button{display:none!important}}
`;

export const printFooterScript = `<script>window.print();setTimeout(()=>{try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}},2000)</script>`;
