// Parser leve pro conteúdo de Termos de Uso / Política de Privacidade, editado
// pelo admin como texto simples num textarea (sem markdown completo nem
// biblioteca nova): linha "## texto" vira título de seção, linha "- texto"
// vira item de lista, linha em branco separa parágrafos — qualquer outra
// linha entra no parágrafo corrente.
export function parsePaginaLegal(conteudo) {
  const linhas = (conteudo ?? '').split('\n');
  const blocos = [];
  let paragrafoAtual = [];
  let listaAtual = [];

  const fecharParagrafo = () => {
    if (paragrafoAtual.length) {
      blocos.push({ tipo: 'p', texto: paragrafoAtual.join(' ') });
      paragrafoAtual = [];
    }
  };
  const fecharLista = () => {
    if (listaAtual.length) {
      blocos.push({ tipo: 'ul', itens: listaAtual });
      listaAtual = [];
    }
  };

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trim();
    if (linha.startsWith('## ')) {
      fecharParagrafo();
      fecharLista();
      blocos.push({ tipo: 'h2', texto: linha.slice(3) });
    } else if (linha.startsWith('- ')) {
      fecharParagrafo();
      listaAtual.push(linha.slice(2));
    } else if (linha === '') {
      fecharParagrafo();
      fecharLista();
    } else {
      fecharLista();
      paragrafoAtual.push(linha);
    }
  }
  fecharParagrafo();
  fecharLista();
  return blocos;
}
