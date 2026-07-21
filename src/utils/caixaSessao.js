// Qual caixa (Principal/Bar/Salão) esse dispositivo/navegador está lançando as vendas —
// escolhido uma vez pelo operador quando há mais de 1 caixa aberto simultâneo.
const CHAVE = 'caixa_ativo_id';

export const getCaixaAtivoId = () => {
  const v = localStorage.getItem(CHAVE);
  return v ? Number(v) : null;
};

export const setCaixaAtivoId = (id) => {
  if (id === null || id === undefined) localStorage.removeItem(CHAVE);
  else localStorage.setItem(CHAVE, String(id));
};

// Resolve o caixa_id a mandar nas requisições: se só existe 1 caixa aberto, usa ele
// direto (sem precisar escolher). Se existem vários, usa o que foi escolhido — e se
// a escolha salva não é mais válida (caixa fechou), volta a exigir escolha.
export const resolverCaixaAtivo = (caixasAbertos) => {
  if (!caixasAbertos?.length) return null;
  if (caixasAbertos.length === 1) return caixasAbertos[0].id;
  const salvo = getCaixaAtivoId();
  return caixasAbertos.some((c) => c.id === salvo) ? salvo : null;
};
