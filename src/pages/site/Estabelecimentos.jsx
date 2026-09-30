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

const VANTAGENS = [
  { icon: 'Percent', title: 'Comissão que cabe no bolso', desc: 'Pensada pro pequeno e médio estabelecimento — vende mais sem ver a margem inteira ir embora em taxa.' },
  { icon: 'LayoutDashboard', title: 'Painel completo, sem complicação', desc: 'Cardápio, pedidos, cozinha, caixa e relatórios — tudo no mesmo lugar, sem precisar de três sistemas separados.' },
  { icon: 'Smartphone', title: 'Cardápio digital em minutos', desc: 'Monte seu cardápio com fotos, categorias e promoções sem precisar de ninguém pra te ajudar.' },
  { icon: 'Wallet', title: 'Repasse rápido', desc: 'Acompanhe cada venda e seu repasse com transparência total, direto no painel.' },
  { icon: 'Megaphone', title: 'Visibilidade no seu bairro', desc: 'Apareça pra quem já está perto e pronto pra comprar — sem gastar com anúncio pago.' },
  { icon: 'LifeBuoy', title: 'Suporte de verdade', desc: 'Time disponível pra ajudar a configurar, entender relatórios e resolver imprevistos.' },
];

const RECURSOS = [
  'Cardápio digital com fotos, categorias e adicionais',
  'Gestão de pedidos em tempo real, do recebido ao entregue',
  'Impressão automática por setor — cozinha, bar, produção',
  'Controle de caixa com abertura, sangria e fechamento',
  'Relatórios de vendas, produtos e desempenho por período',
  'Cadastro dos próprios entregadores ou uso da malha do bairro',
];

