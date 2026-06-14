import { useRef, useCallback, useEffect } from 'react';

// Variações de tom para cada contexto
const TONES = {
  pedido:     [[523, 0, 0.12], [659, 0.15, 0.12], [784, 0.3, 0.12], [1047, 0.45, 0.3]],  // C5 E5 G5 C6 — novo pedido (restaurante)
  cozinha:    [[784, 0, 0.15], [784, 0.2, 0.15], [1047, 0.4, 0.3]],                         // G5 G5 C6 — pedido na cozinha
  motoboy:    [[1047, 0, 0.15], [880, 0.2, 0.15], [1047, 0.4, 0.3]],                        // C6 A5 C6 — pronto p/ buscar
};

export function useNotificacaoSonora(tipo = 'pedido') {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  // Desbloqueia AudioContext no primeiro gesto do usuário
  useEffect(() => {
    const unlock = () => { try { getCtx().resume(); } catch {} };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const tocar = useCallback(() => {
    try {
      const ctx = getCtx();
      const notas = TONES[tipo] ?? TONES.pedido;
      const play = () => {
        notas.forEach(([freq, start, dur]) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = freq; o.type = 'square';
          g.gain.setValueAtTime(0.6, ctx.currentTime + start);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
          o.start(ctx.currentTime + start);
          o.stop(ctx.currentTime + start + dur + 0.05);
        });
      };
      if (ctx.state === 'suspended') ctx.resume().then(play);
      else play();
    } catch {}
  }, [tipo]);

  return tocar;
}
