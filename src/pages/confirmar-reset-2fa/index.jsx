import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import Icon from '../../components/AppIcon';

// Landing page do link enviado pelo admin em /admin/usuarios (ver
// UsuariosController.resetarDoisFatores) pra quem perdeu acesso ao código de
// 2FA (app autenticador apagado, email de segurança inacessível etc.) e por
// isso não pode usar o self-service, que exige a senha atual. Confirmação só
// dispara no clique (não no mount) pra um prefetch/scanner de email não
// consumir o token sozinho.
const ConfirmarReset2FA = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleConfirmar = async () => {
    setLoading(true);
    setErro(null);
    const result = await authService?.confirmarResetDoisFatoresAdmin(token);
    setLoading(false);

    if (!result?.success) {
      setErro(result?.error || 'Não foi possível confirmar. O link pode ter expirado.');
      return;
    }
    setSucesso(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex flex-col">
      <main className="flex-1 px-4 py-8 flex items-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="bg-white dark:bg-[#27272A] rounded-2xl shadow-sm border border-[#E4E4E7] dark:border-[#3F3F46] p-6 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon name="ShieldCheck" size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#18181B] dark:text-[#F4F4F5]">
                Desativar verificação em duas etapas
              </h2>
            </div>

            {!token && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">Link inválido — faltam informações. Peça pro admin enviar um novo.</p>
              </div>
            )}

            {token && !sucesso && (
              <>
                <p className="text-sm text-center text-[#71717A] dark:text-[#A1A1AA]">
                  Um administrador solicitou a desativação da verificação em duas etapas da sua conta. Se foi você quem pediu ajuda ao suporte, confirme abaixo.
                </p>

                {erro && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  {loading ? 'Confirmando...' : 'Confirmar e desativar verificação em duas etapas'}
                </button>
              </>
            )}

            {sucesso && (
              <>
                <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Verificação em duas etapas desativada. Você já pode fazer login normalmente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/customer-registration-login')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  Ir para o login
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfirmarReset2FA;
