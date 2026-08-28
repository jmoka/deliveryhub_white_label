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
  for (const grupo of grupos) {
    if (grupo.nome) {
      blocos.push({ tipo: 'grupo', grupo, peso: pesoGrupo(grupo) });
    } else {
      for (const categoria of grupo.categorias) {
        blocos.push({ tipo: 'categoria', categoria, peso: pesoCategoria(categoria) });
      }
    }
  }
  return blocos;
};

// Distribui os blocos entre 2 colunas tentando equilibrar a altura impressa —
// bin-packing guloso: bloco maior primeiro, sempre entra na coluna que está
// com menos linhas até agora.
const distribuirEmColunas = (grupos) => {
  const blocos = construirBlocos(grupos);
  const ordenados = [...blocos].sort((a, b) => b.peso - a.peso);
  const colunas = [[], []];
  const linhas = [0, 0];
  for (const bloco of ordenados) {
    const alvo = linhas[0] <= linhas[1] ? 0 : 1;
    colunas[alvo].push(bloco);
    linhas[alvo] += bloco.peso;
  }
  return colunas;
};

const blocoCategoria = (categoria) => `
  <div class="categoria">
    <div class="categoria-titulo">${esc(categoria.nome)}</div>
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

const blocoGrupo = (grupo) => `
  <div class="grupo">
    <div class="grupo-titulo">${esc(grupo.nome)}</div>
    ${grupo.categorias.map(blocoCategoria).join('')}
  </div>
`;

const renderBloco = (bloco) => (bloco.tipo === 'grupo' ? blocoGrupo(bloco.grupo) : blocoCategoria(bloco.categoria));

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
 */
export const printCardapioImpresso = ({
  grupos, restauranteNome, logoUrl, usarLogo, endereco, whatsapp, rodape,
  observacaoGeral, imagemFundoUrl,
}) => {
  const [colunaEsq, colunaDir] = distribuirEmColunas(grupos);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cardápio - ${esc(restauranteNome ?? '')}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:0}
html,body{position:relative}
body{font-family:'Segoe UI',Arial,sans-serif;color:#18181B;background:#fff}
.fundo{position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0.12;z-index:0}
.conteudo{position:relative;z-index:1;padding:12mm}
.header{display:flex;flex-direction:column;align-items:center;margin-bottom:16px}
.logo{max-width:90px;max-height:90px;object-fit:contain;margin-bottom:8px;border-radius:12px}
.nome{font-size:26px;font-weight:900;text-align:center;letter-spacing:-0.5px}
.colunas{display:flex;gap:24px}
.coluna{flex:1;min-width:0}
.grupo{break-inside:avoid;margin-bottom:22px}
.grupo-titulo{font-size:17px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#18181B;margin-bottom:10px;padding-bottom:5px;border-bottom:3px solid #18181B}
.categoria{break-inside:avoid;margin-bottom:16px}
.categoria-titulo{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#FF441F;border-bottom:2px solid #FF441F;padding-bottom:3px;margin-bottom:8px}
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
</style></head><body>
${imagemFundoUrl ? `<img class="fundo" src="${esc(imagemFundoUrl)}" />` : ''}
<div class="conteudo">
<div class="header">
  ${usarLogo && logoUrl ? `<img class="logo" src="${esc(logoUrl)}" />` : ''}
  <div class="nome">${esc(restauranteNome ?? '')}</div>
</div>
<div class="colunas">
  <div class="coluna">${colunaEsq.map(renderBloco).join('')}</div>
  <div class="coluna">${colunaDir.map(renderBloco).join('')}</div>
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
  window.print();
  setTimeout(function(){ try{ window.frameElement.parentNode.removeChild(window.frameElement) }catch(e){} }, 500);
});
</script>
</body></html>`;

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
