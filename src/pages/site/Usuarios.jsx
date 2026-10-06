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

const TELEGRAM_BOT_URL = 'https://t.me/pediuvai_bot';

const TELEGRAM_RECURSOS = [
  { icon: 'Search', text: 'Pergunte por um prato e receba o link exato do estabelecimento — sem rolar cardápio nenhum.' },
  { icon: 'MapPin', text: 'Compartilhe sua localização com um toque e veja quem está mais pertinho de você agora.' },
  { icon: 'Zap', text: 'Resposta na hora, direto na conversa — sem precisar abrir o app.' },
];

// Mock de conversa real (pergunta → resposta com link → sugestão de localização),
// mesma jornada que o assistente faz de verdade — reforça confiança mostrando o
// produto funcionando em vez de descrever a feature com texto solto.
const TelegramChatVisual = () => (
  <div className="site-grain relative rounded-3xl bg-[var(--site-ink)] overflow-hidden p-6 sm:p-8">
    <Blob size={320} tone="brand" opacity={0.35} style={{ top: '-12%', right: '-14%' }} />

    <div className="relative z-10 flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
      <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,#2AABEE,#229ED9)] flex items-center justify-center flex-shrink-0">
        <Icon name="Send" size={16} className="text-white" />
      </div>
      <div>
        <p className="text-white text-sm font-semibold">Assistente PediuVai</p>
        <p className="text-white/40 text-[11px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> online agora
        </p>
      </div>
    </div>

    <div className="relative z-10 space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
        className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[var(--site-brand)] text-white text-sm px-4 py-2.5"
      >
        tem prato de peixe por aí?
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/10 text-white text-sm px-4 py-2.5 leading-relaxed"
      >
        Achei no <strong>Sereia do Mar</strong> 🐟 Filé de Dourada Frita — R$ 70
        <span className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--site-gold)]">
          <Icon name="Link" size={11} /> sereiadomar.teusite.top
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="flex justify-center pt-1"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] text-white/70">
          📍 Enviar localização
        </span>
      </motion.div>
    </div>
  </div>
);

const BENEFICIOS = [
  { icon: 'MapPin', title: 'Tudo o que tem perto', desc: 'Restaurante, farmácia, mercado, loja — o comércio do seu bairro, num só lugar.' },
  { icon: 'Radar', title: 'Acompanhe em tempo real', desc: 'Veja o pedido sendo preparado e o entregador a caminho, sem ficar no escuro.' },
  { icon: 'Wallet', title: 'Pague do seu jeito', desc: 'PIX, cartão ou dinheiro na entrega — você escolhe.' },
  { icon: 'HeartHandshake', title: 'Apoie quem é da região', desc: 'Cada pedido fortalece o comércio e o entregador do seu próprio bairro.' },
];

const CATEGORIAS = [
  { icon: 'UtensilsCrossed', label: 'Restaurantes' },
  { icon: 'Cross', label: 'Farmácias' },
  { icon: 'ShoppingCart', label: 'Mercados' },
  { icon: 'Store', label: 'Lojas' },
  { icon: 'Wrench', label: 'Serviços' },
  { icon: 'Coffee', label: 'Padarias' },
];

