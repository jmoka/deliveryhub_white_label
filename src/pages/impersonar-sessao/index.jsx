import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Aberta numa aba nova a partir do botão "Painel" em /admin/empresas — troca os
// tokens recebidos do backend (POST /empresas/:id/painel) pela sessão real via
// setSession e manda pro painel do dono. Troca a sessão do navegador como um
// todo (mesmo localStorage do client Supabase) — não é uma sessão isolada só
// dessa aba, então a conta de admin fica "trocada" até logar de novo como admin.
const ImpersonarSessao = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setErro('Link de acesso inválido ou incompleto.');
      return;
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) {
        setErro(error.message);
        return;
      }
      navigate('/restaurante', { replace: true });
    });
  }, [searchParams, navigate]);

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="text-center max-w-sm p-6">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">Não foi possível acessar o painel</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{erro}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <p className="text-sm text-gray-500 dark:text-zinc-400">Acessando painel...</p>
    </div>
  );
};

export default ImpersonarSessao;
