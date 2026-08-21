import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';

// Landing page do link de "esqueci minha senha" (supabase.auth.resetPasswordForEmail
// redireciona pra cá). O SDK do Supabase já captura o token da URL sozinho e dispara
// PASSWORD_RECOVERY em onAuthStateChange, estabelecendo uma sessão válida só pra
// trocar a senha.
const ResetPassword = () => {
  const navigate = useNavigate();
  const { isMotoboy, isAdmin, isRestaurantOwner } = useAuth();
  const [prontoParaTrocar, setProntoParaTrocar] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setProntoParaTrocar(true);
      }
    });

    // Se o usuário já chegou com a sessão de recuperação estabelecida antes
    // do listener acima montar (ex: refresh na página), confere direto.
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
      if (session) setProntoParaTrocar(true);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const getRedirectUrl = () => {
    if (isMotoboy()) return '/motoboy';
    if (isAdmin()) return '/admin';
    if (isRestaurantOwner()) return '/restaurante';
    return '/menu-catalog-product-browse';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (senha?.length < 8) {
      setErro('A senha precisa ter no mínimo 8 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const result = await authService?.updatePassword(senha);
    setLoading(false);

    if (!result?.success) {
      setErro(result?.error || 'Não foi possível trocar a senha. O link pode ter expirado.');
      return;
    }

    setSucesso(true);
    setTimeout(() => navigate(getRedirectUrl()), 1500);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex flex-col">
      <main className="flex-1 px-4 py-8 flex items-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="bg-white dark:bg-[#27272A] rounded-2xl shadow-sm border border-[#E4E4E7] dark:border-[#3F3F46] p-6 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon name="KeyRound" size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#18181B] dark:text-[#F4F4F5]">
                Definir nova senha
              </h2>
            </div>

            {!prontoParaTrocar && !sucesso && (
              <p className="text-sm text-center text-[#71717A] dark:text-[#A1A1AA]">
                Verificando o link de recuperação...
              </p>
            )}

            {sucesso && (
              <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Senha atualizada! Redirecionando...
                </p>
              </div>
            )}

            {prontoParaTrocar && !sucesso && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {erro && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#18181B] dark:text-[#F4F4F5] mb-1">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    minLength={8}
                    required
                    className="w-full px-3 py-2 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#18181B] dark:text-[#F4F4F5] mb-1">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    minLength={8}
                    required
                    className="w-full px-3 py-2 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
