import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import SiteLogo from './SiteLogo';
import GradientButton from './GradientButton';

const NAV = [
  { label: 'Quem somos', to: '/site/quem-somos' },
  { label: 'Estabelecimentos', to: '/site/estabelecimentos' },
  { label: 'Para você', to: '/site/usuarios' },
  { label: 'Entregadores', to: '/site/entregadores' },
];

const CADASTRO = [
  { label: 'Tenho um estabelecimento', desc: 'Venda pro seu bairro', to: '/restaurant-registration-setup', icon: 'Store' },
  { label: 'Quero pedir', desc: 'Descubra o que tem perto', to: '/customer-registration-login', icon: 'ShoppingBag' },
  { label: 'Quero entregar', desc: 'Ganhe no seu bairro', to: '/motoboy/cadastro', icon: 'Bike' },
];

// Sempre com fundo escuro translúcido + blur — funciona por cima do hero
// escuro E das seções creme sem precisar trocar de cor no scroll, só fica
// mais opaco (mais legível) depois que passa da dobra.
const SiteHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setCadastroOpen(false); }, [location.pathname]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <div
        className={`w-full max-w-6xl rounded-2xl border transition-all duration-500 ${
          scrolled
            ? 'border-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl'
            : 'border-white/10 backdrop-blur-md'
        }`}
        // Tailwind não sabe aplicar opacidade em cima de uma var() opaca
        // (bg-[var(--site-ink)]/90 não gera CSS nenhum — o fundo ficava
        // totalmente transparente, só o blur, e o texto branco sumia sobre
        // seção clara). rgba() direto aqui resolve de verdade.
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <SiteLogo dark />

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`site-underline-grow text-sm font-medium transition-colors ${
                  location.pathname === item.to ? 'text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block relative">
            <button
              onMouseEnter={() => setCadastroOpen(true)}
              onMouseLeave={() => setCadastroOpen(false)}
              className="relative"
            >
              <GradientButton variant="solid" icon="ChevronDown" glow>
                Cadastre-se
              </GradientButton>
              <AnimatePresence>
                {cadastroOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full pt-3 w-72"
                  >
                    <div className="rounded-2xl border border-white/10 bg-[var(--site-ink)] shadow-2xl overflow-hidden">
                      {CADASTRO.map((c) => (
                        <Link
                          key={c.to}
                          to={c.to}
                          className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#FF441F,#FF7A00)] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon name={c.icon} size={15} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{c.label}</p>
                            <p className="text-xs text-white/50">{c.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <button onClick={() => setOpen((v) => !v)} className="lg:hidden text-white p-2">
            <Icon name={open ? 'X' : 'Menu'} size={22} />
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden overflow-hidden border-t border-white/10"
            >
              <div className="px-5 py-4 space-y-3">
                {NAV.map((item) => (
                  <Link key={item.to} to={item.to} className="block text-sm font-medium text-white/80 hover:text-white py-1">
                    {item.label}
                  </Link>
                ))}
                <div className="pt-2 space-y-2">
                  {CADASTRO.map((c) => (
                    <Link key={c.to} to={c.to} className="flex items-center gap-2 text-sm font-semibold text-white py-1">
                      <Icon name={c.icon} size={14} className="text-[var(--site-brand-2)]" /> {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default SiteHeader;
