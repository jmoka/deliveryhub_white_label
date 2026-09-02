import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { authService } from '../../services/authService';
import { getStatus2FA, iniciarEnrollTotp, confirmarEnrollTotp, ativarEmail2FA, desativar2FA } from '../../services/twoFactorService';
import Icon from '../AppIcon';

// Troca de senha/email pelo próprio usuário logado — reaproveitado nos
// painéis admin, restaurante e cliente (só o layout ao redor muda). O card
// de 2FA (mostrarSeguranca2FA) só aparece pra admin e dono de restaurante —
// quem passa a prop decide isso, aqui não tem checagem de role.
const CredenciaisForm = ({ currentEmail, mostrarSeguranca2FA = false }) => {
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

  // ── 2FA ─────────────────────────────────────────────────────────────
  const [metodo2fa, setMetodo2fa] = useState('none');
  const [carregando2fa, setCarregando2fa] = useState(mostrarSeguranca2FA);
  const [erro2fa, setErro2fa] = useState(null);
  const [sucesso2fa, setSucesso2fa] = useState(null);
  const [enrollTotp, setEnrollTotp] = useState(null); // { secret, otpauthUrl } | null
  const [codigoTotp, setCodigoTotp] = useState('');
  const [confirmandoTotp, setConfirmandoTotp] = useState(false);
  const [pedirSenhaDesativar, setPedirSenhaDesativar] = useState(false);
  const [senhaDesativar, setSenhaDesativar] = useState('');
  const [desativando, setDesativando] = useState(false);
  const [trocandoMetodo, setTrocandoMetodo] = useState(false);

  useEffect(() => {
    if (!mostrarSeguranca2FA) return;
    getStatus2FA()
      .then((r) => setMetodo2fa(r.method))
      .catch(() => setErro2fa('Não foi possível carregar o status do 2FA.'))
      .finally(() => setCarregando2fa(false));
  }, [mostrarSeguranca2FA]);

  const escolherMetodo = async (metodo) => {
    setErro2fa(null);
    setSucesso2fa(null);
    if (metodo === metodo2fa || trocandoMetodo) return;

    if (metodo === 'none') {
      setPedirSenhaDesativar(true);
      return;
    }

    setTrocandoMetodo(true);
    try {
      if (metodo === 'email') {
        await ativarEmail2FA();
        setMetodo2fa('email');
        setSucesso2fa('Código por email ativado.');
        return;
      }

      // TOTP: primeiro gera o segredo/QR, só ativa depois de confirmar o
      // código (evita trancar o usuário fora com um QR mal escaneado).
      const r = await iniciarEnrollTotp();
      setEnrollTotp(r);
      setCodigoTotp('');
    } catch (e) {
      setErro2fa(e.message);
    } finally {
      setTrocandoMetodo(false);
    }
  };

  const confirmarTotp = async (e) => {
    e.preventDefault();
    setErro2fa(null);
    setConfirmandoTotp(true);
    try {
      await confirmarEnrollTotp(enrollTotp.secret, codigoTotp);
      setMetodo2fa('totp');
      setSucesso2fa('App autenticador ativado.');
      setEnrollTotp(null);
    } catch (e) {
      setErro2fa(e.message);
    } finally {
      setConfirmandoTotp(false);
    }
  };

  const confirmarDesativar = async (e) => {
    e.preventDefault();
    setErro2fa(null);
    setDesativando(true);
    try {
      await desativar2FA(senhaDesativar);
      setMetodo2fa('none');
      setSucesso2fa('Autenticação em duas etapas desativada.');
      setPedirSenhaDesativar(false);
      setSenhaDesativar('');
    } catch (e) {
      setErro2fa(e.message);
    } finally {
      setDesativando(false);
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

      {mostrarSeguranca2FA && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Autenticação em duas etapas</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
            Peça um código extra a cada login, além da senha.
          </p>

          {carregando2fa ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">Carregando...</p>
          ) : (
            <>
              <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
                {[['none', 'Nenhum'], ['totp', 'App autenticador'], ['email', 'Código por email']].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => escolherMetodo(k)} disabled={trocandoMetodo}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait ${
                      metodo2fa === k ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {trocandoMetodo && <p className="text-sm text-gray-400 dark:text-zinc-500 mb-2">Aguarde...</p>}
              {erro2fa && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{erro2fa}</p>}
              {sucesso2fa && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5 mb-2">
                  <Icon name="CheckCircle" size={16} /> {sucesso2fa}
                </p>
              )}

              {enrollTotp && (
                <form onSubmit={confirmarTotp} className="mt-3 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl space-y-3">
                  <p className="text-sm text-gray-600 dark:text-zinc-300">
                    Escaneie com o app autenticador (Google Authenticator, Authy etc.) e digite o código gerado pra confirmar.
                  </p>
                  <div className="bg-white p-3 rounded-lg w-fit">
                    <QRCodeSVG value={enrollTotp.otpauthUrl} size={160} />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono break-all">{enrollTotp.secret}</p>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={codigoTotp}
                    onChange={(e) => setCodigoTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={confirmandoTotp || codigoTotp.length !== 6}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                      {confirmandoTotp ? 'Confirmando...' : 'Confirmar'}
                    </button>
                    <button type="button" onClick={() => setEnrollTotp(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {pedirSenhaDesativar && (
                <form onSubmit={confirmarDesativar} className="mt-3 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl space-y-3">
                  <p className="text-sm text-gray-600 dark:text-zinc-300">Confirme sua senha atual pra desativar o 2FA.</p>
                  <input
                    type="password"
                    required
                    placeholder="Senha atual"
                    value={senhaDesativar}
                    onChange={(e) => setSenhaDesativar(e.target.value)}
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={desativando}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                      {desativando ? 'Desativando...' : 'Desativar 2FA'}
                    </button>
                    <button type="button" onClick={() => { setPedirSenhaDesativar(false); setSenhaDesativar(''); }}
                      className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CredenciaisForm;
