import { escapeHtml as esc } from './escapeHtml';

const fmt = (v) => `R$ ${Number(v ?? 0).toFixed(2).replace('.', ',')}`;

const pesoCategoria = (categoria) => 1 + categoria.produtos.length;
const pesoGrupo = (grupo) => 1 + grupo.categorias.reduce((s, c) => s + pesoCategoria(c), 0);

// Monta a lista de "blocos" a distribuir entre as colunas: um grupo nomeado
// (com todas as suas categorias dentro) vira UM bloco indivisível, pra nunca
// separar categorias do mesmo grupo em colunas diferentes. Produtos sem grupo
// (nome null) mantêm o comportamento de antes — cada categoria é seu próprio
// bloco independente, livre pra ser distribuída separadamente.
const construirBlocos = (grupos) => {
  const blocos = [];
  let numeroGrupo = 0;
  let numeroCategoriaAvulsa = 0;
  for (const grupo of grupos) {
    if (grupo.nome) {
      numeroGrupo += 1;
      blocos.push({ tipo: 'grupo', grupo, peso: pesoGrupo(grupo), numero: numeroGrupo });
    } else {
      for (const categoria of grupo.categorias) {
        numeroCategoriaAvulsa += 1;
        blocos.push({ tipo: 'categoria', categoria, peso: pesoCategoria(categoria), numero: numeroCategoriaAvulsa });
      }
    }
  }
  return blocos;
};

// Distribui os blocos entre 2 colunas respeitando a ORDEM escolhida pelo dono
// (setas/número no modal) — preenche a coluna 1 em sequência até passar da
// metade do conteúdo total, só então continua na coluna 2. Antes disso era um
// bin-packing por tamanho (reordenava tudo sozinho pra "equilibrar" as
// colunas), o que fazia a ordem configurada não bater com o que saía na
// impressão — o dono não tinha controle nenhum de qual coluna cada bloco caía.
const distribuirEmColunas = (grupos) => {
  const blocos = construirBlocos(grupos);
  const pesoTotal = blocos.reduce((s, b) => s + b.peso, 0);
  const metade = pesoTotal / 2;
  const colunas = [[], []];
  let acumulado = 0;
  let colunaAtual = 0;
  for (const bloco of blocos) {
    colunas[colunaAtual].push(bloco);
    acumulado += bloco.peso;
    if (colunaAtual === 0 && acumulado >= metade) colunaAtual = 1;
  }
  return colunas;
};

// Selo numérico só de orientação (prévia) — nunca aparece na impressão real,
// serve pra conferir visualmente se a ordem batendo com o número digitado no
// modal (grupo e categoria têm sua própria numeração, cada um dentro do seu nível).
const seloNumero = (numero, mostrarNumeracao) =>
  mostrarNumeracao && numero != null ? `<span class="num-badge">${numero}</span>` : '';

const blocoCategoria = (categoria, ocultarTitulo, mostrarNumeracao, numero) => `
  <div class="categoria">
    ${ocultarTitulo
      ? (mostrarNumeracao ? `<div class="categoria-titulo categoria-titulo--so-numero">${seloNumero(numero, mostrarNumeracao)}</div>` : '')
      : `<div class="categoria-titulo">${seloNumero(numero, mostrarNumeracao)}${esc(categoria.nome)}</div>`}
    ${categoria.produtos.map((p) => `
      <div class="item">
        <div class="item-linha">
          <span class="item-nome">${esc(p.name)}</span>
          <span class="item-preco">${fmt(p.preco_promo ?? p.price)}</span>
        </div>
        ${p.description ? `<div class="item-desc">${esc(p.description)}</div>` : ''}
      </div>
    `).join('')}
    ${categoria.observacao ? `<div class="categoria-obs">${esc(categoria.observacao)}</div>` : ''}
  </div>
`;

const blocoGrupo = (grupo, ocultarTitulo, mostrarNumeracao, numero) => `
  <div class="grupo">
    <div class="grupo-titulo">${seloNumero(numero, mostrarNumeracao)}${esc(grupo.nome)}</div>
    ${grupo.categorias.map((c, i) => blocoCategoria(c, ocultarTitulo, mostrarNumeracao, i + 1)).join('')}
  </div>
`;

const renderBloco = (bloco, ocultarTitulo, mostrarNumeracao) =>
  (bloco.tipo === 'grupo'
    ? blocoGrupo(bloco.grupo, ocultarTitulo, mostrarNumeracao, bloco.numero)
    : blocoCategoria(bloco.categoria, ocultarTitulo, mostrarNumeracao, bloco.numero));

/**
 * @param {Object} args
 * @param {{nome: string|null, categorias: {nome: string, observacao?: string, produtos: Array<{name: string, description?: string, price: number, preco_promo?: number|null}>}[]}[]} args.grupos
 * @param {string} args.restauranteNome
 * @param {string|null} args.logoUrl
 * @param {boolean} args.usarLogo
 * @param {string} args.endereco
 * @param {string} args.whatsapp
 * @param {string} args.rodape
 * @param {string} [args.observacaoGeral]
 * @param {string} [args.imagemFundoUrl]
 * @param {boolean} [args.ocultarTituloCategoria]
 * @param {boolean} [args.autoImprimir] — false pra só gerar o HTML de prévia, sem abrir o diálogo de impressão sozinho.
 * @param {boolean} [args.mostrarNumeracao] — selos com a posição de cada grupo/categoria, só orientação (prévia).
 */
export const montarHtmlCardapioImpresso = ({
  grupos, restauranteNome, logoUrl, usarLogo, endereco, whatsapp, rodape,
  observacaoGeral, imagemFundoUrl, ocultarTituloCategoria = false, autoImprimir = true, mostrarNumeracao = false,
}) => {
  const [colunaEsq, colunaDir] = distribuirEmColunas(grupos);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cardápio - ${esc(restauranteNome ?? '')}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:12mm}
