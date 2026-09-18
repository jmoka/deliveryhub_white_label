import { useState, useEffect } from 'react';

const PAGBANK_SDK_URL = 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js';

// Carrega o PagBank.js sob demanda (compartilhado entre todos os fluxos de
// cartão via PagBank — fatura do restaurante, checkout do cliente, etc).
export const usePagBankSdk = (ativo) => {
  const [pronto, setPronto] = useState(!!window.PagSeguro);

  useEffect(() => {
    if (!ativo || window.PagSeguro) { if (window.PagSeguro) setPronto(true); return; }
    let script = document.querySelector(`script[src="${PAGBANK_SDK_URL}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = PAGBANK_SDK_URL;
      script.async = true;
      document.body.appendChild(script);
    }
    const onLoad = () => setPronto(!!window.PagSeguro);
    script.addEventListener('load', onLoad);
    if (window.PagSeguro) setPronto(true);
    return () => script.removeEventListener('load', onLoad);
  }, [ativo]);

  return pronto;
};