const Estabelecimentos = () => (
  <SiteLayout>
    {/* ── Hero ──────────────────────────────────────────────────────── */}
    <section className="site-grain relative bg-[var(--site-ink)] text-white pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-20 lg:pb-28 overflow-hidden">
      <ParallaxImage />
      <Blob size={500} tone="brand" opacity={0.26} style={{ top: '-15%', left: '-10%' }} />
      <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="site-kicker text-[11px] text-white/50 mb-6 flex items-center gap-2">
              <Icon name="Store" size={13} className="text-[var(--site-brand-2)]" /> Para estabelecimentos
            </p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="site-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05]"
          >
            Sua loja, vendendo pro <span className="italic site-gradient-text">bairro inteiro</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg text-white/60 max-w-md leading-relaxed"
          >
            Cardápio, pedidos, entrega e caixa num painel só — com uma comissão pensada pra deixar sobrar mais no seu bolso no fim do mês.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9"
          >
            <GradientButton to="/restaurant-registration-setup" glow>Cadastrar meu estabelecimento</GradientButton>
          </motion.div>
        </div>

        <TiltCard maxTilt={6} className="rounded-3xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-7 shadow-2xl">
            <p className="site-kicker text-[10px] text-white/40 mb-5">Painel do estabelecimento</p>
            {[
              { label: 'Pedidos hoje', value: '27', icon: 'ShoppingBag' },
              { label: 'Faturamento do dia', value: 'R$ 612,40', icon: 'Wallet' },
              { label: 'Ticket médio', value: 'R$ 22,68', icon: 'Receipt' },
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

    {/* ── Vantagens ─────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
      <RevealOnScroll>
        <Kicker index="01" label="Por que vender no PediuVai" />
        <h2 className="site-display text-4xl font-medium max-w-xl leading-tight">Feito pra quem toca o negócio sozinho — ou quase.</h2>
      </RevealOnScroll>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
        {VANTAGENS.map((v, i) => (
          <RevealOnScroll key={v.title} delay={i * 0.06}>
            <TiltCard maxTilt={4} className="h-full rounded-3xl">
              <div className="h-full rounded-3xl border border-[var(--site-line)] bg-white p-7">
                <div className="w-11 h-11 rounded-xl bg-[linear-gradient(135deg,#FF441F,#FF7A00)] flex items-center justify-center mb-5">
                  <Icon name={v.icon} size={19} className="text-white" />
                </div>
                <h3 className="site-display text-lg font-medium mb-2.5">{v.title}</h3>
                <p className="text-sm text-[var(--site-ink-soft)]/70 leading-relaxed">{v.desc}</p>
              </div>
            </TiltCard>
          </RevealOnScroll>
        ))}
      </div>
    </section>

    {/* ── Recursos do painel ────────────────────────────────────────── */}
    <section className="bg-[var(--site-cream-dim)] py-16 sm:py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <RevealOnScroll>
          <Kicker index="02" label="Tudo incluso" />
          <h2 className="site-display text-4xl font-medium leading-tight mb-8">Um painel que faz o trabalho pesado por você.</h2>
          <ul className="space-y-4">
            {RECURSOS.map((r) => (
              <li key={r} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[var(--site-ink)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="Check" size={11} className="text-[var(--site-gold)]" />
                </span>
                <span className="text-sm text-[var(--site-ink-soft)]/80 leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </RevealOnScroll>
        <RevealOnScroll delay={0.1}>
          <TiltCard maxTilt={5} className="rounded-3xl">
            <div className="site-grain relative aspect-square rounded-3xl bg-[var(--site-ink)] flex items-center justify-center overflow-hidden">
              <Blob size={340} tone="gold" opacity={0.35} style={{ top: '15%', left: '15%' }} />
              <Icon name="LayoutDashboard" size={80} className="relative text-white/90" strokeWidth={1.1} />
            </div>
          </TiltCard>
        </RevealOnScroll>
      </div>
    </section>

    {/* ── Como começar ──────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
      <RevealOnScroll className="text-center mb-14">
        <Kicker index="03" label="Como começar" />
        <h2 className="site-display text-4xl font-medium">Do cadastro ao primeiro pedido, sem enrolação.</h2>
      </RevealOnScroll>
      <div className="grid sm:grid-cols-3 gap-8">
        {[
          { icon: 'FileEdit', title: 'Cadastre sua loja', desc: 'Nome, endereço, categoria — leva poucos minutos.' },
          { icon: 'UtensilsCrossed', title: 'Monte seu cardápio', desc: 'Adicione produtos, fotos e preços no seu ritmo.' },
          { icon: 'Rocket', title: 'Comece a vender', desc: 'Fique visível pro seu bairro e receba o primeiro pedido.' },
        ].map((s, i) => (
          <RevealOnScroll key={s.title} delay={i * 0.1} className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--site-ink)] flex items-center justify-center mb-5">
              <Icon name={s.icon} size={22} className="text-[var(--site-gold)]" />
            </div>
            <h3 className="site-display text-lg font-medium mb-2">{s.title}</h3>
            <p className="text-sm text-[var(--site-ink-soft)]/65 max-w-[15rem] mx-auto">{s.desc}</p>
          </RevealOnScroll>
        ))}
      </div>
    </section>

    {/* ── CTA final ─────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 pb-16 sm:pb-20 lg:pb-28">
      <RevealOnScroll>
        <div className="site-grain relative rounded-[2.5rem] bg-[var(--site-ink)] text-white px-8 sm:px-16 py-20 text-center overflow-hidden">
          <ParallaxImage range={40} />
          <Blob size={480} tone="brand" opacity={0.3} style={{ top: '-20%', right: '20%' }} />
          <h2 className="site-display relative text-4xl sm:text-5xl font-medium leading-tight max-w-2xl mx-auto">
            Coloque sua loja no <span className="italic site-gradient-text">PediuVai</span> ainda hoje.
          </h2>
          <div className="relative mt-10">
            <GradientButton to="/restaurant-registration-setup" glow>Cadastrar meu estabelecimento</GradientButton>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  </SiteLayout>
);

export default Estabelecimentos;