html,body{position:relative}
body{font-family:'Segoe UI',Arial,sans-serif;color:#18181B;background:#fff}
.fundo{position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0.12;z-index:0}
.conteudo{position:relative;z-index:1}
.header{display:flex;flex-direction:column;align-items:center;margin-bottom:16px}
.logo{max-width:90px;max-height:90px;object-fit:contain;margin-bottom:8px;border-radius:12px}
.nome{font-size:26px;font-weight:900;text-align:center;letter-spacing:-0.5px}
.colunas{display:flex;gap:24px}
.coluna{flex:1;min-width:0}
.grupo{break-inside:avoid;margin-bottom:22px}
.grupo-titulo{font-size:17px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#18181B;margin-bottom:10px;padding-bottom:5px;border-bottom:3px solid #18181B}
.categoria{break-inside:avoid;margin-bottom:16px}
.categoria-titulo{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#FF441F;border-bottom:2px solid #FF441F;padding-bottom:3px;margin-bottom:8px}
.categoria-titulo--so-numero{border-bottom:none;padding-bottom:0}
.num-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;margin-right:6px;border-radius:9px;background:#2563EB;color:#fff;font-size:11px;font-weight:900;vertical-align:middle}
@media print{.num-badge{display:none!important}}
.item{break-inside:avoid;margin-bottom:7px}
.item-linha{display:flex;align-items:baseline;gap:6px}
.item-nome{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-linha::after{content:"";flex:1;border-bottom:1px dotted #D4D4D8;margin:0 2px 3px}
.item-preco{font-size:13px;font-weight:700;white-space:nowrap}
.item-desc{font-size:10.5px;color:#71717A;margin-top:1px}
.categoria-obs{font-size:10.5px;font-style:italic;color:#71717A;margin-top:4px;padding-top:3px;border-top:1px dotted #D4D4D8}
.rodape{margin-top:20px;padding-top:10px;border-top:1px solid #E4E4E7;text-align:center}
.rodape-obs-geral{font-size:11px;color:#27272A;margin-bottom:4px}
.rodape-frase{font-size:12px;font-style:italic;color:#27272A;margin-bottom:4px}
.rodape-contato{font-size:11px;color:#71717A}
@media print{button{display:none!important}}
/* Só pra prévia em tela (iframe) — simula a folha A4 num fundo cinza, já que
@page/margin nativo não tem efeito nenhum fora da impressão de verdade. Padding
fica no body (não em .conteudo) pra não inflar a medição de altura do script
de encolher-pra-caber lá embaixo — senão a prévia encolheria mais que o real. */
@media screen{
  body{max-width:210mm;margin:16px auto;padding:12mm;box-shadow:0 0 14px rgba(0,0,0,.25)}
}
</style></head><body>
${imagemFundoUrl ? `<img class="fundo" src="${esc(imagemFundoUrl)}" />` : ''}
<div class="conteudo">
<div class="header">
  ${usarLogo && logoUrl ? `<img class="logo" src="${esc(logoUrl)}" />` : ''}
  <div class="nome">${esc(restauranteNome ?? '')}</div>
</div>
<div class="colunas">
  <div class="coluna">${colunaEsq.map((bloco) => renderBloco(bloco, ocultarTituloCategoria, mostrarNumeracao)).join('')}</div>
  <div class="coluna">${colunaDir.map((bloco) => renderBloco(bloco, ocultarTituloCategoria, mostrarNumeracao)).join('')}</div>
</div>
${(observacaoGeral || rodape || endereco || whatsapp) ? `
<div class="rodape">
  ${observacaoGeral ? `<div class="rodape-obs-geral">${esc(observacaoGeral)}</div>` : ''}
  ${rodape ? `<div class="rodape-frase">${esc(rodape)}</div>` : ''}
  ${(endereco || whatsapp) ? `<div class="rodape-contato">${[endereco, whatsapp ? `Delivery: ${whatsapp}` : null].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
</div>` : ''}
</div>
<script>
window.addEventListener('load', function(){
  // Encolhe pra caber em no máximo 2 folhas A4 — sem isso, um cardápio grande
  // simplesmente vaza pra 3ª/4ª página sem nenhum controle. "zoom" (não
  // "transform") porque reflui o layout de verdade, então a paginação de
  // impressão já calcula certo quantas páginas vão sair depois de encolher.
  try {
    var conteudo = document.querySelector('.conteudo');
    var mmParaPx = 96 / 25.4;
    var alturaUtilPorPagina = (297 - 24) * mmParaPx; // A4 menos 12mm de margem em cima/embaixo
    var orcamento = alturaUtilPorPagina * 2;
    var altura = conteudo.scrollHeight;
    if (altura > orcamento) {
      var escala = Math.max(0.62, orcamento / altura);
      conteudo.style.zoom = escala;
    }
  } catch (e) {}
  ${autoImprimir ? `window.print();
  setTimeout(function(){ try{ window.frameElement.parentNode.removeChild(window.frameElement) }catch(e){} }, 500);` : ''}
});
</script>
</body></html>`;
};

// Gera o HTML e já dispara a impressão sozinho (fluxo de sempre — botão
// "Gerar cardápio impresso"), num iframe escondido descartado logo depois.
export const printCardapioImpresso = (args) => {
  const html = montarHtmlCardapioImpresso({ ...args, autoImprimir: true });

  const iframe = document.createElement('iframe');
  iframe.id = `cardapio-impresso-frame-${Date.now()}`;
  iframe.style.cssText = 'position:fixed;bottom:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);

  try {
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
  } catch {
    iframe.remove();
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }
};
