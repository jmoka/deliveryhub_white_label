import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  updatePerfil, listarEnderecos, criarEndereco, verificarEndereco, selecionarEndereco,
} from '../../services/perfilService';
import { buscarCep } from '../../utils/viaCep';
import { reverseGeocode } from '../../utils/reverseGeocode';
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

const linhaEndereco = (a) => [a?.logradouro, a?.numero].filter(Boolean).join(', ');

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

// Lembrete fixo (não é modal que aparece uma vez e some) — motoboy usa o pino,
// não o texto do endereço, pra chegar no lugar certo.
const AvisoPino = () => (
  <div className="p-3 bg-[#FF441F]/5 border border-[#FF441F]/20 rounded-xl text-xs text-[#27272A] dark:text-[#F4F4F5] flex items-start gap-2">
    <Icon name="MapPinned" size={15} className="text-[#FF441F] flex-shrink-0 mt-0.5" />
    <span>Fixe o pino no mapa — é isso que o motoboy usa pra chegar. Só o endereço escrito não garante a entrega no lugar certo.</span>
  </div>
);

const StepEndereco = ({ perfil, restauranteId, permiteRetirada, retirada, setRetirada, onNext, onBack }) => {
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
  const [pinAjustado, setPinAjustado] = useState(null); // { lat, lng } | null — setado quando o cliente confirma/arrasta o pino
  const [ajustandoPino, setAjustandoPino] = useState(false);

  // (a) seletor de origem do endereço — null enquanto o cliente não escolheu.
  const [origem, setOrigem] = useState(null); // null | 'gps' | 'outro'
  const [enderecos, setEnderecos] = useState([]);
  const [carregandoEnderecos, setCarregandoEnderecos] = useState(false);
  const enderecosCarregadosRef = useRef(false);
  const [confirmandoSalvo, setConfirmandoSalvo] = useState(null); // endereço salvo em confirmação | null
  const [verificacao, setVerificacao] = useState(null); // { divergente, latSugerido, lngSugerido, distanciaKm } | null
  // (b) GPS — form de texto só aparece depois que a 1ª posição do pino chega.
  const [formGpsPronto, setFormGpsPronto] = useState(false);

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

    if (!enderecosCarregadosRef.current) {
      enderecosCarregadosRef.current = true;
      carregarEnderecos();
    }
  }, [perfil]);

  const carregarEnderecos = async () => {
    setCarregandoEnderecos(true);
    try {
      setEnderecos(await listarEnderecos());
    } catch {
      setEnderecos([]);
    } finally {
      setCarregandoEnderecos(false);
    }
  };

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const voltarParaSeletor = () => {
    setOrigem(null);
    setConfirmandoSalvo(null);
    setVerificacao(null);
    setPinAjustado(null);
    setPreviewDistancia(null);
    setMostrarMapa(false);
    setFormGpsPronto(false);
    setErro(null);
  };

  const validarContato = () => {
    if (!form.name.trim() || !form.phone_e164.trim()) {
      setErro('Preencha nome e telefone.');
      return false;
    }
    return true;
  };

  const salvarContato = () => updatePerfil({
    name: form.name.trim(),
    phone_e164: form.phone_e164.trim(),
    cpf_cnpj: form.cpf_cnpj.trim(),
  });

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
      if (dados.lat != null) {
        // Abre o mapa assim que tiver uma coordenada candidata, não só quando a
        // distância parece errada.
        setMostrarMapa(true);
        // Endereço geocodificou limpo (sem suspeita de distância) — confirma o
        // pino direto, sem exigir que o cliente arraste manualmente. Se a
        // distância parece implausível, não confirma sozinho: aí sim precisa de
        // confirmação visual do cliente antes de liberar continuar.
        if (!dados.suspeito) setPinAjustado({ lat: dados.lat, lng: dados.lng });
      }
    } catch {
    } finally {
      setCalculandoPreview(false);
    }
  };

  // Cliente confirmou/arrastou o pino no mapa — o texto do endereço passa a
  // seguir o pino automaticamente (fonte de verdade vira a localização
  // confirmada, não o que foi digitado antes), e recalcula a distância com a
  // coordenada confirmada, sem passar pelo teto de plausibilidade (não é mais
  // geocodificação automática). Compartilhado pelos fluxos (a confirmar), (b) GPS
  // e (c) outro.
  const moverPino = async (lat, lng) => {
    setPinAjustado({ lat, lng });

    reverseGeocode(lat, lng).then((dados) => {
      if (!dados) return;
      setForm((f) => ({
        ...f,
        logradouro: dados.logradouro || f.logradouro,
        numero: dados.numero || f.numero,
        bairro: dados.bairro || f.bairro,
        cidade: dados.cidade || f.cidade,
        estado: dados.estado || f.estado,
        cep: dados.cep ? formatCEP(dados.cep) : f.cep,
      }));
    });

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

  // (b) GPS: pino vem primeiro — moverPino já preenche o texto a partir dele.
  // Só falta destravar a tela do formulário assim que a primeira posição chegar.
  const handlePinGps = async (lat, lng) => {
    await moverPino(lat, lng);
    setFormGpsPronto(true);
  };

  // (a) clicar num endereço salvo — se está tudo em dia, usa direto; se tem
  // alerta de desatualização, abre a tela de confirmação com o mapa antes.
  const escolherEnderecoSalvo = async (item) => {
    if (!validarContato()) return;
    setErro(null);
    setSalvando(true);
    try {
      await salvarContato();
      if (item.semPino || item.textoDesatualizado) {
        const v = await verificarEndereco(item.id);
        setVerificacao(v);
        setConfirmandoSalvo(item);
      } else {
        const updated = await selecionarEndereco(item.id);
        await onNext(updated);
      }
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarEnderecoSalvo = async () => {
    if (!pinAjustado) { setErro('Ajuste o pino no mapa antes de confirmar.'); return; }
    setSalvando(true);
    setErro(null);
    try {
      const updated = await selecionarEndereco(confirmandoSalvo.id, pinAjustado);
      await onNext(updated);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  // (b)/(c) — endereço novo (GPS confirmado ou digitado do zero), pino sempre
  // obrigatório antes de habilitar o botão.
  const confirmarEnderecoNovo = async () => {
    if (!form.logradouro.trim() || !form.numero.trim() || !form.cidade.trim() || !form.estado.trim()) {
      setErro('Preencha endereço, número, cidade e estado.');
      return;
    }
    if (previewDistancia?.foraDoRaio) {
      setErro('Esse endereço está fora da área de entrega do estabelecimento.');
      return;
    }
    if (!pinAjustado) {
      setErro('Ajuste o pino no mapa antes de continuar.');
      return;
    }
    if (!validarContato()) return;
    setSalvando(true);
    setErro(null);
    try {
      await salvarContato();
      const address_json = {
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim(),
        cep: form.cep.trim(),
        referencia: form.referencia.trim(),
      };
      const updated = await criarEndereco({ address_json, lat: pinAjustado.lat, lng: pinAjustado.lng, definirComoAtivo: true });
      await onNext(updated);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarRetirada = async () => {
    if (!validarContato()) return;
    setSalvando(true);
    setErro(null);
    try {
      const updated = await salvarContato();
      await onNext(updated);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const mostrarCamposEndereco = origem === 'outro' || (origem === 'gps' && formGpsPronto);

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
      {permiteRetirada && (
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-1.5 grid grid-cols-2 gap-1.5">
          <button type="button" onClick={() => setRetirada(false)}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              !retirada ? 'bg-[#FF441F] text-white' : 'text-[#71717A] dark:text-[#A1A1AA]'
            }`}>
            <Icon name="Bike" size={15} /> Entrega
          </button>
          <button type="button" onClick={() => setRetirada(true)}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              retirada ? 'bg-[#FF441F] text-white' : 'text-[#71717A] dark:text-[#A1A1AA]'
            }`}>
            <Icon name="Store" size={15} /> Retirar no balcão
          </button>
        </div>
      )}

      {retirada && (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <Icon name="CheckCircle2" size={16} className="flex-shrink-0" /> Sem taxa de entrega — retire seu pedido direto no estabelecimento.
        </div>
      )}

      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
        <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2 mb-1">
          <Icon name="User" size={15} className="text-[#FF441F]" /> Seus dados
        </p>
        <Campo label="Nome completo" value={form.name} onChange={set('name')} placeholder="João Silva" required />
        <Campo label="WhatsApp / Telefone" value={form.phone_e164} onChange={set('phone_e164')} placeholder="+55 11 99999-9999" required />
        <Campo label="CPF/CNPJ (opcional)" value={form.cpf_cnpj} onChange={(v) => set('cpf_cnpj')(formatCpfCnpj(v))} placeholder="000.000.000-00" />
      </div>

      {!retirada && <AvisoPino />}

      {/* (a) Seletor de origem do endereço */}
      {!retirada && origem === null && !confirmandoSalvo && (
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2 mb-1">
            <Icon name="MapPin" size={15} className="text-[#FF441F]" /> Endereço de entrega
          </p>

          {carregandoEnderecos && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Carregando seus endereços...</p>}

          {!carregandoEnderecos && enderecos.length > 0 && (
            <div className="space-y-2">
              {enderecos.map((item) => {
                const alerta = item.semPino || item.textoDesatualizado;
                return (
                  <button key={item.id} type="button" onClick={() => escolherEnderecoSalvo(item)} disabled={salvando}
                    className={`w-full text-left p-3 rounded-xl border transition-colors disabled:opacity-50 ${
                      alerta ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20' : 'border-[#E4E4E7] dark:border-[#3F3F46] hover:border-[#FF441F]/40'
                    }`}>
                    <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                      {item.apelido || linhaEndereco(item.address_json) || 'Endereço salvo'}
                    </p>
                    {item.apelido && linhaEndereco(item.address_json) && (
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{linhaEndereco(item.address_json)}</p>
                    )}
                    {alerta && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                        <Icon name="AlertTriangle" size={12} />
                        {item.semPino ? 'Sem localização confirmada no mapa — vamos pedir pra confirmar' : 'Endereço foi editado — confirme a localização no mapa'}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="pt-1 space-y-2">
            <button type="button" onClick={() => setOrigem('gps')}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#FF441F] text-[#FF441F] font-bold rounded-xl text-sm hover:bg-[#FF441F]/5">
              <Icon name="LocateFixed" size={16} /> Usar minha localização (GPS)
            </button>
            <button type="button" onClick={() => setOrigem('outro')}
              className="w-full flex items-center justify-center gap-2 py-3 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold rounded-xl text-sm hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
              <Icon name="MapPinPlus" size={16} /> Informar outro endereço
            </button>
          </div>
        </div>
      )}

      {/* Confirmação de endereço salvo desatualizado */}
      {!retirada && confirmandoSalvo && (
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2">
            <Icon name="MapPin" size={15} className="text-[#FF441F]" /> Confirme a localização
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
            {confirmandoSalvo.semPino
              ? 'Esse endereço nunca teve o pino confirmado no mapa. Ajuste abaixo antes de continuar.'
              : 'O texto desse endereço foi editado depois do último ajuste do pino. Confira e ajuste a localização correta abaixo.'}
          </p>
          <MapaLocalizacaoPicker
            lat={pinAjustado?.lat ?? confirmandoSalvo.lat ?? verificacao?.latSugerido}
            lng={pinAjustado?.lng ?? confirmandoSalvo.lng ?? verificacao?.lngSugerido}
            onChange={moverPino}
          />
          {verificacao?.divergente && verificacao?.latSugerido != null && (
            <button type="button"
              onClick={() => moverPino(verificacao.latSugerido, verificacao.lngSugerido)}
              className="w-full text-xs font-semibold text-[#FF441F] py-2 border border-[#FF441F]/40 rounded-lg hover:bg-[#FF441F]/5">
              Usar local sugerido pelo endereço {verificacao.distanciaKm != null && `(${verificacao.distanciaKm}km do pino salvo)`}
            </button>
          )}
        </div>
      )}

      {/* (b)/(c) Endereço novo — GPS ou digitado */}
      {!retirada && origem === 'gps' && !mostrarCamposEndereco && (
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2">
            <Icon name="LocateFixed" size={15} className="text-[#FF441F]" /> Localizando você...
          </p>
          <MapaLocalizacaoPicker lat={pinAjustado?.lat} lng={pinAjustado?.lng} onChange={handlePinGps} autoGps />
        </div>
      )}

      {!retirada && mostrarCamposEndereco && (
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2 mb-1">
            <Icon name="MapPin" size={15} className="text-[#FF441F]" /> Endereço de entrega
          </p>
          {origem === 'outro' && (
            <>
              <Campo label="Informe o CEP" value={form.cep} onChange={handleCepChange} placeholder="00000-000" />
              {buscandoCep && <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] -mt-2">Buscando endereço...</p>}
            </>
          )}
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

          {origem === 'outro' && mostrarMapa && (
            <div className="-mt-1">
              <MapaLocalizacaoPicker lat={pinAjustado?.lat ?? previewDistancia?.lat} lng={pinAjustado?.lng ?? previewDistancia?.lng} onChange={moverPino} />
            </div>
          )}
          {origem === 'gps' && (
            <div className="-mt-1">
              <MapaLocalizacaoPicker lat={pinAjustado?.lat} lng={pinAjustado?.lng} onChange={handlePinGps} />
            </div>
          )}
          {!pinAjustado && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Icon name="AlertTriangle" size={12} /> Ajuste o pino no mapa acima pra confirmar a localização exata
            </p>
          )}

          <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] -mt-1">
            {origem === 'gps' ? 'Confira os dados encontrados e complete o que faltar' : 'Preenche rua, bairro, cidade e estado automaticamente'}
          </p>
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
      )}

      {erro && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">{erro}</div>
      )}

      {retirada && (
        <div className="flex gap-3">
          <button onClick={onBack}
            className="flex-1 py-3.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] text-sm">
            Voltar
          </button>
          <button onClick={confirmarRetirada} disabled={salvando}
            className="flex-[2] py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Continuar'}
          </button>
        </div>
      )}

      {!retirada && origem === null && !confirmandoSalvo && (
        <button onClick={onBack}
          className="w-full py-3.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] text-sm">
          Voltar
        </button>
      )}

      {!retirada && confirmandoSalvo && (
        <div className="flex gap-3">
          <button onClick={voltarParaSeletor}
            className="flex-1 py-3.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] text-sm">
            Voltar
          </button>
          <button onClick={confirmarEnderecoSalvo} disabled={salvando || !pinAjustado}
            className="flex-[2] py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Confirmar e usar este endereço'}
          </button>
        </div>
      )}

      {!retirada && (origem === 'outro' || origem === 'gps') && (
        <div className="flex gap-3">
          <button onClick={voltarParaSeletor}
            className="flex-1 py-3.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] text-sm">
            Voltar
          </button>
          <button onClick={confirmarEnderecoNovo} disabled={salvando || previewDistancia?.foraDoRaio || !mostrarCamposEndereco}
            className="flex-[2] py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50">
            {salvando ? 'Salvando...' : previewDistancia?.foraDoRaio ? 'Fora da área de entrega' : 'Usar este endereço'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default StepEndereco;
