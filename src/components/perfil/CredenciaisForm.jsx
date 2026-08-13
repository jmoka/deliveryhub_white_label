import React, { useState } from 'react';
import { authService } from '../../services/authService';
import Icon from '../AppIcon';

// Troca de senha/email pelo próprio usuário logado — reaproveitado nos
// painéis admin, restaurante e cliente (só o layout ao redor muda).
const CredenciaisForm = ({ currentEmail }) => {
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoEmail, setSalvandoEmail] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroEmail, setErroEmail] = useState(null);
  const [erroSenha, setErroSenha] = useState(null);
  const [sucessoEmail, setSucessoEmail] = useState(false);
  const [sucessoSenha, setSucessoSenha] = useState(false);

  const handleTrocarEmail = async (e) => {
    e.preventDefault();
    setErroEmail(null);
    setSucessoEmail(false);
    if (!novoEmail.trim()) return;

    setSalvandoEmail(true);
    try {
      const resultado = await authService.updateEmail(novoEmail.trim());
      if (!resultado.success) {
        setErroEmail(resultado.error);
        return;
      }
      setSucessoEmail(true);
      setNovoEmail('');
    } catch {
      setErroEmail('Falha ao trocar email. Tente novamente.');
    } finally {
      setSalvandoEmail(false);
    }
  };

  const handleTrocarSenha = async (e) => {
    e.preventDefault();
    setErroSenha(null);
    setSucessoSenha(false);

    if (novaSenha.length < 8) {
      setErroSenha('Senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('Senhas não conferem');
      return;
    }

    setSalvandoSenha(true);
    try {
      const resultado = await authService.updatePassword(novaSenha);
      if (!resultado.success) {
        setErroSenha(resultado.error);
        return;
      }
      setSucessoSenha(true);
      setNovaSenha('');
      setConfirmarSenha('');
    } catch {
      setErroSenha('Falha ao trocar senha. Tente novamente.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Trocar email</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
          {currentEmail ? <>Email atual: <span className="font-mono">{currentEmail}</span>. </> : null}
          Você vai receber um link de confirmação no novo endereço antes da troca valer.
        </p>
        <form onSubmit={handleTrocarEmail} className="space-y-3">
          <input
            type="email"
            required
            placeholder="novo@email.com"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {erroEmail && <p className="text-sm text-red-600 dark:text-red-400">{erroEmail}</p>}
          {sucessoEmail && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <Icon name="CheckCircle" size={16} /> Verifique sua caixa de entrada para confirmar a troca.
            </p>
          )}
          <button
            type="submit"
            disabled={salvandoEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {salvandoEmail ? 'Enviando...' : 'Trocar email'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Trocar senha</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Mínimo de 8 caracteres.</p>
        <form onSubmit={handleTrocarSenha} className="space-y-3">
          <input
            type="password"
            required
            minLength={8}
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {erroSenha && <p className="text-sm text-red-600 dark:text-red-400">{erroSenha}</p>}
          {sucessoSenha && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <Icon name="CheckCircle" size={16} /> Senha atualizada com sucesso.
            </p>
          )}
          <button
            type="submit"
            disabled={salvandoSenha}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {salvandoSenha ? 'Salvando...' : 'Trocar senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CredenciaisForm;
