import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/AppIcon';
import SiteLayout from './components/SiteLayout';
import RevealOnScroll from './components/RevealOnScroll';
import TiltCard from './components/TiltCard';
import GradientButton from './components/GradientButton';
import Blob from './components/Blob';
import Kicker from './components/Kicker';

const CATEGORIAS = ['Restaurantes', 'Farmácias', 'Mercados', 'Lojas', 'Serviços', 'Pet shops', 'Padarias', 'Açaí'];

const AUDIENCIAS = [
  {
    to: '/site/estabelecimentos',
    icon: 'Store',
    tag: 'Estabelecimentos',
    title: 'Sua loja, vendendo pro bairro inteiro',
    desc: 'Cardápio digital, pedidos, financeiro e entrega — tudo num painel só, com comissão que deixa sobrar mais no seu bolso.',
  },
  {
    to: '/site/usuarios',
    icon: 'MapPin',
    tag: 'Para você',
    title: 'Descubra o que tem pertinho de casa',
    desc: 'Restaurante, farmácia, mercado ou loja — tudo o que o seu bairro vende, num só lugar, com entrega acompanhada em tempo real.',
  },
  {
    to: '/site/entregadores',
    icon: 'Bike',
    tag: 'Entregadores',
    title: 'Ganhe entregando na sua própria região',
    desc: 'Entregas curtas, do seu bairro pro seu bairro. Horário livre, ganhos claros, cadastro rápido.',
  },
];

const PASSOS = [
  { icon: 'Search', title: 'Escolha', desc: 'Veja o que tem aberto perto de você agora.' },
  { icon: 'ShoppingBag', title: 'Peça', desc: 'Monte seu pedido e pague do jeito que preferir.' },
  { icon: 'Bike', title: 'Acompanhe', desc: 'Veja o entregador do seu bairro a caminho, em tempo real.' },
  { icon: 'PartyPopper', title: 'Receba', desc: 'Rápido, porque veio de perto — não do outro lado da cidade.' },
];

const DIFERENCIAIS = [
  {
    kicker: 'Comissão justa',
    title: 'Sobra mais pra quem vende',
    desc: 'Comissão pensada pra caber no bolso do pequeno estabelecimento — sem letra miúda, sem taxa escondida. Menos comissão sobre a venda, mais sobra no fim do mês.',
    icon: 'Percent',
  },
  {
    kicker: 'Tudo no bairro',
    title: 'Curto pra caminhar, curto pra entregar',
    desc: 'Cada entrega roda dentro da própria região — o entregador conhece o caminho, o pedido chega mais rápido, e o dinheiro do frete fica ali perto, não vira taxa de plataforma.',
    icon: 'MapPinned',
  },
  {
    kicker: 'Um painel só',
    title: 'Cardápio, pedidos e caixa juntos',
    desc: 'O estabelecimento gerencia cardápio digital, cozinha, entregas e financeiro no mesmo lugar — sem precisar de três sistemas diferentes que não conversam entre si.',
    icon: 'LayoutDashboard',
  },
];

/* ── Composição 3D flutuante do hero — cartões representando pedido/loja/
   entrega, sem depender de screenshot real (produto muda, isso não quebra). */
