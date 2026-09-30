import { useEffect, useState } from 'react';

// Devolve `value` com atraso — usado pra não disparar busca/API a cada tecla
// digitada (autocomplete, filtro de lista). Efeito some/reagenda a cada
// mudança de `value` antes do delay passar, então só o valor "parado" chega
// a virar o valor debounced de verdade.
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
