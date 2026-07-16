import { useState, useEffect } from 'react';

// Re-renderiza a cada `intervalMs` pra cronômetros ao vivo (espera/preparo) baseados
// em `Date.now() - timestamp` acompanharem o segundo sem precisar refetch.
export const useNowTick = (intervalMs = 1000) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};
