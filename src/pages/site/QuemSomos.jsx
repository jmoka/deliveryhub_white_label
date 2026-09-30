import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/AppIcon';
import SiteLayout from './components/SiteLayout';
import RevealOnScroll from './components/RevealOnScroll';
import TiltCard from './components/TiltCard';
import GradientButton from './components/GradientButton';
import Blob from './components/Blob';
import Kicker from './components/Kicker';
import ParallaxImage from './components/ParallaxImage';

const PRINCIPIOS = [
  {
    icon: 'MapPinned',
    title: 'Bairro antes de escala',
    desc: 'Preferimos ser essenciais em cada bairro a ser genéricos em todo lugar. Cada região tem seu próprio ritmo, e o produto respeita isso.',
  },
  {
    icon: 'HandCoins',
    title: 'Comissão que faz sentido',
    desc: 'Um estabelecimento pequeno não aguenta o mesmo modelo de um grande. Cobramos o que permite o negócio local continuar de pé.',
  },
  {
    icon: 'Users',
    title: 'Quem entrega mora ali',
    desc: 'O entregador do PediuVai não vem do outro lado da cidade — mora perto, conhece a rua, entrega mais rápido porque o trajeto é curto de verdade.',
  },
  {
    icon: 'Sparkles',
    title: 'Simples de usar, dos dois lados',
    desc: 'Pra quem vende e pra quem compra. Sem telas complicadas, sem etapas a mais — só o que resolve o pedido.',
  },
];

const QuemSomos = () => (
  <SiteLayout>
    {/* ── Hero ──────────────────────────────────────────────────────── */}
    <section className="site-grain relative bg-[var(--site-ink)] text-white pt-28 sm:pt-36 lg:pt-44 pb-20 sm:pb-28 lg:pb-32 overflow-hidden">
      <ParallaxImage />
      <Blob size={480} tone="gold" opacity={0.2} style={{ top: '-15%', right: '-5%' }} />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="site-kicker text-[11px] text-white/50 mb-6">Quem somos</p>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="site-display text-4xl sm:text-6xl font-medium leading-[1.08]"
        >
          Acreditamos que o delivery mais rápido é o <span className="italic site-gradient-text">que vem de perto</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-7 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed"
        >
          O PediuVai nasceu pra conectar quem vende, quem compra e quem entrega dentro do mesmo bairro — sem depender de centros de distribuição distantes nem de comissões que só fazem sentido pra grandes redes.
        </motion.p>
      </div>
    </section>

    {/* ── Manifesto / pull-quote ────────────────────────────────────── */}
    <section className="max-w-4xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
      <RevealOnScroll>
        <Kicker index="01" label="O que nos move" />
        <blockquote className="site-display text-3xl sm:text-4xl font-medium leading-[1.25] text-[var(--site-ink)]">
          Todo bairro já tem tudo o que precisa — <span className="italic site-gradient-text">falta só facilitar o caminho</span> entre quem vende e quem compra.
        </blockquote>
        <p className="mt-8 text-[var(--site-ink-soft)]/70 leading-relaxed max-w-2xl">
          Restaurante de esquina, farmácia do bairro, mercadinho, loja de conveniência — o comércio local já existe, já é bom, e já está perto. O que faltava era uma forma simples de pedir, pagar e acompanhar, sem depender de plataformas feitas pra operar em escala nacional e que tratam cada bairro como um número igual a qualquer outro.
        </p>
      </RevealOnScroll>
    </section>

    {/* ── Princípios ────────────────────────────────────────────────── */}
    <section className="bg-[var(--site-cream-dim)] py-16 sm:py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <RevealOnScroll>
          <Kicker index="02" label="Como pensamos o negócio" />
          <h2 className="site-display text-4xl font-medium max-w-xl leading-tight">Os princípios por trás de cada decisão de produto.</h2>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 gap-6 mt-14">
          {PRINCIPIOS.map((p, i) => (
            <RevealOnScroll key={p.title} delay={i * 0.08}>
              <TiltCard maxTilt={4} className="h-full rounded-3xl">
                <div className="h-full rounded-3xl border border-[var(--site-line)] bg-white p-8">
                  <div className="w-11 h-11 rounded-xl bg-[var(--site-ink)] flex items-center justify-center mb-5">
                    <Icon name={p.icon} size={19} className="text-[var(--site-gold)]" />
                  </div>
                  <h3 className="site-display text-xl font-medium mb-3">{p.title}</h3>
                  <p className="text-sm text-[var(--site-ink-soft)]/70 leading-relaxed">{p.desc}</p>
                </div>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>

    {/* ── Três lados, um propósito ──────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
      <RevealOnScroll className="text-center max-w-2xl mx-auto mb-16">
        <Kicker index="03" label="Um ecossistema, três lados" />
        <h2 className="site-display text-4xl font-medium leading-tight">
          Loja, cliente e entregador crescendo <span className="italic site-gradient-text">juntos</span>, não um às custas do outro.
        </h2>
      </RevealOnScroll>
      <div className="grid md:grid-cols-3 gap-px bg-[var(--site-line)] rounded-3xl overflow-hidden border border-[var(--site-line)]">
        {[
          { icon: 'Store', label: 'Estabelecimento', desc: 'Vende mais sem perder margem pra comissão alta.' },
          { icon: 'ShoppingBag', label: 'Cliente', desc: 'Recebe mais rápido porque tudo vem de perto.' },
          { icon: 'Bike', label: 'Entregador', desc: 'Roda menos km, faz mais entregas, ganha melhor.' },
        ].map((x) => (
          <div key={x.label} className="bg-[var(--site-cream)] p-10 text-center">
            <Icon name={x.icon} size={26} className="mx-auto text-[var(--site-brand)] mb-4" strokeWidth={1.4} />
            <p className="site-display text-lg font-medium mb-2">{x.label}</p>
            <p className="text-sm text-[var(--site-ink-soft)]/65">{x.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── CTA final ─────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 pb-16 sm:pb-20 lg:pb-28">
      <RevealOnScroll>
        <div className="site-grain relative rounded-[2.5rem] bg-[var(--site-ink)] text-white px-8 sm:px-16 py-20 text-center overflow-hidden">
          <ParallaxImage range={40} />
          <Blob size={480} tone="brand" opacity={0.3} style={{ bottom: '-25%', left: '25%' }} />
          <h2 className="site-display relative text-4xl sm:text-5xl font-medium leading-tight max-w-2xl mx-auto">
            Faça parte do bairro que já <span className="italic site-gradient-text">está no PediuVai</span>.
          </h2>
          <div className="relative flex items-center justify-center gap-2.5 sm:gap-4 mt-10">
            <div className="flex-1 sm:flex-none">
              <GradientButton to="/site/estabelecimentos" glow className="w-full !px-3.5 sm:!px-6 justify-center">Sou um estabelecimento</GradientButton>
            </div>
            <div className="flex-1 sm:flex-none">
              <GradientButton to="/site/usuarios" variant="outline" icon="ShoppingBag" className="w-full !px-3.5 sm:!px-6 justify-center !text-white !border-white/20 hover:!border-white/50">
                Quero pedir
              </GradientButton>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  </SiteLayout>
);

export default QuemSomos;
