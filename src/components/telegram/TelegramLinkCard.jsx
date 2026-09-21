import { useCallback, useEffect, useState } from 'react';

// Card de vínculo com o bot do Telegram — reusado no perfil do motoboy (aviso de
// pedido pronto) e no perfil do cliente (pedido confirmado/entregue). Mesmo padrão
// de geração de token + status + copiar link do AgenteImpressaoPanel
// (ver src/pages/restaurante-impressoras/index.jsx).
export const TelegramLinkCard = ({ gerarLink, getStatus, className }) => {
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
        <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Notificações no Telegram</p>
        {status && (
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${status.vinculado ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400'}`}>
            {status.vinculado ? 'Vinculado' : 'Não vinculado'}
          </span>
        )}
      </div>
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">
        Receba os avisos do PediuVai direto no Telegram, sem precisar ficar checando a tela.
      </p>
      <button type="button" onClick={gerar} disabled={gerando}
        className="px-4 py-2 bg-zinc-800 text-white text-sm font-bold rounded-xl disabled:opacity-50">
        {gerando ? 'Gerando...' : status?.vinculado ? 'Gerar novo link' : 'Vincular no Telegram'}
      </button>
      {link?.deep_link && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <a href={link.deep_link} target="_blank" rel="noreferrer"
            className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl text-center">
            Abrir Telegram
          </a>
          <button type="button" onClick={copiar} className="text-xs font-bold text-[#FF441F]">{copiado ? 'Copiado!' : 'Copiar link'}</button>
        </div>
      )}
    </div>
  );
};
