const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', debit_card: 'Débito', cash: 'Dinheiro' };

const printIframe = (html, id) => {
  const f = document.createElement('iframe');
  f.id = id; f.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(f);
  try { f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close(); }
  catch { f.remove(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } }
};

export const printFichaMotoboy = (pedido, itens, cliente, restauranteNome) => {
  const addr = cliente?.address_json ?? {};
  const rua = [addr.logradouro, addr.numero].filter(Boolean).join(', ');
  const compl = [addr.complemento, addr.bairro].filter(Boolean).join(' — ');
  const cidade = [addr.cidade, addr.estado].filter(Boolean).join(' / ');
  const ref = addr.referencia ?? '';
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  const hora = new Date(pedido.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const pgto = PAYMENT_LABELS[pedido.payment_method] ?? pedido.payment_method;
  const isCash = pedido.payment_method === 'cash';
  const bc = barcodeValue(pedido.id);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ficha Motoboy #${pedido.id}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:13px;padding:10px;max-width:300px;margin:0 auto;color:#000}.c{text-align:center}.big{font-size:26px;font-weight:900;text-align:center;letter-spacing:2px;margin:6px 0}hr{border:none;border-top:1px dashed #000;margin:6px 0}.item{display:flex;gap:6px;padding:2px 0}.qty{font-weight:900;min-width:24px}.addr{font-size:12px;line-height:1.5}.bold{font-weight:700}#bc{display:block;margin:6px auto 2px;max-width:260px}@media print{button{display:none!important}}</style>
</head><body>
<div class="c bold" style="font-size:11px;letter-spacing:1px">FICHA DE ENTREGA</div>
<div class="c" style="font-size:12px">${restauranteNome ?? ''}</div>
<div class="big">PEDIDO #${pedido.id}</div>
<div class="c" style="font-size:11px">${hora}</div>
<hr/>
<div class="bold">${cliente?.name ?? 'Cliente'}</div>
${cliente?.phone_e164 ? `<div>${cliente.phone_e164}</div>` : ''}
<div class="addr" style="margin-top:4px">${rua ? `<div>${rua}</div>` : ''}${compl ? `<div>${compl}</div>` : ''}${cidade ? `<div>${cidade}</div>` : ''}${ref ? `<div style="font-weight:bold">Ref: ${ref}</div>` : ''}</div>
<hr/>
${itens.map((i) => `<div class="item"><span class="qty">${i.quantity}x</span><span>${i.product_name ?? `#${i.product_id}`}</span></div>`).join('')}
<hr/>
<div class="c bold" style="font-size:16px">TOTAL: ${fmt(pedido.total)}</div>
<div class="c">${isCash ? '<span style="font-size:13px;font-weight:bold">⚠ COBRAR NA ENTREGA</span>' : `Pago: ${pgto}`}</div>
<hr/>
<svg id="bc"></svg>
<div class="c" style="font-size:10px;letter-spacing:1px;margin-top:2px">ESCANEIE PARA CONFIRMAR COLETA</div>
<div class="c" style="font-size:10px;margin-top:6px">Impresso: ${new Date().toLocaleString('pt-BR')}</div>
<script>
function doBarcode(){
  if(typeof JsBarcode!=='undefined'){
    JsBarcode("#bc","${bc}",{format:"CODE128",width:2,height:56,displayValue:true,fontSize:13,text:"#${pedido.id}",margin:6,background:"#ffffff"});
  }
  window.print();
  setTimeout(()=>{try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}},2000);
}
var s=document.createElement('script');
s.src='https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
s.onload=doBarcode;
s.onerror=function(){document.getElementById('bc').style.display='none';doBarcode()};
document.head.appendChild(s);
</script>
</body></html>`;
  printIframe(html, `motoboy-frame-${pedido.id}-${Date.now()}`);
};

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

// Recibo do cliente — emitido pelo caixa no momento em que a comanda é paga (ideia 9 do
// módulo Salão: garçom só coleta a forma, quem emite o recibo de fato é o caixa).
export const printReciboCliente = (comanda, itens, valores, restauranteNome) => {
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  const { subtotal, desconto = 0, acrescimo = 0, gorjeta = 0, taxaCartao = 0, total, formaPagamento, trocoDado, pagamentos = [] } = valores;
  const PAGAMENTO_ORIGEM = { garcom: 'garçom', estabelecimento: 'caixa' };
  const mesa = comanda?.mesa_id ? `Mesa ${comanda.mesas?.numero ?? comanda.mesa_id}` : 'Comanda avulsa';
  const hora = new Date().toLocaleString('pt-BR');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibo</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:14px;padding:12px;color:#000;max-width:300px;margin:0 auto}
.center{text-align:center;display:block}
.rest{font-size:16px;font-weight:bold;text-align:center;margin-bottom:4px}
hr{border:none;border-top:1px dashed #000;margin:8px 0}
.item{display:flex;gap:8px;padding:3px 0;font-size:14px;justify-content:space-between}
.linha{display:flex;justify-content:space-between;font-size:13px;padding:1px 0}
.total{display:flex;justify-content:space-between;font-size:18px;font-weight:900;padding:4px 0}
.foot{font-size:11px;text-align:center;margin-top:8px}
@media print{button{display:none!important}}
</style></head><body>
<div class="rest">${restauranteNome ?? 'RESTAURANTE'}</div>
<div class="center" style="font-size:11px;letter-spacing:1px">RECIBO DE PAGAMENTO</div>
<hr/>
<div class="center" style="font-size:13px;font-weight:bold">${mesa}</div>
${comanda?.cliente_mesa_nome ? `<div class="center" style="font-size:12px">${comanda.cliente_mesa_nome}</div>` : ''}
<div class="center" style="font-size:11px">${hora}</div>
<hr/>
${itens.map((i) => `<div class="item"><span>${i.quantity}x ${i.product_name ?? i.products?.name}</span><span>${fmt(i.quantity * (i.unit_price ?? 0))}</span></div>`).join('')}
<hr/>
<div class="linha"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
${desconto > 0 ? `<div class="linha"><span>Desconto</span><span>- ${fmt(desconto)}</span></div>` : ''}
${acrescimo > 0 ? `<div class="linha"><span>Acréscimo</span><span>+ ${fmt(acrescimo)}</span></div>` : ''}
${gorjeta > 0 ? `<div class="linha"><span>Gorjeta</span><span>${fmt(gorjeta)}</span></div>` : ''}
${taxaCartao > 0 ? `<div class="linha"><span>Taxa cartão</span><span>+ ${fmt(taxaCartao)}</span></div>` : ''}
<hr/>
<div class="total"><span>TOTAL</span><span>${fmt(total)}</span></div>
${pagamentos.length > 0 ? `
<hr/>
<div class="center" style="font-size:11px;font-weight:bold">PAGAMENTOS</div>
${pagamentos.map((p) => `<div class="linha"><span>${PAYMENT_LABELS[p.forma_pagamento] ?? p.forma_pagamento} (${PAGAMENTO_ORIGEM[p.origem] ?? p.origem})</span><span>${fmt(p.valor)}</span></div>`).join('')}
` : `
<div class="linha"><span>Forma de pagamento</span><span>${PAYMENT_LABELS[formaPagamento] ?? formaPagamento}</span></div>
`}
${trocoDado > 0 ? `<div class="linha"><span>Troco</span><span>${fmt(trocoDado)}</span></div>` : ''}
<hr/>
<div class="foot">Obrigado pela preferência!</div>
<script>
window.print();
try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}
</script>
</body></html>`;

  const frameId = `recibo-frame-${Date.now()}`;
  const iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);

  try {
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
  } catch {
    iframe.remove();
    const w = window.open('', '_blank', 'width=440,height=680');
    if (w) { w.document.write(html); w.document.close(); }
  }
};

// Conferência pedida pelo caixa antes de fechar a conta — só a lista de itens e o
// subtotal até agora, sem dado de pagamento (isso só sai no recibo final via printReciboCliente).
export const printConferenciaComanda = (comanda, itens, restauranteNome) => {
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  const subtotal = itens.reduce((acc, i) => acc + i.quantity * (i.unit_price ?? i.products?.price ?? 0), 0);
  const mesa = comanda?.mesa_id ? `Mesa ${comanda.mesas?.numero ?? comanda.mesa_id}` : 'Comanda avulsa';
  const hora = new Date().toLocaleString('pt-BR');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Conferência</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:14px;padding:12px;color:#000;max-width:300px;margin:0 auto}
.center{text-align:center;display:block}
.rest{font-size:16px;font-weight:bold;text-align:center;margin-bottom:4px}
hr{border:none;border-top:1px dashed #000;margin:8px 0}
.item{display:flex;gap:8px;padding:3px 0;font-size:14px;justify-content:space-between}
.total{display:flex;justify-content:space-between;font-size:18px;font-weight:900;padding:4px 0}
.foot{font-size:11px;text-align:center;margin-top:8px}
@media print{button{display:none!important}}
</style></head><body>
<div class="rest">${restauranteNome ?? 'RESTAURANTE'}</div>
<div class="center" style="font-size:11px;letter-spacing:1px">COMANDA — CONFERÊNCIA</div>
<hr/>
<div class="center" style="font-size:13px;font-weight:bold">${mesa}</div>
${comanda?.cliente_mesa_nome ? `<div class="center" style="font-size:12px">${comanda.cliente_mesa_nome}</div>` : ''}
<div class="center" style="font-size:11px">${hora}</div>
<hr/>
${itens.map((i) => `<div class="item"><span>${i.quantity}x ${i.product_name ?? i.products?.name}</span><span>${fmt(i.quantity * (i.unit_price ?? i.products?.price ?? 0))}</span></div>`).join('')}
<hr/>
<div class="total"><span>TOTAL</span><span>${fmt(subtotal)}</span></div>
<hr/>
<div class="foot">Confira os itens antes de fechar a conta</div>
<script>
window.print();
try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}
</script>
</body></html>`;

  const frameId = `conferencia-frame-${Date.now()}`;
  const iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);

  try {
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
  } catch {
    iframe.remove();
    const w = window.open('', '_blank', 'width=440,height=680');
    if (w) { w.document.write(html); w.document.close(); }
  }
};

// Ticket de setor do módulo Salão (cozinha/bar/salgados...) — só os itens novos
// enviados agora, nunca reimprime os que já foram (ver order_items.status no backend).
export const printTicketSetor = (itens, comanda, setorNome) => {
  if (!itens?.length) return;

  const mesa = comanda?.mesaLabel ?? (comanda?.mesa_id ? `Mesa ${comanda.mesas?.numero ?? comanda.mesa_id}` : null);
  const hora = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${setorNome}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:20px;padding:12px;color:#000;max-width:340px;margin:0 auto}
.center{text-align:center;display:block}
.big{font-size:32px;font-weight:900;text-align:center;letter-spacing:2px;margin:10px 0;text-transform:uppercase}
hr{border:none;border-top:2px dashed #000;margin:10px 0}
.item-nome{font-size:22px;font-weight:900;margin-top:4px}
.item-qtd{font-size:22px;font-weight:900}
.item-desc,.item-obs{font-size:18px;font-weight:400;padding-left:4px;margin-top:2px}
.separador{border:none;border-top:1px dashed #000;margin:14px 0}
@media print{button{display:none!important}}
</style></head><body>
<div class="big">${setorNome ?? 'Setor'}</div>
${mesa ? `<div class="center" style="font-size:20px;font-weight:bold">${mesa}</div>` : ''}
${comanda?.garcons?.nome ? `<div class="center" style="font-size:18px;font-weight:bold">Garçom: ${comanda.garcons.nome}</div>` : ''}
${comanda?.cliente_mesa_nome ? `<div class="center" style="font-size:18px">Cliente: ${comanda.cliente_mesa_nome}</div>` : ''}
${comanda?.cliente_mesa_telefone ? `<div class="center" style="font-size:18px">Whatsapp: ${comanda.cliente_mesa_telefone}</div>` : ''}
<div class="center" style="font-size:14px">${hora}</div>
<hr/>
${itens.map((i, idx) => `
<div class="item-nome">${i.product_name}</div>
<div class="item-qtd">Qtd: ${i.quantity}</div>
${i.description ? `<div class="item-desc">Descrição: ${i.description}</div>` : ''}
${i.observacao ? `<div class="item-obs">Obs: ${i.observacao}</div>` : ''}
${idx < itens.length - 1 ? '<hr class="separador"/>' : ''}
`).join('')}
<hr/>
<script>
window.print();
try{window.frameElement.parentNode.removeChild(window.frameElement)}catch(e){}
</script>
</body></html>`;

  const frameId = `setor-frame-${Date.now()}`;
  const iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);

  try {
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
  } catch {
    iframe.remove();
    const w = window.open('', '_blank', 'width=440,height=680');
    if (w) { w.document.write(html); w.document.close(); }
  }
};
