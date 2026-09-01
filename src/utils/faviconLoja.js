// Favicon personalizado por loja é recurso pago (ver modulo_favicon_personalizado) —
// troca o <link rel="icon"> da aba pela logo da loja, com função de restaurar
// pro padrão do DeliveryHub quando sair da página da loja (navegação SPA sem
// reload não reverte isso sozinha).
export const aplicarFaviconLoja = (url) => {
  if (!url) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
};

export const restaurarFaviconPadrao = () => {
  const link = document.querySelector('link[rel="icon"]');
  if (link) link.href = '/favicon.ico';
};
