import React, { createContext, useContext, useState, useEffect } from 'react';
import { getEmpresas, getPlataformaConfig } from '../services/adminService';
import { useAuth } from './AuthContext';
import { apiPath } from '../lib/apiUrl';
import Icon from '../components/AppIcon';

const LocalModeContext = createContext(null);

// Modo individual (mono-estabelecimento) restringe o admin a 1 restaurante.
// Duas fontes possíveis: VITE_LOCAL_RESTAURANT_ID no .env (override fixo de build,
// self-hosted) ou o checkbox "Instalação individual" em Admin > Configurações
// (salvo no banco, ajustável sem rebuild). O .env, quando definido, tem prioridade.
const ENV_LOCAL_ID = import.meta.env.VITE_LOCAL_RESTAURANT_ID
  ? parseInt(import.meta.env.VITE_LOCAL_RESTAURANT_ID, 10)
  : null;

export const LocalModeProvider = ({ children }) => {
  const { loading, userProfile } = useAuth() ?? {};
  const [dbLocalId, setDbLocalId] = useState(null);
  const [restauranteNome, setRestauranteNome] = useState(null);
  const [licenca, setLicenca] = useState(null);
  const [verificandoLicenca, setVerificandoLicenca] = useState(false);

  const localId = ENV_LOCAL_ID ?? dbLocalId;

  const buscarLicencaStatus = () =>
    fetch(apiPath('/api/licenca/status')).then((r) => r.json()).then(setLicenca).catch(() => {});

  // Força o checkin na hora (não espera o ciclo automático de N minutos) —
  // usado depois que o admin troca plano/revoga, pra confirmar na hora.
  const verificarLicencaAgora = async () => {
    setVerificandoLicenca(true);
    try {
      const r = await fetch(apiPath('/api/licenca/checkin-agora'), { method: 'POST' });
      setLicenca(await r.json());
    } catch {
      // mantém último status conhecido
    } finally {
      setVerificandoLicenca(false);
    }
  };

  // Instalação licenciada (LICENCA_SERIAL setado no backend) — consulta o status
  // já calculado pelo checkin periódico do backend contra a central. Endpoint
  // público (sem guard), seguro de chamar sempre — se não for instalação
  // licenciada, o backend só devolve { ativo: false }.
  useEffect(() => { buscarLicencaStatus(); }, []);

  useEffect(() => {
    if (ENV_LOCAL_ID) return; // .env já resolve, não precisa consultar o banco
    if (loading || userProfile?.role !== 'admin') return;
    getPlataformaConfig()
      .then((cfg) => {
        if (cfg.modo_individual && cfg.modo_individual_restaurant_id) {
          setDbLocalId(cfg.modo_individual_restaurant_id);
        } else {
          setDbLocalId(null);
        }
      })
      .catch(() => {});
  }, [loading, userProfile?.role]);

  useEffect(() => {
    if (!localId) return;
    getEmpresas()
      .then((d) => {
        const found = (d.empresas ?? []).find((e) => e.id === localId);
        if (found) setRestauranteNome(found.name);
      })
      .catch(() => {});
  }, [localId]);

  return (
    <LocalModeContext.Provider value={{
      isLocalMode: !!localId,
      localRestaurantId: localId,
      restauranteNome,
      licencaBloqueada: !!(licenca?.ativo && licenca?.bloqueado),
      licencaRevogada: !!(licenca?.ativo && licenca?.revogado),
      licencaDiasAtraso: licenca?.dias_atraso ?? 0,
      verificarLicencaAgora,
      verificandoLicenca,
    }}>
      {children}
    </LocalModeContext.Provider>
  );
};

export const useLocalMode = () => useContext(LocalModeContext);

// Banner reutilizável para todas as páginas admin
export const LocalModeBanner = () => {
  const { isLocalMode, restauranteNome, localRestaurantId } = useLocalMode() ?? {};
  if (!isLocalMode) return null;
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-900 px-6 py-2 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
      Modo Local — {restauranteNome ? `Restaurante: ${restauranteNome}` : `ID #${localRestaurantId}`}
      <span className="ml-auto font-normal opacity-70">Acesso restrito a 1 restaurante</span>
    </div>
  );
};

// Bloqueio da licença da instalação local — fatura vencida ou serial revogado
export const LicencaBloqueadaBanner = () => {
  const { licencaBloqueada, licencaRevogada, licencaDiasAtraso, verificarLicencaAgora, verificandoLicenca } = useLocalMode() ?? {};
  if (!licencaBloqueada) return null;
  return (
    <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-300 dark:border-red-900 px-6 py-2 flex items-center gap-2 text-red-800 dark:text-red-300 text-xs font-semibold">
      <Icon name="AlertTriangle" size={14} className="flex-shrink-0" />
      {licencaRevogada
        ? 'Licença desta instalação foi revogada — fale com o suporte.'
        : `Licença desta instalação vencida há ${licencaDiasAtraso} dia(s) — regularize o pagamento pra continuar usando.`}
      <button onClick={verificarLicencaAgora} disabled={verificandoLicenca} className="ml-auto font-semibold underline disabled:opacity-50">
        {verificandoLicenca ? 'Verificando...' : 'Verificar agora'}
      </button>
    </div>
  );
};
