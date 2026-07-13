import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { cadastro, setMotoboyToken, arquivoParaBase64 } from '../../services/motoboyAuthService';
import { useAuth } from '../../contexts/AuthContext';

const CAMPOS_ARQUIVO = [
  { name: 'foto_perfil', label: 'Foto de perfil', obrigatorio: true, icon: 'User', accept: 'image/*' },
  { name: 'documento_frente', label: 'Documento com foto (CNH ou RG)', obrigatorio: true, icon: 'IdCard', accept: 'image/*,application/pdf' },
  { name: 'documento_verso', label: 'Verso do documento (opcional)', obrigatorio: false, icon: 'IdCard', accept: 'image/*,application/pdf' },
  { name: 'comprovante_endereco', label: 'Comprovante de endereço', obrigatorio: true, icon: 'FileText', accept: 'image/*,application/pdf' },
];

const MotoboyCadastro = () => {
  const navigate = useNavigate();
  const { refreshUserProfile } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [arquivos, setArquivos] = useState({});
  const [previews, setPreviews] = useState({});
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleArquivo = async (campo, file) => {
    if (!file) return;
    const base64 = await arquivoParaBase64(file);
    setArquivos((a) => ({ ...a, [campo]: base64 }));
    setPreviews((p) => ({ ...p, [campo]: file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    for (const campo of CAMPOS_ARQUIVO) {
      if (campo.obrigatorio && !arquivos[campo.name]) {
        setErro(`Envie: ${campo.label}`);
        return;
      }
    }

    setEnviando(true);
    try {
      const { token } = await cadastro({ ...form, ...arquivos });
      setMotoboyToken(token);
      refreshUserProfile(); // se era cliente logado, o role virou 'motoboy' no banco
      navigate('/motoboy');
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 w-full max-w-md shadow-lg my-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#FF441F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="Bike" size={28} className="text-[#FF441F]" />
          </div>
          <h1 className="text-lg font-black text-[#18181B]">Cadastro de Entregador</h1>
          <p className="text-sm text-[#71717A] mt-1">Depois de cadastrado, você escolhe pra quais estabelecimentos quer entregar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="Nome completo"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required value={form.phone} onChange={(e) => set('phone', e.target.value)}
            placeholder="Telefone (WhatsApp)"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
            placeholder="E-mail"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required type="password" minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)}
            placeholder="Senha (mínimo 6 caracteres)"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />

          <div className="pt-2 space-y-2.5">
            {CAMPOS_ARQUIVO.map((campo) => (
              <label key={campo.name}
                className="flex items-center gap-3 border border-dashed border-[#E4E4E7] rounded-xl px-3 py-2.5 cursor-pointer hover:border-[#FF441F]/50 transition-colors">
                <Icon name={previews[campo.name] ? 'CheckCircle2' : campo.icon}
                  size={18} className={previews[campo.name] ? 'text-green-600' : 'text-[#71717A]'} />
                <span className="flex-1 text-sm text-[#27272A] truncate">
                  {previews[campo.name] ?? `${campo.label}${campo.obrigatorio ? ' *' : ''}`}
                </span>
                <input type="file" accept={campo.accept} className="hidden"
                  onChange={(e) => handleArquivo(campo.name, e.target.files?.[0])} />
              </label>
            ))}
          </div>

          {erro && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

          <button type="submit" disabled={enviando}
            className="w-full py-3 bg-[#FF441F] text-white font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 text-sm mt-2">
            {enviando ? 'Enviando...' : 'Criar cadastro'}
          </button>
          <button type="button" onClick={() => navigate('/motoboy')}
            className="w-full py-2.5 text-sm text-[#71717A] hover:text-[#27272A]">
            Já tenho conta — entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default MotoboyCadastro;
