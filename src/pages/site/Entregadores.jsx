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

const BENEFICIOS = [
  { icon: 'Clock', title: 'Horário livre', desc: 'Fica online quando quiser, desliga quando precisar. Sem escala fixa, sem cobrança de meta.' },
  { icon: 'Route', title: 'Entregas curtas', desc: 'Do bairro pro bairro — menos km rodado, mais entregas feitas no mesmo tempo.' },
  { icon: 'HandCoins', title: 'Ganhos claros', desc: 'Você vê exatamente quanto vai receber por cada entrega antes de aceitar.' },
  { icon: 'Zap', title: 'Cadastro rápido', desc: 'Poucos documentos, aprovação ágil — comece a rodar em poucos dias.' },
];

const PASSOS = [
  { icon: 'FileEdit', title: 'Cadastre-se', desc: 'Envie seus dados e documentos pelo app.' },
  { icon: 'CircleCheck', title: 'Aprovação rápida', desc: 'Análise ágil pra você começar logo.' },
  { icon: 'MapPinned', title: 'Fique online', desc: 'Ative sua disponibilidade no seu bairro.' },
  { icon: 'Bike', title: 'Entregue e ganhe', desc: 'Aceite corridas perto de você e receba por cada uma.' },
];

const Entregadores = () => (
  <SiteLayout>
    {/* ── Hero ──────────────────────────────────────────────────────── */}
    <section className="site-grain relative bg-[var(--site-ink)] text-white pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-20 lg:pb-28 overflow-hidden">
      <ParallaxImage />
      <Blob size={500} tone="gold" opacity={0.24} style={{ top: '-15%', left: '-8%' }} />
      <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="site-kicker text-[11px] text-white/50 mb-6 flex items-center gap-2">
            <Icon name="Bike" size={13} className="text-[var(--site-brand-2)]" /> Para entregadores
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="site-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05]"
          >
            Ganhe entregando no seu <span className="italic site-gradient-text">próprio bairro</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg text-white/60 max-w-md leading-relaxed"
          >
            Entregas curtas, perto de casa. Horário livre, ganhos claros e cadastro rápido — comece a rodar em poucos dias.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9"
          >
            <GradientButton to="/motoboy/cadastro" glow icon="Bike">Quero ser entregador</GradientButton>
          </motion.div>
        </div>

        <TiltCard maxTilt={6} className="rounded-3xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-7 shadow-2xl">
            <p className="site-kicker text-[10px] text-white/40 mb-5">Sua semana</p>
            {[
              { label: 'Entregas feitas', value: '34', icon: 'Bike' },
              { label: 'Distância média', value: '1,8 km', icon: 'Route' },
              { label: 'Ganho da semana', value: 'R$ 486,00', icon: 'Wallet' },
            ].map((s, i) => (
              <div key={s.label} className={`flex items-center justify-between py-3.5 ${i > 0 ? 'border-t border-white/10' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon name={s.icon} size={14} className="text-[var(--site-gold)]" />
                  </div>
                  <span className="text-sm text-white/60">{s.label}</span>
                </div>
                <span className="site-display text-lg font-semibold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>
    </section>

    {/* ── Benefícios ────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
      <RevealOnScroll>
        <Kicker index="01" label="Por que entregar no PediuVai" />
        <h2 className="site-display text-4xl font-medium max-w-xl leading-tight">Menos km rodado, mais tempo pra fazer entrega de verdade.</h2>
      </RevealOnScroll>
      <div className="grid sm:grid-cols-2 gap-6 mt-14">
        {BENEFICIOS.map((b, i) => (
          <RevealOnScroll key={b.title} delay={i * 0.08}>
            <TiltCard maxTilt={4} className="h-full rounded-3xl">
              <div className="h-full flex items-start gap-5 rounded-3xl border border-[var(--site-line)] bg-white p-7">
                <div className="w-11 h-11 rounded-xl bg-[linear-gradient(135deg,#FF441F,#FF7A00)] flex items-center justify-center flex-shrink-0">
                  <Icon name={b.icon} size={19} className="text-white" />
                </div>
                <div>
                  <h3 className="site-display text-lg font-medium mb-2">{b.title}</h3>
                  <p className="text-sm text-[var(--site-ink-soft)]/70 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            </TiltCard>
          </RevealOnScroll>
        ))}
      </div>
    </section>

    {/* ── Bairro vs. cidade inteira ─────────────────────────────────── */}
    <section className="bg-[var(--site-cream-dim)] py-16 sm:py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <RevealOnScroll>
          <TiltCard maxTilt={5} className="rounded-3xl order-2 md:order-1">
            <div className="site-grain relative aspect-square rounded-3xl bg-[var(--site-ink)] flex items-center justify-center overflow-hidden">
              <Blob size={340} tone="gold" opacity={0.35} style={{ bottom: '10%', right: '10%' }} />
              <Icon name="MapPinned" size={80} className="relative text-white/90" strokeWidth={1.1} />
            </div>
          </TiltCard>
        </RevealOnScroll>
        <RevealOnScroll delay={0.1} className="order-1 md:order-2">
          <Kicker index="02" label="A diferença de entregar perto" />
          <h2 className="site-display text-4xl font-medium leading-tight mb-6">
            Correr a cidade inteira cansa. <span className="italic site-gradient-text">Rodar o próprio bairro rende.</span>
          </h2>
          <p className="text-[var(--site-ink-soft)]/70 leading-relaxed max-w-md">
            No PediuVai, cada entrega nasce e termina perto de onde você já está. Isso significa trajetos mais curtos, menos tempo parado no trânsito e mais entregas concluídas no mesmo turno — sem gastar mais gasolina nem mais tempo de estrada.
          </p>
        </RevealOnScroll>
      </div>
    </section>

    {/* ── Como começar ──────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
      <RevealOnScroll className="text-center mb-14">
        <Kicker index="03" label="Como começar" />
        <h2 className="site-display text-4xl font-medium">Do cadastro à primeira entrega, rápido.</h2>
      </RevealOnScroll>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        <div className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-[var(--site-line)]" />
        {PASSOS.map((p, i) => (
          <RevealOnScroll key={p.title} delay={i * 0.1} className="relative text-center">
            <div className="relative z-10 w-14 h-14 mx-auto rounded-2xl bg-[var(--site-ink)] flex items-center justify-center mb-5">
              <Icon name={p.icon} size={22} className="text-[var(--site-gold)]" />
            </div>
            <h3 className="site-display text-lg font-medium mb-2">{p.title}</h3>
            <p className="text-sm text-[var(--site-ink-soft)]/65 max-w-[14rem] mx-auto">{p.desc}</p>
          </RevealOnScroll>
        ))}
      </div>
    </section>

    {/* ── CTA final ─────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 pb-16 sm:pb-20 lg:pb-28">
      <RevealOnScroll>
        <div className="site-grain relative rounded-[2.5rem] bg-[var(--site-ink)] text-white px-8 sm:px-16 py-20 text-center overflow-hidden">
          <ParallaxImage range={40} />
          <Blob size={480} tone="gold" opacity={0.3} style={{ top: '-20%', left: '25%' }} />
          <h2 className="site-display relative text-4xl sm:text-5xl font-medium leading-tight max-w-2xl mx-auto">
            Comece a rodar pelo seu <span className="italic site-gradient-text">próprio bairro</span>.
          </h2>
          <div className="relative mt-10">
            <GradientButton to="/motoboy/cadastro" glow icon="Bike">Quero ser entregador</GradientButton>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  </SiteLayout>
);

export default Entregadores;
