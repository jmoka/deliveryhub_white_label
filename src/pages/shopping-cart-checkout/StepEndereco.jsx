import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { updatePerfil, atualizarLocalizacaoPerfil } from '../../services/perfilService';
import { buscarCep } from '../../utils/viaCep';
import { supabase } from '../../lib/supabase';
import { apiPath } from '../../lib/apiUrl';
import Icon from '../../components/AppIcon';
import MapaLocalizacaoPicker from '../../components/MapaLocalizacaoPicker';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const formatCEP = (v) => {
  const n = (v ?? '').replace(/\D/g, '');
  return n.length <= 8 ? n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => (b ? `${a}-${b}` : a)) : v;
};

// Formatação leve, sem validar dígito verificador — só ajuda a digitar. Detecta
// CPF (11) vs CNPJ (14) pela quantidade de dígitos conforme o cliente digita.
const formatCpfCnpj = (v) => {
  const n = (v ?? '').replace(/\D/g, '').slice(0, 14);
  if (n.length <= 11) {
    return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return n.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const Campo = ({ label, value, onChange, placeholder, required, half }) => (
  <div className={half ? 'w-1/2' : 'w-full'}>
    <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]"
    />
  </div>
);

const StepEndereco = ({ perfil, restauranteId, onNext, onBack }) => {
  const [form, setForm] = useState({
    name: '', phone_e164: '', cpf_cnpj: '',
    logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: '', referencia: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [previewDistancia, setPreviewDistancia] = useState(null); // { distanciaKm, valorExcedente, lat, lng, suspeito, foraDoRaio } | null
  const [calculandoPreview, setCalculandoPreview] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [pinAjustado, setPinAjustado] = useState(null); // { lat, lng } | null — setado quando o cliente arrasta o pino
  const [ajustandoPino, setAjustandoPino] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    const a = perfil.address_json ?? {};
    setForm({
      name: perfil.name ?? '',
      phone_e164: perfil.phone_e164 ?? '',
      cpf_cnpj: perfil.cpf_cnpj ?? '',
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
    setPreviewDistancia(null);
    setPinAjustado(null);
    setMostrarMapa(false);

    const digitos = formatted.replace(/\D/g, '');
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    const endereco = await buscarCep(digitos);
    setBuscandoCep(false);
    if (!endereco) return;
    const novoForm = {
      ...form,
      cep: formatted,
      logradouro: endereco.logradouro || form.logradouro,
      bairro: endereco.bairro || form.bairro,
      cidade: endereco.cidade || form.cidade,
      estado: endereco.estado || form.estado,
    };
    setForm((f) => ({ ...f, ...novoForm }));
    buscarPreviewDistancia(novoForm);
  };

  // Preview em tempo real assim que o CEP resolve — geocodifica o endereço direto
  // (sem depender de número, que ainda não foi digitado) só pra dar uma ideia da
  // distância antes de avançar. O cálculo final/autoritativo acontece de novo ao
  // salvar o endereço (mais preciso, já com número) e na hora de criar o pedido.
  const buscarPreviewDistancia = async (dadosEndereco) => {
    if (!restauranteId || !dadosEndereco.cidade?.trim() || !dadosEndereco.estado?.trim()) return;
    setCalculandoPreview(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      if (!token) return;
      const res = await fetch(apiPath('/api/pedidos/estimativa-frete-endereco'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          restaurant_id: restauranteId,
          address_json: {
            logradouro: dadosEndereco.logradouro,
            bairro: dadosEndereco.bairro,
            cidade: dadosEndereco.cidade,
            estado: dadosEndereco.estado,
            cep: dadosEndereco.cep,
          },
        }),
      });
      if (!res.ok) { setErro(`Não foi possível calcular a distância (HTTP ${res.status}).`); return; }
      const dados = await res.json();
      setPreviewDistancia(dados);
      setErro(null);
      // Distância implausível ou fora do raio de entrega — abre o mapa direto pro
      // cliente já ver o pino e poder corrigir, em vez de só mostrar um aviso.
      if (dados.suspeito || dados.foraDoRaio) setMostrarMapa(true);
    } catch {
    } finally {
      setCalculandoPreview(false);
    }
  };

  // Cliente arrastou o pino no mapa — recalcula a distância com a coordenada
  // confirmada por ele, sem passar pelo teto de plausibilidade (não é mais
  // geocodificação automática).
  const moverPino = async (lat, lng) => {
    setPinAjustado({ lat, lng });
    if (!restauranteId) return;
    setAjustandoPino(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      if (!token) return;
      const res = await fetch(apiPath('/api/pedidos/estimativa-frete-pino'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ restaurant_id: restauranteId, lat, lng }),
      });
      if (!res.ok) { setErro(`Não foi possível recalcular a distância (HTTP ${res.status}).`); return; }
      const dados = await res.json();
      setPreviewDistancia({ ...dados, lat, lng, suspeito: false });
      setErro(null);
    } catch (e) {
      setErro(`Não foi possível recalcular a distância: ${e.message}`);
    } finally {
      setAjustandoPino(false);
    }
  };

  const handleNext = async () => {
    if (!form.name.trim() || !form.phone_e164.trim() || !form.logradouro.trim() || !form.numero.trim() || !form.cidade.trim() || !form.estado.trim()) {
      setErro('Preencha nome, telefone, endereço, número, cidade e estado.');
      return;
    }
    if (previewDistancia?.foraDoRaio) {
      setErro('Esse endereço está fora da área de entrega do estabelecimento.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const updated = await updatePerfil({
        name: form.name.trim(),
        phone_e164: form.phone_e164.trim(),
        cpf_cnpj: form.cpf_cnpj.trim(),
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
      // Pino ajustado manualmente no mapa tem prioridade sobre a geocodificação
      // automática do endereço que acabou de ser salvo.
      if (pinAjustado) {
        try { await atualizarLocalizacaoPerfil(pinAjustado.lat, pinAjustado.lng); } catch {}
      }
      await onNext(updated);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
        <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2 mb-1">
          <Icon name="User" size={15} className="text-[#FF441F]" /> Seus dados
        </p>
        <Campo label="Nome completo" value={form.name} onChange={set('name')} placeholder="João Silva" required />
        <Campo label="WhatsApp / Telefone" value={form.phone_e164} onChange={set('phone_e164')} placeholder="+55 11 99999-9999" required />
        <Campo label="CPF/CNPJ (opcional)" value={form.cpf_cnpj} onChange={(v) => set('cpf_cnpj')(formatCpfCnpj(v))} placeholder="000.000.000-00" />
      </div>

      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
        <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2 mb-1">
          <Icon name="MapPin" size={15} className="text-[#FF441F]" /> Endereço de entrega
        </p>
        <Campo label="Informe o CEP" value={form.cep} onChange={handleCepChange} placeholder="00000-000" />
        {buscandoCep && <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] -mt-2">Buscando endereço...</p>}
        {(calculandoPreview || ajustandoPino) && <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] -mt-2">Calculando distância...</p>}
        {!calculandoPreview && !ajustandoPino && previewDistancia?.distanciaKm != null && !previewDistancia.suspeito && !previewDistancia.foraDoRaio && (
          <p className="text-[11px] text-[#FF441F] font-semibold -mt-2 flex items-center gap-1">
            <Icon name="MapPin" size={12} /> {previewDistancia.distanciaKm}km até você
            {previewDistancia.valorExcedente > 0 && <> — excedente estimado: {fmt(previewDistancia.valorExcedente)}</>}
          </p>
        )}
        {!calculandoPreview && !ajustandoPino && previewDistancia?.foraDoRaio && (
          <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold -mt-2 flex items-center gap-1">
            <Icon name="AlertTriangle" size={12} /> {previewDistancia.distanciaKm}km — fora da área de entrega
          </p>
        )}
        {!calculandoPreview && !ajustandoPino && previewDistancia?.suspeito && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold -mt-2 flex items-center gap-1">
            <Icon name="AlertTriangle" size={12} /> Distância parece incorreta ({previewDistancia.distanciaKm}km) — confirme sua localização no mapa abaixo
          </p>
        )}
        {previewDistancia?.distanciaKm != null && (
          <button type="button" onClick={() => setMostrarMapa((v) => !v)}
            className="text-[11px] font-semibold text-[#FF441F] -mt-1 flex items-center gap-1">
            <Icon name={mostrarMapa ? 'ChevronUp' : 'MapPinned'} size={12} />
            {mostrarMapa ? 'Ocultar mapa' : 'A distância não está certa? Ajustar no mapa'}
          </button>
        )}
        {mostrarMapa && (
          <div className="-mt-1">
            <MapaLocalizacaoPicker
              lat={pinAjustado?.lat ?? previewDistancia?.lat} lng={pinAjustado?.lng ?? previewDistancia?.lng}
              onChange={moverPino}
            />
          </div>
        )}
        <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] -mt-1">Preenche rua, bairro, cidade e estado automaticamente</p>
        <Campo label="Logradouro (Rua / Av.)" value={form.logradouro} onChange={set('logradouro')} placeholder="Rua das Flores" required />
        <div className="flex gap-2">
          <Campo label="Número" value={form.numero} onChange={set('numero')} placeholder="123" half required />
          <Campo label="Complemento" value={form.complemento} onChange={set('complemento')} placeholder="Apto 4" half />
        </div>
        <Campo label="Bairro" value={form.bairro} onChange={set('bairro')} placeholder="Centro" />
        <div className="flex gap-2">
          <Campo label="Cidade" value={form.cidade} onChange={set('cidade')} placeholder="São Paulo" half required />
          <Campo label="Estado" value={form.estado} onChange={set('estado')} placeholder="SP" half required />
        </div>
        <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] -mt-1">Cidade e estado corretos são necessários pra calcular a distância de entrega</p>
        <Campo label="Ponto de referência" value={form.referencia} onChange={set('referencia')} placeholder="Próximo ao mercado..." />
      </div>

      {erro && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">{erro}</div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] text-sm">
          Voltar
        </button>
        <button onClick={handleNext} disabled={salvando || previewDistancia?.foraDoRaio}
          className="flex-[2] py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50">
          {salvando ? 'Calculando distância...' : previewDistancia?.foraDoRaio ? 'Fora da área de entrega' : 'Usar este endereço'}
        </button>
      </div>
    </motion.div>
  );
};

export default StepEndereco;
