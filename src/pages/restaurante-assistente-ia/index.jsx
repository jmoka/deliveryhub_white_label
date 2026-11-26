import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAssistenteConfig, salvarPromptAssistente,
  conectarTelegramAssistente, desconectarTelegramAssistente,
  conectarWhatsappAssistente, getStatusWhatsappAssistente, desconectarWhatsappAssistente,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

// Precisa bater com QR_TTL_MS em assistente.service.ts (backend) — aqui só
// espelha pra mostrar a contagem, o backend é a fonte da verdade da expiração.
const QR_TTL_MS = 120000;

const RestauranteAssistenteIa = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [prompt, setPrompt] = useState('');
  const [salvandoPrompt, setSalvandoPrompt] = useState(false);
  const [sucessoPrompt, setSucessoPrompt] = useState(false);

  const [tokenTelegram, setTokenTelegram] = useState('');
  const [conectandoTelegram, setConectandoTelegram] = useState(false);
  const [erroTelegram, setErroTelegram] = useState(null);

  const [conectandoWhatsapp, setConectandoWhatsapp] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [statusWhatsapp, setStatusWhatsapp] = useState(null);
  const [erroWhatsapp, setErroWhatsapp] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const pollRef = useRef(null);
  const countdownRef = useRef(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getAssistenteConfig()
      .then((c) => { setConfig(c); setPrompt(c.prompt_sistema ?? ''); setStatusWhatsapp(c.whatsapp_connection_status); })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => () => { clearInterval(pollRef.current); clearInterval(countdownRef.current); }, []);

  const salvarPrompt = async () => {
    setSalvandoPrompt(true);
    try {
      await salvarPromptAssistente(prompt);
      setSucessoPrompt(true);
      setTimeout(() => setSucessoPrompt(false), 2500);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvandoPrompt(false);
    }
  };

  const conectarTelegram = async () => {
    setConectandoTelegram(true);
    setErroTelegram(null);
    try {
      await conectarTelegramAssistente(tokenTelegram.trim());
      setTokenTelegram('');
      await carregar();
    } catch (e) {
      setErroTelegram(e.message);
    } finally {
      setConectandoTelegram(false);
    }
  };

  const desconectarTelegram = async () => {
    if (!window.confirm('Desconectar o bot do Telegram desse assistente?')) return;
    await desconectarTelegramAssistente();
    await carregar();
  };

  const pollStatusWhatsapp = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { status } = await getStatusWhatsappAssistente();
        if (status === 'expirado') {
          clearInterval(pollRef.current);
          clearInterval(countdownRef.current);
          setQrCode(null);
          setSegundosRestantes(null);
          setStatusWhatsapp('desconectado');
          setErroWhatsapp('O QR code expirou. Clique em "Conectar WhatsApp" para gerar um novo.');
          return;
        }
        setStatusWhatsapp(status);
        if (status === 'conectado') {
          clearInterval(pollRef.current);
          clearInterval(countdownRef.current);
          setQrCode(null);
          setSegundosRestantes(null);
        }
      } catch {
        clearInterval(pollRef.current);
        clearInterval(countdownRef.current);
        setQrCode(null);
        setSegundosRestantes(null);
        setErroWhatsapp('Não foi possível verificar o status da conexão. Tente novamente.');
      }
    }, 4000);
  }, []);

  const conectarWhatsapp = async () => {
    setConectandoWhatsapp(true);
    setErroWhatsapp(null);
    setQrCode(null);
    setSegundosRestantes(null);
    try {
      const r = await conectarWhatsappAssistente();
      setQrCode(r.qrcode_base64);
      setStatusWhatsapp(r.status);
      if (r.status !== 'conectado') {
        const expiraEm = Date.now() + QR_TTL_MS;
        setSegundosRestantes(Math.ceil(QR_TTL_MS / 1000));
        clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          const restante = Math.max(0, Math.ceil((expiraEm - Date.now()) / 1000));
          setSegundosRestantes(restante);
          if (restante === 0) clearInterval(countdownRef.current);
        }, 1000);
        pollStatusWhatsapp();
      }
    } catch (e) {
      setErroWhatsapp(e.message);
      setStatusWhatsapp(null);
    } finally {
      setConectandoWhatsapp(false);
    }
  };

  const desconectarWhatsapp = async () => {
    if (!window.confirm('Desconectar o WhatsApp desse assistente? A instância é removida.')) return;
    clearInterval(pollRef.current);
    clearInterval(countdownRef.current);
    setQrCode(null);
    setSegundosRestantes(null);
    await desconectarWhatsappAssistente();
    await carregar();
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/assistente-ia" title="Assistente IA" />
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
          <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-1">Prompt do assistente</h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">
            Como o assistente deve se comportar — tom de voz, o que pode/não pode responder, informações fixas sobre a loja.
          </p>
          {loading ? (
            <div className="h-24 animate-pulse bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-xl" />
          ) : (
            <>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                placeholder="Ex: Você é o atendente da Pizzaria do João. Seja simpático, responda sobre o cardápio e horário de funcionamento. Nunca invente promoções que não existem."
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF441F] resize-none"
              />
              <div className="flex items-center gap-3 mt-3">
                <button onClick={salvarPrompt} disabled={salvandoPrompt}
                  className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-lg hover:bg-[#E63A19] disabled:opacity-50">
                  {salvandoPrompt ? 'Salvando...' : 'Salvar prompt'}
                </button>
                {sucessoPrompt && <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1"><Icon name="Check" size={14} /> Salvo</span>}
              </div>
            </>
          )}
          {erro && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{erro}</p>}
        </div>

        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">Telegram próprio</h2>
            {config?.ativo_telegram && (
              <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                Conectado (@{config.telegram_bot_username})
              </span>
            )}
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">
            Crie um bot no @BotFather do Telegram, copie o token e cole abaixo. Esse bot responde SÓ pela sua loja, separado do canal do Pediuvai.
          </p>
          {config?.ativo_telegram ? (
            <button onClick={desconectarTelegram}
              className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40">
              Desconectar
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <input value={tokenTelegram} onChange={(e) => setTokenTelegram(e.target.value)}
                placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 min-w-[240px] border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
              <button onClick={conectarTelegram} disabled={conectandoTelegram || !tokenTelegram.trim()}
                className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-lg hover:bg-[#E63A19] disabled:opacity-50">
                {conectandoTelegram ? 'Conectando...' : 'Conectar'}
              </button>
            </div>
          )}
          {erroTelegram && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{erroTelegram}</p>}
        </div>

        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">WhatsApp próprio</h2>
            {statusWhatsapp && (
              <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                statusWhatsapp === 'conectado' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
              }`}>
                {statusWhatsapp === 'conectado' ? 'Conectado' : statusWhatsapp === 'aguardando_qr' ? 'Aguardando leitura do QR' : statusWhatsapp === 'expirado' ? 'QR expirado' : 'Desconectado'}
              </span>
            )}
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">
            Use um número de WhatsApp próprio (não precisa ser o mesmo do seu celular pessoal). Escaneie o QR code com o WhatsApp &gt; Aparelhos conectados.
          </p>
          <div className="flex flex-wrap gap-2">
            {statusWhatsapp !== 'conectado' && (
              <button onClick={conectarWhatsapp} disabled={conectandoWhatsapp}
                className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-lg hover:bg-[#E63A19] disabled:opacity-50">
                {conectandoWhatsapp ? 'Gerando QR...' : qrCode ? 'Gerar novo QR' : 'Conectar WhatsApp'}
              </button>
            )}
            <button onClick={desconectarWhatsapp}
              className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40">
              Desconectar
            </button>
          </div>
          {qrCode && statusWhatsapp !== 'conectado' && (
            <div className="mt-3 flex flex-col items-center">
              <img src={qrCode} alt="QR code do WhatsApp" className="w-56 h-56 rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46]" />
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-2">
                Aguardando leitura...{segundosRestantes != null && ` (expira em ${segundosRestantes}s)`}
              </p>
            </div>
          )}
          {erroWhatsapp && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{erroWhatsapp}</p>}
        </div>
      </div>
    </div>
  );
};

export default RestauranteAssistenteIa;
