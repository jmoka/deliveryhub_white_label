import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPerfil, updatePerfil, uploadFoto } from '../../services/perfilService';
import { buscarCep } from '../../utils/viaCep';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import CredenciaisForm from '../../components/perfil/CredenciaisForm';

const formatCEP = (v) => {
  const n = (v ?? '').replace(/\D/g, '');
  return n.length <= 8 ? n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => (b ? `${a}-${b}` : a)) : v;
};

const Campo = ({ label, value, onChange, placeholder, required, type = 'text', readOnly }) => (
  <div>
    <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${
        readOnly
          ? 'border-[#F4F4F5] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] cursor-default'
          : 'border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] focus:border-[#FF441F]'
      }`}
    />
  </div>
);

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    name: '', phone_e164: '',
    logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: '', referencia: '',
  });
  const [fotoUrl, setFotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/customer-registration-login', { state: { from: '/customer-profile' } });
      return;
    }
    getPerfil()
      .then((p) => {
        const a = p.address_json ?? {};
        setForm({
          name: p.name ?? '',
          phone_e164: p.phone_e164 ?? '',
          logradouro: a.logradouro ?? '',
          numero: a.numero ?? '',
          complemento: a.complemento ?? '',
          bairro: a.bairro ?? '',
          cidade: a.cidade ?? '',
          estado: a.estado ?? '',
          cep: a.cep ?? '',
          referencia: a.referencia ?? '',
        });
        setFotoUrl(p.foto_perfil_url ?? null);
      })
      .catch((e) => setMsg({ tipo: 'erro', texto: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCepChange = async (v) => {
    const formatted = formatCEP(v);
    setForm((f) => ({ ...f, cep: formatted }));

    const digitos = formatted.replace(/\D/g, '');
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    const endereco = await buscarCep(digitos);
    setBuscandoCep(false);
    if (!endereco) return;
    setForm((f) => ({
      ...f,
      logradouro: endereco.logradouro || f.logradouro,
      bairro: endereco.bairro || f.bairro,
      cidade: endereco.cidade || f.cidade,
      estado: endereco.estado || f.estado,
    }));
  };

  const handleFotoSelecionada = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviandoFoto(true);
    try {
      const { foto_perfil_url } = await uploadFoto(file);
      setFotoUrl(foto_perfil_url);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setEnviandoFoto(false);
      e.target.value = '';
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone_e164.trim()) {
      setMsg({ tipo: 'erro', texto: 'Nome e telefone são obrigatórios.' });
      return;
    }
    if (form.logradouro.trim() && !form.numero.trim()) {
      setMsg({ tipo: 'erro', texto: 'Informe o número do endereço.' });
      return;
    }
    setSalvando(true);
    setMsg(null);
    try {
      await updatePerfil({
        name: form.name.trim(),
        phone_e164: form.phone_e164.trim(),
        address_json: {
          logradouro: form.logradouro.trim(),
          numero: form.numero.trim(),
          complemento: form.complemento.trim(),
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          estado: form.estado.trim(),
          cep: form.cep.trim(),
          referencia: form.referencia.trim(),
        },
      });
      setMsg({ tipo: 'ok', texto: 'Perfil salvo com sucesso!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#18181B]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#18181B] pb-10">
      <header className="bg-white dark:bg-[#18181B] border-b dark:border-[#3F3F46] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/customer-account-order-history')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#27272A]">
          <Icon name="ArrowLeft" size={20} className="text-gray-600 dark:text-[#A1A1AA]" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Meu Perfil</h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Dados e endereço de entrega</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSalvar} className="space-y-4">
          {/* Foto de perfil */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 flex items-center gap-4">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={enviandoFoto}
              className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-[#27272A] flex-shrink-0 border border-[#E4E4E7] dark:border-[#3F3F46]">
              {fotoUrl
                ? <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Icon name="User" size={24} className="text-gray-400 dark:text-[#71717A]" /></div>}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Icon name="Camera" size={16} className="text-white" />
              </div>
            </button>
            <div>
              <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">Foto de perfil</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={enviandoFoto}
                className="text-xs text-[#FF441F] font-semibold hover:underline disabled:opacity-50">
                {enviandoFoto ? 'Enviando...' : 'Trocar foto'}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoSelecionada} />
          </div>

          {/* Conta */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
            <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2">
              <Icon name="User" size={14} className="text-[#FF441F]" /> Dados pessoais
            </p>
            <Campo label="E-mail (trocar abaixo, em Segurança)" value={user?.email ?? ''} readOnly />
            <Campo label="Nome completo" value={form.name} onChange={set('name')} placeholder="João Silva" required />
            <Campo label="WhatsApp / Telefone" value={form.phone_e164} onChange={set('phone_e164')} placeholder="+55 11 99999-9999" required />
          </div>

          {/* Endereço */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
            <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2">
              <Icon name="MapPin" size={14} className="text-[#FF441F]" /> Endereço de entrega
            </p>
            <Campo label="Logradouro (Rua / Av.)" value={form.logradouro} onChange={set('logradouro')} placeholder="Rua das Flores" />
            <div className="flex gap-2">
              <div className="w-1/2">
                <Campo label="Número" value={form.numero} onChange={set('numero')} placeholder="123" required={!!form.logradouro.trim()} />
              </div>
              <div className="w-1/2">
                <Campo label="Complemento" value={form.complemento} onChange={set('complemento')} placeholder="Apto 4" />
              </div>
            </div>
            <Campo label="Bairro" value={form.bairro} onChange={set('bairro')} placeholder="Centro" />
            <div className="flex gap-2">
              <div className="flex-1">
                <Campo label="Cidade" value={form.cidade} onChange={set('cidade')} placeholder="São Paulo" />
              </div>
              <div className="w-20">
                <Campo label="UF" value={form.estado} onChange={set('estado')} placeholder="SP" />
              </div>
            </div>
            <Campo label="CEP" value={form.cep} onChange={handleCepChange} placeholder="00000-000" />
            {buscandoCep && <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] -mt-2">Buscando endereço...</p>}
            <Campo label="Ponto de referência" value={form.referencia} onChange={set('referencia')} placeholder="Próximo ao mercado..." />
          </div>

          {msg && (
            <div className={`text-sm rounded-xl px-4 py-3 ${
              msg.tipo === 'ok'
                ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {msg.texto}
            </div>
          )}

          <button type="submit" disabled={salvando}
            className="w-full py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50 shadow-lg shadow-[#FF441F]/20 text-sm">
            {salvando ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2 mb-3">
            <Icon name="Lock" size={14} className="text-[#FF441F]" /> Segurança
          </p>
          <CredenciaisForm currentEmail={user?.email} />
        </div>
      </main>
    </div>
  );
};

export default CustomerProfile;