const Usuarios = () => (
  <SiteLayout>
    {/* ── Hero ──────────────────────────────────────────────────────── */}
    <section className="site-grain relative bg-[var(--site-ink)] text-white pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-20 lg:pb-28 overflow-hidden">
      <ParallaxImage />
      <Blob size={500} tone="gold" opacity={0.22} style={{ top: '-10%', right: '-8%' }} />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="site-kicker text-[11px] text-white/50 mb-6 flex items-center justify-center gap-2">
          <Icon name="ShoppingBag" size={13} className="text-[var(--site-brand-2)]" /> Para você
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="site-display text-4xl sm:text-6xl font-medium leading-[1.05]"
        >
          O que tem perto de você, <span className="italic site-gradient-text">agora</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg text-white/60 max-w-xl mx-auto leading-relaxed"
        >
          Restaurantes, farmácias, mercados e lojas do seu bairro — descubra, peça e acompanhe a entrega em tempo real, direto de quem está por perto.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex justify-center"
        >
          <GradientButton href="https://pediuvai.com.br/" glow icon="MapPin">Ver o que tem perto de mim</GradientButton>
        </motion.div>
      </div>
    </section>

    {/* ── Categorias ────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-24">
      <RevealOnScroll className="text-center mb-14">
        <Kicker index="01" label="Um app, tudo o que você precisa" />
        <h2 className="site-display text-4xl font-medium">Não é só comida — é o bairro inteiro.</h2>
      </RevealOnScroll>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {CATEGORIAS.map((c, i) => (
          <RevealOnScroll key={c.label} delay={i * 0.05}>
            <TiltCard maxTilt={6} className="rounded-2xl">
              <div className="rounded-2xl border border-[var(--site-line)] bg-white p-6 text-center hover:border-[var(--site-brand)]/40 transition-colors">
                <Icon name={c.icon} size={24} className="mx-auto text-[var(--site-brand)] mb-3" strokeWidth={1.4} />
                <p className="text-sm font-semibold">{c.label}</p>
              </div>
            </TiltCard>
          </RevealOnScroll>
        ))}
      </div>
    </section>

    {/* ── Benefícios ────────────────────────────────────────────────── */}
    <section className="bg-[var(--site-cream-dim)] py-16 sm:py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <RevealOnScroll>
          <Kicker index="02" label="Por que pedir no PediuVai" />
          <h2 className="site-display text-4xl font-medium max-w-xl leading-tight">Mais perto, mais rápido, mais gente da sua região.</h2>
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
      </div>
    </section>

    {/* ── Como pedir ────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
      <RevealOnScroll className="text-center mb-14">
        <Kicker index="03" label="Como funciona" />
        <h2 className="site-display text-4xl font-medium">Do pedido à porta de casa, em poucos passos.</h2>
      </RevealOnScroll>
      <div className="grid sm:grid-cols-4 gap-8 relative">
        <div className="hidden sm:block absolute top-7 left-[10%] right-[10%] h-px bg-[var(--site-line)]" />
        {[
          { icon: 'Search', title: 'Explore', desc: 'Veja o que está aberto perto de você.' },
          { icon: 'ShoppingBag', title: 'Monte o pedido', desc: 'Escolha os itens e a forma de pagamento.' },
          { icon: 'Radar', title: 'Acompanhe', desc: 'Do preparo à saída pra entrega, em tempo real.' },
          { icon: 'PartyPopper', title: 'Receba', desc: 'Rápido, porque veio de perto de verdade.' },
        ].map((s, i) => (
          <RevealOnScroll key={s.title} delay={i * 0.1} className="relative text-center">
            <div className="relative z-10 w-14 h-14 mx-auto rounded-2xl bg-[var(--site-ink)] flex items-center justify-center mb-5">
              <Icon name={s.icon} size={22} className="text-[var(--site-gold)]" />
            </div>
            <h3 className="site-display text-lg font-medium mb-2">{s.title}</h3>
            <p className="text-sm text-[var(--site-ink-soft)]/65 max-w-[14rem] mx-auto">{s.desc}</p>
          </RevealOnScroll>
        ))}
      </div>
    </section>

    {/* ── Telegram (consulta por IA) ───────────────────────────────── */}
    <section className="bg-[var(--site-cream-dim)] py-16 sm:py-20 lg:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <RevealOnScroll>
          <Kicker index="04" label="Pergunte antes de pedir" />
          <h2 className="site-display text-3xl sm:text-4xl font-medium leading-tight mb-5">
            Manda uma mensagem e a gente te diz <span className="italic site-gradient-text">o que tem perto</span>.
          </h2>
          <p className="text-[var(--site-ink-soft)]/70 leading-relaxed max-w-md mb-8">
            Converse com o assistente do PediuVai no Telegram: pergunte por um prato, peça pra ver os estabelecimentos mais pertinho, ou só compartilhe sua localização com um toque.
          </p>
          <ul className="space-y-3 mb-9">
            {TELEGRAM_RECURSOS.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-[var(--site-line)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name={item.icon} size={14} className="text-[var(--site-brand)]" />
                </div>
                <span className="text-sm text-[var(--site-ink-soft)]/80 leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
          <GradientButton href={TELEGRAM_BOT_URL} target="_blank" glow icon="Send">
            Falar com o assistente
          </GradientButton>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <TiltCard maxTilt={5} className="rounded-3xl">
            <TelegramChatVisual />
          </TiltCard>
        </RevealOnScroll>
      </div>
    </section>

    {/* ── CTA final ─────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 pb-16 sm:pb-20 lg:pb-28">
      <RevealOnScroll>
        <div className="site-grain relative rounded-[2.5rem] bg-[var(--site-ink)] text-white px-8 sm:px-16 py-20 text-center overflow-hidden">
          <ParallaxImage range={40} />
          <Blob size={480} tone="gold" opacity={0.3} style={{ bottom: '-20%', right: '25%' }} />
          <h2 className="site-display relative text-4xl sm:text-5xl font-medium leading-tight max-w-2xl mx-auto">
            Seu bairro tem mais pra oferecer do que você imagina.
          </h2>
          <div className="relative mt-10">
            <GradientButton href="https://pediuvai.com.br/" glow icon="MapPin">Ver o que tem perto de mim</GradientButton>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  </SiteLayout>
);

export default Usuarios;
