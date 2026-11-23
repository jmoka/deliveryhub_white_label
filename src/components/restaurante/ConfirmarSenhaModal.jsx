import React, { useState } from 'react';
import Icon from '../AppIcon';

// Reconfirmação de senha antes de ação destrutiva (deletar/restaurar comanda) —
// mesmo padrão de segurança do 2FA (reautenticar com signInWithPassword no backend
// antes de executar). `onConfirmar(senha)` deve lançar erro com a mensagem do
// backend (ex: "Senha incorreta.") pra aparecer aqui.
const ConfirmarSenhaModal = ({ titulo, mensagem, confirmarLabel = 'Confirmar', onConfirmar, onFechar }) => {
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    if (!senha) {
      setErro('Digite a senha.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await onConfirmar(senha);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="ShieldAlert" size={18} className="text-[#FF441F] flex-shrink-0" />
          <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{titulo}</p>
        </div>
        {mensagem && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">{mensagem}</p>}

        <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Confirme sua senha de login</label>
        <div className="relative mt-1 mb-2">
          <input
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
            autoFocus
            disabled={enviando}
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 pr-10 text-sm disabled:opacity-50"
          />
          <button type="button" onClick={() => setMostrarSenha((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A1AA]">
            <Icon name={mostrarSenha ? 'EyeOff' : 'Eye'} size={16} />
          </button>
        </div>
        {erro && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{erro}</p>}

        <div className="flex gap-2 mt-2">
          <button onClick={onFechar} disabled={enviando}
            className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={confirmar} disabled={enviando}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
            {enviando ? 'Confirmando...' : confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarSenhaModal;
