const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', debit_card: 'Débito', cash: 'Dinheiro' };

export const barcodeValue = (id) => String(id).padStart(8, '0');

export const getPrinterName = () => localStorage.getItem('kitchen_printer_name') ?? '';
export const setPrinterName = (name) => localStorage.setItem('kitchen_printer_name', name);

const showPrinterToast = (printerName) => {
  const existing = document.getElementById('printer-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'printer-toast';
  toast.innerHTML = `🖨️ Selecione <strong>"${printerName}"</strong> na caixa de impressão`;
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1A1A1A;color:#FFD700;padding:12px 22px;border-radius:14px;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 4px 24px rgba(0,0,0,0.6);white-space:nowrap';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
};

/**
 * Prints comanda using a hidden iframe (avoids popup blockers — works from setInterval/auto-print).
 * If printerHint (name) is set, shows a toast reminding which printer to select.
 */
export const printComanda = (pedido, itens, restauranteNome, printerHint) => {
  const hint = printerHint ?? getPrinterName();
  if (hint) showPrinterToast(hint);

  const bc = barcodeValue(pedido.id);
  const hora = new Date(pedido.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const clienteNome = pedido.customers?.name ?? (pedido.cliente?.name ?? '');
  const pgto = PAYMENT_LABELS[pedido.payment_method] ?? pedido.payment_method;
  const isCash = pedido.payment_method === 'cash';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Comanda #${pedido.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:14px;padding:12px;color:#000;max-width:300px;margin:0 auto}
.center{text-align:center;display:block}
.big{font-size:30px;font-weight:900;text-align:center;letter-spacing:3px;margin:8px 0}
.rest{font-size:16px;font-weight:bold;text-align:center;margin-bottom:4px}
hr{border:none;border-top:1px dashed #000;margin:8px 0}
.item{display:flex;gap:8px;padding:3px 0;font-size:15px}
.qty{font-weight:900;min-width:28px}
.foot{font-size:11px;text-align:center;margin-top:6px}
#barcode{display:block;margin:8px auto 4px;max-width:260px}
@media print{button{display:none!important}}
</style></head><body>
<div class="rest">${restauranteNome ?? 'RESTAURANTE'}</div>
<div class="center" style="font-size:11px;letter-spacing:1px">COMANDA DE COZINHA</div>
<hr/>
<div class="big">PEDIDO #${pedido.id}</div>
<div class="center" style="font-size:13px">${hora}</div>
${clienteNome ? `<div class="center" style="font-size:12px;margin-top:2px;font-weight:bold">${clienteNome}</div>` : ''}
<hr/>
${itens.map((i) => `<div class="item"><span class="qty">${i.quantity}x</span><span>${i.product_name ?? `Produto #${i.product_id}`}</span></div>`).join('')}
<hr/>
<div class="center" style="font-size:13px">Pgto: <b>${pgto}</b>${isCash ? ' &nbsp;⚠ COBRAR' : ''}</div>
<hr/>
<svg id="barcode"></svg>
<div style="text-align:center;margin:6px 0 2px">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${bc}&qzone=1" width="110" height="110" alt="QR #${pedido.id}" style="display:inline-block" />
  <div style="font-size:10px;letter-spacing:1px;margin-top:2px">SCAN MOTOBOY</div>
</div>
<div class="foot">Impresso: ${new Date().toLocaleString('pt-BR')}</div>
<script>
function doBarcode(){
  if(typeof JsBarcode!=='undefined'){
    JsBarcode("#barcode","${bc}",{format:"CODE128",width:2,height:56,displayValue:true,fontSize:13,text:"#${pedido.id}",margin:6,background:"#ffffff"});
  }
  window.print();
  try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}
}
var s=document.createElement('script');
s.src='https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
s.onload=doBarcode;
s.onerror=function(){document.getElementById('barcode').style.display='none';doBarcode()};
document.head.appendChild(s);
</script>
</body></html>`;

  // Use hidden iframe — no popup blocker, works from setInterval
  const frameId = `comanda-frame-${pedido.id}-${Date.now()}`;
  const iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);

  try {
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
  } catch {
    // cross-origin fallback (shouldn't happen for same-origin but just in case)
    iframe.remove();
    const w = window.open('', '_blank', 'width=440,height=680');
    if (w) { w.document.write(html); w.document.close(); }
  }
};