const HeroComposition = () => (
  <div className="relative h-[420px] hidden lg:block">
    <TiltCard maxTilt={6} className="absolute top-0 right-4 w-56 site-float rounded-3xl">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[linear-gradient(135deg,#FF441F,#FF7A00)] flex items-center justify-center">
            <Icon name="UtensilsCrossed" size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Burguinho do Zé</p>
            <p className="text-white/50 text-[11px]">2 min daqui</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,#FF441F,#FFC24B)]" />
        </div>
        <p className="text-white/40 text-[10px] mt-2">Em preparo</p>
      </div>
    </TiltCard>

    <TiltCard maxTilt={6} className="absolute top-40 right-32 w-52 site-float-delay rounded-3xl">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white text-sm font-semibold">Repasse do dia</p>
          <Icon name="TrendingUp" size={14} className="text-[var(--site-gold)]" />
        </div>
        <p className="site-display text-2xl text-white font-semibold">R$ 342,90</p>
        <p className="text-white/40 text-[11px] mt-1">18 pedidos entregues</p>
      </div>
    </TiltCard>

    <TiltCard maxTilt={6} className="absolute top-[19rem] right-0 w-48 site-float rounded-3xl">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#FFC24B,#FF7A00)] flex items-center justify-center flex-shrink-0">
          <Icon name="Bike" size={16} className="text-[var(--site-ink)]" />
        </div>
        <div>
          <p className="text-white text-xs font-semibold">A caminho</p>
          <p className="text-white/40 text-[10px]">Chega em 6 min</p>
        </div>
      </div>
    </TiltCard>
  </div>
);

const Home = () => (
  <SiteLayout>
    {/* ── Hero ──────────────────────────────────────────────────────── */}
    <section className="site-grain relative bg-[var(--site-ink)] text-white pt-44 pb-28 overflow-hidden">
      <Blob size={520} tone="brand" opacity={0.28} style={{ top: '-10%', left: '-8%' }} />
      <Blob size={420} tone="gold" opacity={0.16} style={{ bottom: '-15%', right: '10%' }} />
      <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--site-brand-2)] animate-pulse" />
            <span className="site-kicker text-[11px] text-white/70">O marketplace do seu bairro</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="site-display text-5xl sm:text-6xl lg:text-[4.3rem] font-medium leading-[1.02] tracking-tight"
          >
            Pediu.
            <br />
            <span className="site-gradient-text italic">Vai.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg text-white/60 max-w-md leading-relaxed"
          >
            Compre, peça e receba de restaurantes, farmácias, mercados e lojas perto de você — entregue por gente do seu próprio bairro.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <GradientButton to="/site/estabelecimentos" glow>Vender no PediuVai</GradientButton>
            <GradientButton to="/site/usuarios" variant="outline" icon="MapPin" className="!text-white !border-white/20 hover:!border-white/50">
              Ver o que tem perto
            </GradientButton>
          </motion.div>
        </div>

        <HeroComposition />
      </div>
    </section>

    {/* ── Marquee de categorias ────────────────────────────────────── */}
    <div className="border-b border-[var(--site-line)] bg-[var(--site-cream-dim)] py-5 overflow-hidden">
      <div className="flex gap-10 w-max animate-carrossel-continuo" style={{ '--carrossel-duracao': '28s' }}>
        {[...CATEGORIAS, ...CATEGORIAS, ...CATEGORIAS].map((c, i) => (
          <span key={i} className="site-display italic text-2xl text-[var(--site-ink-soft)]/40 flex items-center gap-10 flex-shrink-0">
            {c} <span className="text-[var(--site-brand)]">·</span>
          </span>
        ))}
      </div>
    </div>

    {/* ── Pra quem é ────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-28">
      <RevealOnScroll>
        <Kicker index="01" label="Pra quem é o PediuVai" />
        <h2 className="site-display text-4xl sm:text-5xl font-medium max-w-2xl leading-[1.08]">
          Um marketplace, <span className="italic site-gradient-text">três formas</span> de fazer parte do seu bairro.
        </h2>
      </RevealOnScroll>

      <div className="grid md:grid-cols-3 gap-6 mt-14">
        {AUDIENCIAS.map((a, i) => (
          <RevealOnScroll key={a.to} delay={i * 0.1}>
            <TiltCard maxTilt={5} className="h-full rounded-3xl">
              <a href={a.to} className="group block h-full rounded-3xl border border-[var(--site-line)] bg-white p-7 hover:shadow-2xl hover:shadow-black/5 transition-shadow duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[linear-gradient(135deg,#FF441F,#FF7A00)] flex items-center justify-center mb-6">
                  <Icon name={a.icon} size={20} className="text-white" />
                </div>
                <p className="site-kicker text-[10px] text-[var(--site-brand)] mb-2">{a.tag}</p>
                <h3 className="site-display text-xl font-medium leading-snug mb-3">{a.title}</h3>
                <p className="text-sm text-[var(--site-ink-soft)]/70 leading-relaxed mb-6">{a.desc}</p>
                <span className="site-underline-grow inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--site-ink)]">
                  Saiba mais
                  <Icon name="ArrowUpRight" size={15} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </a>
            </TiltCard>
          </RevealOnScroll>
        ))}
      </div>
    </section>

    {/* ── Como funciona ─────────────────────────────────────────────── */}
    <section className="bg-[var(--site-cream-dim)] py-28">
      <div className="max-w-6xl mx-auto px-6">
        <RevealOnScroll className="text-center">
          <Kicker index="02" label="Como funciona" />
        </RevealOnScroll>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14 relative">
          <div className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-[var(--site-line)]" />
          {PASSOS.map((p, i) => (
            <RevealOnScroll key={p.title} delay={i * 0.1} className="relative text-center">
              <div className="relative z-10 w-14 h-14 mx-auto rounded-2xl bg-[var(--site-ink)] flex items-center justify-center mb-5">
                <Icon name={p.icon} size={22} className="text-[var(--site-gold)]" />
              </div>
              <h3 className="site-display text-lg font-medium mb-2">{p.title}</h3>
              <p className="text-sm text-[var(--site-ink-soft)]/65 leading-relaxed max-w-[16rem] mx-auto">{p.desc}</p>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>

    {/* ── Diferenciais (blocos alternados) ─────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-28 space-y-24">
      {DIFERENCIAIS.map((d, i) => (
        <RevealOnScroll key={d.title}>
          <div className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
            <div>
              <Kicker index={`0${i + 3}`} label={d.kicker} />
              <h3 className="site-display text-3xl sm:text-4xl font-medium leading-tight mb-5">{d.title}</h3>
              <p className="text-[var(--site-ink-soft)]/70 leading-relaxed max-w-md">{d.desc}</p>
            </div>
            <TiltCard maxTilt={5} className="rounded-3xl">
              <div className="site-grain relative aspect-[4/3] rounded-3xl bg-[var(--site-ink)] flex items-center justify-center overflow-hidden">
                <Blob size={300} tone={i === 0 ? 'brand' : i === 1 ? 'gold' : 'ink'} opacity={0.4} style={{ top: '20%', left: '20%' }} />
                <Icon name={d.icon} size={64} className="relative text-white/90" strokeWidth={1.2} />
              </div>
            </TiltCard>
          </div>
        </RevealOnScroll>
      ))}
    </section>

    {/* ── CTA final ─────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 pb-28">
      <RevealOnScroll>
        <div className="site-grain relative rounded-[2.5rem] bg-[var(--site-ink)] text-white px-8 sm:px-16 py-20 text-center overflow-hidden">
          <Blob size={500} tone="brand" opacity={0.3} style={{ top: '-20%', left: '30%' }} />
          <h2 className="site-display relative text-4xl sm:text-5xl font-medium leading-tight max-w-2xl mx-auto">
            Seu bairro já tem tudo o que você precisa. <span className="italic site-gradient-text">Falta só pedir.</span>
          </h2>
          <div className="relative flex flex-wrap items-center justify-center gap-4 mt-10">
            <GradientButton to="/site/estabelecimentos" glow>Cadastrar meu estabelecimento</GradientButton>
            <GradientButton to="/site/entregadores" variant="outline" icon="Bike" className="!text-white !border-white/20 hover:!border-white/50">
              Quero ser entregador
            </GradientButton>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  </SiteLayout>
);

export default Home;
