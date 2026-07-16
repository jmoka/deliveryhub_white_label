// Rodando em localhost, o QR do acompanhamento aponta pra um endereço que só o próprio
// PC alcança — o celular do cliente na mesma rede precisa do IP de rede (VITE_LAN_URL,
// configurado no .env) pra conseguir abrir o link. Em produção (domínio real) isso não
// se aplica, então só retorna a variante LAN quando o host atual é localhost/127.0.0.1.
export const getAcompanharUrls = (token) => {
  const path = `/mesa/acompanhar/${token}`;
  const rodandoLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const lanUrl = import.meta.env.VITE_LAN_URL;

  return {
    principal: `${window.location.origin}${path}`,
    lan: rodandoLocal && lanUrl ? `${lanUrl}${path}` : null,
  };
};
