import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { completarCadastroMotoboy, arquivoParaBase64 } from '../../services/motoboyAuthService';
import { useAuth } from '../../contexts/AuthContext';

// Carretinha é puxada por um carro — precisa do CRLV dos dois, por isso o
// campo de documento do veículo muda de rótulo e ganha um campo extra só nesse caso.
const camposArquivo = (veiculoTipo) => {
  const ehCarretinha = veiculoTipo === 'carretinha';
  const campos = [
    { name: 'foto_perfil', label: 'Foto de perfil', obrigatorio: true, icon: 'User', accept: 'image/*' },
    { name: 'documento_frente', label: 'Documento com foto (CNH ou RG)', obrigatorio: true, icon: 'IdCard', accept: 'image/*,application/pdf' },
    { name: 'documento_verso', label: 'Verso do documento (opcional)', obrigatorio: false, icon: 'IdCard', accept: 'image/*,application/pdf' },
    { name: 'comprovante_endereco', label: 'Comprovante de endereço', obrigatorio: true, icon: 'FileText', accept: 'image/*,application/pdf' },
    { name: 'veiculo_foto', label: 'Foto do veículo', obrigatorio: true, icon: 'Camera', accept: 'image/*' },
    { name: 'veiculo_documento', label: ehCarretinha ? 'Documento do carro (CRLV)' : 'Documento do veículo (CRLV)', obrigatorio: true, icon: 'FileText', accept: 'image/*,application/pdf' },
  ];
  if (ehCarretinha) {
    campos.push({ name: 'veiculo_documento_carretinha', label: 'Documento da carretinha (CRLV)', obrigatorio: true, icon: 'FileText', accept: 'image/*,application/pdf' });
  }
  return campos;
};

const VEICULO_TIPOS = [
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'moto', label: 'Moto' },
  { value: 'carro', label: 'Carro' },
  { value: 'caminhao', label: 'Caminhão' },
  { value: 'carretinha', label: 'Carretinha' },
];

// Formatação leve, sem validar dígito verificador — só ajuda a digitar (CNPJ, 14 dígitos).
const formatCnpj = (v) => {
  const n = (v ?? '').replace(/\D/g, '').slice(0, 14);
  return n.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const MotoboyCadastro = () => {
  const navigate = useNavigate();
  const { signUp, refreshUserProfile } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', veiculo_tipo: '', cnpj: '' });
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

    if (!form.veiculo_tipo) {
      setErro('Selecione o tipo de veículo');
      return;
    }
    if (form.cnpj.replace(/\D/g, '').length !== 14) {
      setErro('Informe um CNPJ válido (MEI é obrigatório)');
      return;
    }
    for (const campo of camposArquivo(form.veiculo_tipo)) {
      if (campo.obrigatorio && !arquivos[campo.name]) {
        setErro(`Envie: ${campo.label}`);
        return;
      }
    }

    setEnviando(true);
    try {
      const resultado = await signUp(form.email, form.password, {
        name: form.name,
        role: 'motoboy',
        phone: form.phone,
      });
      if (!resultado?.success) throw new Error(resultado?.error || 'Erro ao criar conta');

      await completarCadastroMotoboy({
        name: form.name,
        phone: form.phone,
        veiculo_tipo: form.veiculo_tipo,
        cnpj: form.cnpj.replace(/\D/g, ''),
        ...arquivos,
      });
      await refreshUserProfile();
      // Cadastro ainda entra "pendente" de aprovação da plataforma — manda pra
      // vitrine (como qualquer usuário), não pro painel de entregas ainda vazio.
      navigate('/menu-catalog-product-browse');
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-6 w-full max-w-md shadow-lg my-8">
        <button type="button" onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5] mb-4">
          <Icon name="ArrowLeft" size={16} />
          Voltar
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#FF441F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="Bike" size={28} className="text-[#FF441F]" />
          </div>
          <h1 className="text-lg font-black text-[#18181B] dark:text-[#F4F4F5]">Cadastro de Entregador</h1>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">Depois de cadastrado, você escolhe pra quais estabelecimentos quer entregar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="Nome completo"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required value={form.phone} onChange={(e) => set('phone', e.target.value)}
            placeholder="Telefone (WhatsApp)"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
            placeholder="E-mail"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required type="password" minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)}
            placeholder="Senha (mínimo 8 caracteres)"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />

          <select required value={form.veiculo_tipo} onChange={(e) => set('veiculo_tipo', e.target.value)}
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]">
            <option value="" disabled>Tipo de veículo</option>
            {VEICULO_TIPOS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <input required value={form.cnpj} onChange={(e) => set('cnpj', formatCnpj(e.target.value))}
            placeholder="CNPJ (MEI) — 00.000.000/0000-00"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] -mt-1.5">Entregador precisa ser MEI. Se o veículo for caminhão, precisa ser MEI caminhoneiro.</p>

          <div className="pt-2 space-y-2.5">
            {camposArquivo(form.veiculo_tipo).map((campo) => (
              <label key={campo.name}
                className="flex items-center gap-3 border border-dashed border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2.5 cursor-pointer hover:border-[#FF441F]/50 transition-colors">
                <Icon name={previews[campo.name] ? 'CheckCircle2' : campo.icon}
                  size={18} className={previews[campo.name] ? 'text-green-600 dark:text-green-400' : 'text-[#71717A] dark:text-[#A1A1AA]'} />
                <span className="flex-1 text-sm text-[#27272A] dark:text-[#F4F4F5] truncate">
                  {previews[campo.name] ?? `${campo.label}${campo.obrigatorio ? ' *' : ''}`}
                </span>
                <input type="file" accept={campo.accept} className="hidden"
                  onChange={(e) => handleArquivo(campo.name, e.target.files?.[0])} />
              </label>
            ))}
          </div>

          {erro && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{erro}</p>}

          <button type="submit" disabled={enviando}
            className="w-full py-3 bg-[#FF441F] text-white font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 text-sm mt-2">
            {enviando ? 'Enviando...' : 'Criar cadastro'}
          </button>
          <button type="button" onClick={() => navigate('/motoboy')}
            className="w-full py-2.5 text-sm text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]">
            Já tenho conta — entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default MotoboyCadastro;
