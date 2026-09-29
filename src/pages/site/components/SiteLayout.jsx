import React, { useEffect } from 'react';
import '../site.css';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Shell de toda página do /site institucional — isolado do resto do app (ver
// site.css: fontes e paleta próprias, escopadas em .site-scope pra nunca
// vazar/colidir com as --color-* do painel).
const SiteLayout = ({ children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="site-scope min-h-screen overflow-x-hidden">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
};

export default SiteLayout;
