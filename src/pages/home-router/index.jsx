import React, { useState, useEffect } from 'react';
import { getCardapioPorDominio } from '../../services/restauranteService';
import MenuCatalogProductBrowse from '../menu-catalog-product-browse';
import RestauranteCatalogo from '../restaurante-catalogo';

// Montado na rota "/". Tenta resolver o hostname atual como domínio customizado
// de algum estabelecimento; se achar, mostra o cardápio dele na raiz do domínio
// (sem redirect visível pra /r/:slug). Se não achar (inclui o próprio domínio
// principal do marketplace), cai no comportamento padrão de hoje.
const HomeRouter = () => {
  const [status, setStatus] = useState('carregando'); // carregando | loja | marketplace
  const [dadosLoja, setDadosLoja] = useState(null);

  useEffect(() => {
    getCardapioPorDominio(window.location.hostname)
      .then((d) => {
        if (d) {
          setDadosLoja(d);
          setStatus('loja');
        } else {
          setStatus('marketplace');
        }
      })
      .catch(() => setStatus('marketplace'));
  }, []);

  if (status === 'carregando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
        <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'loja') return <RestauranteCatalogo dadosPreCarregados={dadosLoja} />;

  return <MenuCatalogProductBrowse />;
};

export default HomeRouter;
