import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPerfil, updatePerfil } from '../../services/perfilService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const Campo = ({ label, value, onChange, placeholder, required, type = 'text', readOnly }) => (
  <div>
    <label className="block text-xs font-medium text-[#71717A] mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none ${
        readOnly
          ? 'border-[#F4F4F5] bg-[#FAFAFA] text-[#71717A] cursor-default'
          : 'border-[#E4E4E7] focus:border-[#FF441F]'
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
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

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
      })
      .catch((e) => setMsg({ tipo: 'erro', texto: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone_e164.trim()) {
      setMsg({ tipo: 'erro', texto: 'Nome e telefone são obrigatórios.' });
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <Icon name="ArrowLeft" size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#18181B]">Meu Perfil</h1>
          <p className="text-xs text-[#71717A]">Dados e endereço de entrega</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSalvar} className="space-y-4">
          {/* Conta */}
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
            <p className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
              <Icon name="User" size={14} className="text-[#FF441F]" /> Dados pessoais
            </p>
            <Campo label="E-mail (não editável)" value={user?.email ?? ''} readOnly />
            <Campo label="Nome completo" value={form.name} onChange={set('name')} placeholder="João Silva" required />
            <Campo label="WhatsApp / Telefone" value={form.phone_e164} onChange={set('phone_e164')} placeholder="+55 11 99999-9999" required />
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
            <p className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
              <Icon name="MapPin" size={14} className="text-[#FF441F]" /> Endereço de entrega
            </p>
            <Campo label="Logradouro (Rua / Av.)" value={form.logradouro} onChange={set('logradouro')} placeholder="Rua das Flores" />
            <div className="flex gap-2">
              <div className="w-1/2">
                <Campo label="Número" value={form.numero} onChange={set('numero')} placeholder="123" />
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
            <Campo label="CEP" value={form.cep} onChange={set('cep')} placeholder="00000-000" />
            <Campo label="Ponto de referência" value={form.referencia} onChange={set('referencia')} placeholder="Próximo ao mercado..." />
          </div>

          {msg && (
            <div className={`text-sm rounded-xl px-4 py-3 ${
              msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {msg.texto}
            </div>
          )}

          <button type="submit" disabled={salvando}
            className="w-full py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50 shadow-lg shadow-[#FF441F]/20 text-sm">
            {salvando ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CustomerProfile;
