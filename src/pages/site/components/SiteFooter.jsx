import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import SiteLogo from './SiteLogo';

const SiteFooter = () => (
  <footer className="site-grain relative bg-[var(--site-ink)] text-white pt-20 pb-10 overflow-hidden">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-12 pb-14 border-b border-white/10">
        <div>
          <SiteLogo dark />
          <p className="text-sm text-white/50 mt-4 max-w-xs leading-relaxed">
            O marketplace do seu bairro — restaurantes, farmácias, mercados e lojas perto de você, entregues por gente da própria região.
          </p>
        </div>
        <div>
          <p className="site-kicker text-[11px] text-white/40 mb-4">Institucional</p>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/site" className="hover:text-white transition-colors">Início</Link></li>
            <li><Link to="/site/quem-somos" className="hover:text-white transition-colors">Quem somos</Link></li>
            <li><Link to="/termos-de-uso" className="hover:text-white transition-colors">Termos de uso</Link></li>
            <li><Link to="/politica-privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
          </ul>
        </div>
        <div>
          <p className="site-kicker text-[11px] text-white/40 mb-4">Comece agora</p>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/site/estabelecimentos" className="hover:text-white transition-colors">Sua loja no PediuVai</Link></li>
            <li><Link to="/site/usuarios" className="hover:text-white transition-colors">Peça no PediuVai</Link></li>
            <li><Link to="/site/entregadores" className="hover:text-white transition-colors">Seja entregador</Link></li>
          </ul>
        </div>
        <div>
          <p className="site-kicker text-[11px] text-white/40 mb-4">Painel</p>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/customer-registration-login" className="hover:text-white transition-colors">Entrar</Link></li>
            <li><Link to="/restaurant-registration-setup" className="hover:text-white transition-colors">Painel do estabelecimento</Link></li>
            <li><Link to="/motoboy/cadastro" className="hover:text-white transition-colors">Painel do entregador</Link></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-white/40">
        <p>© {new Date().getFullYear()} PediuVai — Pediu. Vai.</p>
        <div className="flex items-center gap-1.5">
          <Icon name="MapPin" size={13} /> Feito pra crescer bairro a bairro.
        </div>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
