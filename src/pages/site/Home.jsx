import React, { useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import SiteLayout from './components/SiteLayout';
import RevealOnScroll from './components/RevealOnScroll';
import TiltCard from './components/TiltCard';
import GradientButton from './components/GradientButton';
import Blob from './components/Blob';
import Kicker from './components/Kicker';
import SpeedLines from './components/SpeedLines';
import ParallaxImage from './components/ParallaxImage';

// Cores batem com os selos de categoria do app real (ver public/assets/images/og_image.png).
const CATEGORIAS = [
  { label: 'Restaurantes', cor: '#FF7A1A' },
  { label: 'Mercados', cor: '#22B24C' },
  { label: 'Farmácias', cor: '#E8384F' },
  { label: 'Lojas', cor: '#8B3FE8' },
  { label: 'Serviços', cor: '#2F7FE0' },
  { label: 'Pet shops', cor: '#FF7A1A' },
  { label: 'Padarias', cor: '#22B24C' },
  { label: 'Açaí', cor: '#8B3FE8' },
];

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

/* ── Composição do hero — o ícone real do app (ver public/assets/images) como
   peça central, girando em 3D com o mouse, com os risquinhos de velocidade da
   própria marca emanando dele. Um cartão de contexto ("a caminho") flutua do
   lado, sem competir com o ícone pela atenção. */
const HeroComposition = () => (
  <div className="relative h-[420px] hidden lg:flex items-center justify-center">
    <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 opacity-80">
      <SpeedLines />
      <SpeedLines />
    </div>

    <TiltCard maxTilt={10} glare={false} className="site-float rounded-[2.5rem]">
      <div className="relative">
        <div className="absolute -inset-10 rounded-full bg-[linear-gradient(135deg,#FF441F,#FF7A00,#FFC24B)] opacity-30 blur-3xl" />
        <img
          src="/assets/images/icon-512.png"
          alt="PediuVai"
          className="relative w-64 h-64 rounded-[2.5rem] shadow-2xl shadow-black/50"
        />
      </div>
    </TiltCard>

    <TiltCard maxTilt={6} className="absolute bottom-2 -right-2 w-56 site-float-delay rounded-3xl">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,#FFC24B,#FF7A00)] flex items-center justify-center flex-shrink-0">
          <Icon name="Bike" size={17} className="text-[var(--site-ink)]" />
        </div>
        <div>
          <p className="text-white text-xs font-semibold">A caminho</p>
          <p className="text-white/40 text-[10px]">Chega em 6 min</p>
        </div>
      </div>
    </TiltCard>
  </div>
);

/* ── Ilustrações dos cards de Diferenciais — cada uma mostra o conceito de
   verdade em vez de um ícone genérico centralizado. Reaproveitam o mesmo
   fundo escuro + Blob + grain já montado em cada card (ver render abaixo). */

// Comissão justa: duas barras comparando % de comissão, crescem ao entrar na
// tela — a diferença visual (quase cheia vs. quase vazia) fala por si.
const ComissaoVisual = () => (
  <div className="relative z-10 w-full max-w-[260px] space-y-7">
    {[
      { label: 'Outras plataformas', pct: 18, cor: 'bg-white/35' },
      { label: 'PediuVai', pct: 5, cor: 'bg-[var(--site-gold)]' },
    ].map((b, i) => (
      <div key={b.label}>
        <div className="flex justify-between text-sm text-white/70 mb-2">
          <span>{b.label}</span>
          <span className="font-semibold text-white">{b.pct}%</span>
        </div>
        <div className="h-3.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${b.cor}`}
            initial={{ width: 0 }}
            whileInView={{ width: `${(b.pct / 20) * 100}%` }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1, delay: 0.15 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    ))}
  </div>
);

// Tudo no bairro: o motoboi da logo roda em loop dentro do "raio do bairro"
// (círculo tracejado), indo da loja até a casa — mesmo motivo visual já usado
// na seção "Como funciona", só numa rota curta e circular.
const BairroVisual = () => (
  <div className="relative z-10 w-56 h-56 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center">
    <Icon name="Store" size={32} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/80" />
    <Icon name="Home" size={32} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80" />
    <motion.img
      src="/assets/images/icon-192.png"
      alt=""
      className="absolute w-14 h-14 top-1/2 -translate-y-1/2 -translate-x-1/2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
      animate={{ left: ['14%', '82%', '14%'] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

// Painel único: 4 cartõezinhos (cardápio/pedidos/caixa/financeiro) entram
// escalonados ao rolar até aqui — dá a sensação de "tudo nesse painel".
const PAINEL_CARDS = [
  { icon: 'UtensilsCrossed', label: 'Cardápio' },
  { icon: 'ClipboardList', label: 'Pedidos' },
  { icon: 'Wallet', label: 'Caixa' },
  { icon: 'BarChart3', label: 'Financeiro' },
];
const PainelVisual = () => (
  <div className="relative z-10 grid grid-cols-2 gap-4 w-full max-w-[260px]">
    {PAINEL_CARDS.map((c, i) => (
      <motion.div
        key={c.label}
        className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 14, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        <Icon name={c.icon} size={30} className="text-[var(--site-gold)]" />
        <span className="text-xs text-white/70">{c.label}</span>
      </motion.div>
    ))}
  </div>
);

const DIFERENCIAIS_VISUALS = [ComissaoVisual, BairroVisual, PainelVisual];

/* ── Vídeos reais do painel (gravações de tela hospedadas à parte) — mostra o
   produto de verdade funcionando, bem antes do CTA final, pra reforçar
   confiança. Cada card faz uma sondagem leve (preload="metadata", não baixa
   o vídeo inteiro) pra saber se o arquivo existe; se não existir/falhar,
   mostra um card "Em breve" no lugar em vez de quebrar ou sumir. */
const VIDEOS_BASE_URL = 'https://teusite.top/pediuvai/videos/';

const VIDEOS = [
  { arquivo: 'dasheboard.mp4', titulo: 'Painel do dono', desc: 'Pedidos, cardápio e caixa, tudo num só lugar.', icon: 'LayoutDashboard' },
  { arquivo: 'abrindo_o_caixa.mp4', titulo: 'Abrindo o caixa', desc: 'Controle do caixa simples, direto da tela.', icon: 'Wallet' },
  { arquivo: 'instalando_no_celular.mp4', titulo: 'Instala no celular', desc: 'Funciona como app, direto do navegador.', icon: 'Smartphone' },
  { arquivo: 'menu_das_impressoras.mp4', titulo: 'Impressão automática', desc: 'Cozinha e bar recebem o pedido certo, na hora.', icon: 'Printer' },
  { arquivo: 'menu_lateral_I.mp4', titulo: 'Tour pelo painel', desc: 'Navegue por tudo em poucos cliques.', icon: 'Menu' },
  { arquivo: 'menu_lateral_perte_II.mp4', titulo: 'Mais do painel', desc: 'Continuação do tour pelo menu lateral.', icon: 'Menu' },
];

const VIDEO_GRADIENTES = [
  'linear-gradient(135deg, #FF441F, #FF7A00)',
  'linear-gradient(135deg, #FFC24B, #FF7A00)',
  'linear-gradient(135deg, #2C4066, #0C1A33)',
];

const VideoCard = ({ video, index, onAbrir }) => {
  const [status, setStatus] = useState('carregando'); // carregando | ok | erro
  const url = `${VIDEOS_BASE_URL}${video.arquivo}`;
  const pronto = status === 'ok';

  return (
    <RevealOnScroll delay={index * 0.08}>
      <button
        type="button"
        onClick={() => pronto && onAbrir(video)}
        className={`group relative w-full aspect-video rounded-2xl overflow-hidden text-left ${pronto ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {/* Sondagem oculta — só metadata, não baixa os MBs do vídeo inteiro à toa. */}
        <video
          src={url}
          preload="metadata"
          className="hidden"
          onLoadedMetadata={() => setStatus('ok')}
          onError={() => setStatus('erro')}
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-transform duration-500 group-hover:scale-105"
          style={{ background: VIDEO_GRADIENTES[index % VIDEO_GRADIENTES.length] }}
        >
          <Icon name={video.icon} size={34} className="text-white/90" />
          {pronto && (
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Icon name="Play" size={20} className="text-[var(--site-ink)] translate-x-0.5" />
            </div>
          )}
          {status === 'erro' && (
            <span className="text-[11px] font-semibold text-white/80 bg-black/30 px-3 py-1 rounded-full">Em breve</span>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm font-semibold">{video.titulo}</p>
          <p className="text-white/60 text-xs">{video.desc}</p>
        </div>
      </button>
    </RevealOnScroll>
  );
};

const VideoModal = ({ video, onClose }) => (
  <AnimatePresence>
    {video && (
      <motion.div
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative max-w-full flex flex-col items-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute -top-10 right-0 text-white/80 hover:text-white" aria-label="Fechar">
            <Icon name="X" size={26} />
          </button>
          {/* max-h limita vídeo vertical (gravação de celular) pra não estourar a
              tela — w-auto deixa a largura seguir a proporção real do vídeo. */}
          <video
            key={video.arquivo}
            src={`${VIDEOS_BASE_URL}${video.arquivo}`}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] w-auto rounded-2xl shadow-2xl bg-black"
          />
          <p className="text-white text-center mt-3 text-sm">{video.titulo}</p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const VideoShowcase = () => {
  const [videoAberto, setVideoAberto] = useState(null);

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
      <RevealOnScroll className="text-center mb-14">
        <Kicker index="06" label="Veja funcionando" />
        <h2 className="site-display text-4xl font-medium">O painel de verdade, sem enrolação.</h2>
      </RevealOnScroll>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {VIDEOS.map((v, i) => (
          <VideoCard key={v.arquivo} video={v} index={i} onAbrir={setVideoAberto} />
        ))}
      </div>
      <VideoModal video={videoAberto} onClose={() => setVideoAberto(null)} />
    </section>
  );
};

// Motoboi (mascote do app) "entregando" ao longo da mesma linha que liga os 4
// passos (Escolha → Peça → Acompanhe → Receba) — só em telas grandes (lg+),
// looping infinito da esquerda pra direita, reforçando visualmente "ele tá
// indo entregar" enquanto o usuário lê os passos. Some o movimento (ícone
// parado no meio da linha) se o usuário preferir menos animação.
const MotoboyDeliveryPath = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-0 pointer-events-none"
      aria-hidden="true"
    >
      <motion.img
        src="/assets/images/icon-192.png"
        alt=""
        className="absolute w-10 h-10 -translate-y-1/2 -translate-x-1/2 drop-shadow-[0_6px_14px_rgba(12,26,51,0.35)]"
        animate={reduceMotion ? { left: '50%' } : { left: ['0%', '100%'] }}
        transition={reduceMotion ? undefined : { duration: 7, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
      />
    </div>
  );
};

const Home = () => (
  <SiteLayout>
    {/* ── Hero ──────────────────────────────────────────────────────── */}
    <section className="site-grain relative bg-[var(--site-ink)] text-white pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-20 lg:pb-28 overflow-hidden">
      <ParallaxImage />
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
            className="site-display relative text-5xl sm:text-6xl lg:text-[4.3rem] leading-[1.02] tracking-tight"
          >
            <SpeedLines className="absolute -left-14 top-3 hidden lg:flex scale-150 origin-left" />
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
            className="mt-9 flex items-center gap-2.5 sm:gap-4"
          >
            <div className="flex-1 sm:flex-none">
              <GradientButton to="/site/estabelecimentos" glow className="w-full !px-3.5 sm:!px-6 justify-center">Vender no PediuVai</GradientButton>
            </div>
            <div className="flex-1 sm:flex-none">
              <GradientButton to="/site/usuarios" variant="outline" icon="MapPin" className="w-full !px-3.5 sm:!px-6 justify-center !text-white !border-white/20 hover:!border-white/50">
                Ver o que tem perto
              </GradientButton>
            </div>
          </motion.div>

          {/* Versão compacta do ícone pro mobile — a composição flutuante completa
              só entra a partir de lg (precisa de espaço pra não ficar apertada). */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="lg:hidden mt-12 flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-[linear-gradient(135deg,#FF441F,#FF7A00,#FFC24B)] opacity-30 blur-2xl" />
              <img src="/assets/images/icon-192.png" alt="PediuVai" className="relative w-28 h-28 rounded-3xl shadow-2xl shadow-black/50 site-float" />
            </div>
          </motion.div>
        </div>

        <HeroComposition />
      </div>
    </section>

    {/* ── Marquee de categorias ────────────────────────────────────── */}
    <div className="border-b border-[var(--site-line)] bg-[var(--site-cream-dim)] py-5 overflow-hidden">
      <div className="flex gap-10 w-max animate-carrossel-continuo" style={{ '--carrossel-duracao': '28s' }}>
        {[...CATEGORIAS, ...CATEGORIAS, ...CATEGORIAS].map((c, i) => (
          <span key={i} className="site-display italic text-2xl text-[var(--site-ink)]/50 flex items-center gap-3 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.cor }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>

    {/* ── Pra quem é ────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
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
    <section className="bg-[var(--site-cream-dim)] py-16 sm:py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <RevealOnScroll className="text-center">
          <Kicker index="02" label="Como funciona" />
        </RevealOnScroll>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14 relative">
          <div className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-[var(--site-line)]" />
          <MotoboyDeliveryPath />
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
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-28 space-y-24">
      {DIFERENCIAIS.map((d, i) => {
        const Visual = DIFERENCIAIS_VISUALS[i];
        return (
          <RevealOnScroll key={d.title}>
            <div className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div>
                <Kicker index={`0${i + 3}`} label={d.kicker} />
                <h3 className="site-display text-3xl sm:text-4xl font-medium leading-tight mb-5">{d.title}</h3>
                <p className="text-[var(--site-ink-soft)]/70 leading-relaxed max-w-md">{d.desc}</p>
              </div>
              <TiltCard maxTilt={5} className="rounded-3xl">
                <div className="site-grain relative aspect-[4/3] rounded-3xl bg-[var(--site-ink)] flex items-center justify-center overflow-hidden p-8">
                  <Blob size={300} tone={i === 0 ? 'brand' : i === 1 ? 'gold' : 'ink'} opacity={0.4} style={{ top: '20%', left: '20%' }} />
                  <Visual />
                </div>
              </TiltCard>
            </div>
          </RevealOnScroll>
        );
      })}
    </section>

    {/* ── Vídeos (veja funcionando) ────────────────────────────────── */}
    <VideoShowcase />

    {/* ── CTA final ─────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto px-6 pb-16 sm:pb-20 lg:pb-28">
      <RevealOnScroll>
        <div className="site-grain relative rounded-[2.5rem] bg-[var(--site-ink)] text-white px-8 sm:px-16 py-20 text-center overflow-hidden">
          <ParallaxImage range={40} />
          <Blob size={500} tone="brand" opacity={0.3} style={{ top: '-20%', left: '30%' }} />
          <h2 className="site-display relative text-4xl sm:text-5xl font-medium leading-tight max-w-2xl mx-auto">
            Seu bairro já tem tudo o que você precisa. <span className="italic site-gradient-text">Falta só pedir.</span>
          </h2>
          <div className="relative flex items-center justify-center gap-2.5 sm:gap-4 mt-10">
            <div className="flex-1 sm:flex-none">
              <GradientButton to="/site/estabelecimentos" glow className="w-full !px-3.5 sm:!px-6 justify-center">Cadastrar meu estabelecimento</GradientButton>
            </div>
            <div className="flex-1 sm:flex-none">
              <GradientButton to="/site/entregadores" variant="outline" icon="Bike" className="w-full !px-3.5 sm:!px-6 justify-center !text-white !border-white/20 hover:!border-white/50">
                Quero ser entregador
              </GradientButton>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  </SiteLayout>
);

export default Home;
