import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { updatePerfil } from '../../services/perfilService';
import { buscarCep } from '../../utils/viaCep';
import Icon from '../../components/AppIcon';

const formatCEP = (v) => {
  const n = (v ?? '').replace(/\D/g, '');
  return n.length <= 8 ? n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => (b ? `${a}-${b}` : a)) : v;
};

const Campo = ({ label, value, onChange, placeholder, required, half }) => (
  <div className={half ? 'w-1/2' : 'w-full'}>
    <label className="block text-xs font-medium text-[#71717A] mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]"
    />
  </div>
);

const StepEndereco = ({ perfil, onNext, onBack }) => {
  const [form, setForm] = useState({
    name: '', phone_e164: '',
    logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: '', referencia: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    const a = perfil.address_json ?? {};
    setForm({
      name: perfil.name ?? '',
      phone_e164: perfil.phone_e164 ?? '',
      logradouro: a.logradouro ?? '',
      numero: a.numero ?? '',
      complemento: a.complemento ?? '',
      bairro: a.bairro ?? '',
      cidade: a.cidade ?? '',
      estado: a.estado ?? '',
      cep: a.cep ?? '',
      referencia: a.referencia ?? '',
    });
  }, [perfil]);

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

  const handleNext = async () => {
    if (!form.name.trim() || !form.phone_e164.trim() || !form.logradouro.trim() || !form.numero.trim()) {
      setErro('Preencha nome, telefone, endereço e número.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const updated = await updatePerfil({
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
      onNext(updated);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
        <p className="text-sm font-semibold text-[#18181B] flex items-center gap-2 mb-1">
          <Icon name="User" size={15} className="text-[#FF441F]" /> Seus dados
        </p>
        <Campo label="Nome completo" value={form.name} onChange={set('name')} placeholder="João Silva" required />
        <Campo label="WhatsApp / Telefone" value={form.phone_e164} onChange={set('phone_e164')} placeholder="+55 11 99999-9999" required />
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
        <p className="text-sm font-semibold text-[#18181B] flex items-center gap-2 mb-1">
          <Icon name="MapPin" size={15} className="text-[#FF441F]" /> Endereço de entrega
        </p>
        <Campo label="Logradouro (Rua / Av.)" value={form.logradouro} onChange={set('logradouro')} placeholder="Rua das Flores" required />
        <div className="flex gap-2">
          <Campo label="Número" value={form.numero} onChange={set('numero')} placeholder="123" half required />
          <Campo label="Complemento" value={form.complemento} onChange={set('complemento')} placeholder="Apto 4" half />
        </div>
        <Campo label="Bairro" value={form.bairro} onChange={set('bairro')} placeholder="Centro" />
        <div className="flex gap-2">
          <Campo label="Cidade" value={form.cidade} onChange={set('cidade')} placeholder="São Paulo" half />
          <Campo label="Estado" value={form.estado} onChange={set('estado')} placeholder="SP" half />
        </div>
        <Campo label="CEP" value={form.cep} onChange={handleCepChange} placeholder="00000-000" />
        {buscandoCep && <p className="text-[11px] text-[#71717A] -mt-2">Buscando endereço...</p>}
        <Campo label="Ponto de referência" value={form.referencia} onChange={set('referencia')} placeholder="Próximo ao mercado..." />
      </div>

      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{erro}</div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3.5 border border-[#E4E4E7] text-[#27272A] font-semibold rounded-2xl hover:bg-[#F4F4F5] text-sm">
          Voltar
        </button>
        <button onClick={handleNext} disabled={salvando}
          className="flex-[2] py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50">
          {salvando ? 'Salvando...' : 'Usar este endereço'}
        </button>
      </div>
    </motion.div>
  );
};

export default StepEndereco;
