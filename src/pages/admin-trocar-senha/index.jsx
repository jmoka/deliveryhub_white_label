import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import Icon from '../../components/AppIcon';

const AdminTrocarSenha = () => {
  const navigate = useNavigate();
  const { user, refreshUserProfile, signOut } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro('Senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (senha !== confirmar) {
      setErro('Senhas não conferem');
      return;
    }

    setSalvando(true);
    try {
      const resultado = await authService.updatePassword(senha);
      if (!resultado.success) {
        setErro(resultado.error);
        return;
      }

      const perfil = await authService.updateUserProfile(user.id, { must_change_password: false });
      if (!perfil.success) {
        setErro(perfil.error);
        return;
      }

      refreshUserProfile();
      setSucesso(true);
      setSalvando(false);
      await signOut();
      setTimeout(() => {
        navigate('/customer-registration-login', { replace: true });
      }, 1800);
      return;
    } catch (err) {
      setErro('Falha ao trocar senha. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-6">
        {sucesso ? (
          <div className="flex flex-col items-center text-center py-4">
            <Icon name="CheckCircle" size={40} className="text-green-500 mb-3" />
            <p className="font-semibold text-gray-900 dark:text-zinc-100">Senha salva com sucesso!</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Redirecionando para o login...</p>
          </div>
        ) : (
        <>
        <div className="flex items-center gap-2 mb-1">
          <Icon name="ShieldAlert" size={20} className="text-orange-500" />
          <h1 className="font-semibold text-gray-900 dark:text-zinc-100">Troca de senha obrigatória</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
          Esta é uma conta de administrador com senha padrão. Defina uma nova senha para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Nova senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={8}
              required
              className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              minLength={8}
              required
              className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm"
          >
            {salvando ? 'Salvando...' : 'Trocar senha e continuar'}
          </button>

          <button
            type="button"
            onClick={signOut}
            className="w-full text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
          >
            Sair
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
};

export default AdminTrocarSenha;
