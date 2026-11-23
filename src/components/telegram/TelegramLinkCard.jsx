import { useCallback, useEffect, useState } from 'react';

// Card de vínculo com o bot do Telegram — reusado no perfil do motoboy (aviso de
// pedido pronto), no perfil do cliente (pedido confirmado/entregue) e, via prop
// `canal`, também pro WhatsApp (mesmo padrão opt-in, componente único em vez de
// duplicar UI). Mesmo padrão de geração de token + status + copiar link do
// AgenteImpressaoPanel (ver src/pages/restaurante-impressoras/index.jsx).
const TEXTOS = {
  telegram: {
    titulo: 'Notificações no Telegram',
    descricao: 'Receba os avisos do PediuVai direto no Telegram, sem precisar ficar checando a tela.',
    vincular: 'Vincular no Telegram',
    abrir: 'Abrir Telegram',
  },
  whatsapp: {
    titulo: 'Notificações no WhatsApp',
    descricao: 'Receba os avisos do PediuVai direto no WhatsApp, sem precisar ficar checando a tela.',
    vincular: 'Vincular no WhatsApp',
    abrir: 'Abrir WhatsApp',
  },
};

export const TelegramLinkCard = ({ gerarLink, getStatus, className, canal = 'telegram' }) => {
  const t = TEXTOS[canal] ?? TEXTOS.telegram;
  const [status, setStatus] = useState(null);
  const [link, setLink] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const carregarStatus = useCallback(() => getStatus().then(setStatus).catch(() => {}), [getStatus]);
  useEffect(() => {
    carregarStatus();
    const interval = setInterval(carregarStatus, 15000);
    return () => clearInterval(interval);
  }, [carregarStatus]);

  const gerar = async () => {
    setGerando(true);
    try {
      const dados = await gerarLink();
      setLink(dados);
    } finally {
      setGerando(false);
    }
  };

  const copiar = () => {
    if (!link?.deep_link) return;
    navigator.clipboard?.writeText(link.deep_link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className={className ?? 'bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4'}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{t.titulo}</p>
        {status && (
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${status.vinculado ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400'}`}>
            {status.vinculado ? 'Vinculado' : 'Não vinculado'}
          </span>
        )}
      </div>
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">
        {t.descricao}
      </p>
      <button type="button" onClick={gerar} disabled={gerando}
        className="w-full h-12 bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
        {gerando ? 'Gerando...' : status?.vinculado ? 'Gerar novo link' : t.vincular}
      </button>
      {link?.deep_link && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <a href={link.deep_link} target="_blank" rel="noreferrer"
            className="flex-1 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl text-center">
            {t.abrir}
          </a>
          <button type="button" onClick={copiar} className="text-xs font-bold text-[#FF441F]">{copiado ? 'Copiado!' : 'Copiar link'}</button>
        </div>
      )}
    </div>
  );
};
