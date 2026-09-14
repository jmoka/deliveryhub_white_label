import React, { useState, useEffect } from 'react';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import CredenciaisForm from '../../components/perfil/CredenciaisForm';
import ImageUpload from '../../components/ui/ImageUpload';
import MapaLocalizacaoPicker from '../../components/MapaLocalizacaoPicker';
import Icon from '../../components/AppIcon';
import { getMinhaEmpresa, updateEmpresa, atualizarLocalizacaoManual } from '../../services/restauranteService';
import { buscarCep } from '../../utils/viaCep';
import { reverseGeocode, geocodeEndereco } from '../../utils/reverseGeocode';
import { useAuth } from '../../contexts/AuthContext';

// Endereço fica guardado como uma string só (address) — separa Logradouro/Número
// visualmente e concatena os dois antes de salvar (mesma lógica de restaurante-config).
const separarNumero = (address) => {
  const m = (address ?? '').match(/^(.*?),?\s*(\d+[a-zA-Z]?)\s*$/);
  return m ? { logradouro: m[1].trim(), numero: m[2] } : { logradouro: address ?? '', numero: '' };
};

const DadosEstabelecimentoForm = () => {
  const [form, setForm] = useState({
    name: '', logo_url: '', logradouro: '', numero: '', cep: '', neighborhood: '', city: '', state: '',
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  // Localização exata no mapa (mesma precisão do endereço do cliente): pino é a
  // fonte de verdade, texto e pino ficam sincronizados nos dois sentidos.
  const [localizacao, setLocalizacao] = useState({ lat: null, lng: null });
  const [ajustadoManualmente, setAjustadoManualmente] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    getMinhaEmpresa()
      .then((d) => {
        const e = d.empresa ?? {};
        const { logradouro, numero } = separarNumero(e.address);
        setForm({
          name: e.name ?? '',
          logo_url: e.logo_url ?? '',
          logradouro, numero,
          cep: e.cep ?? '',
          neighborhood: e.neighborhood ?? '',
          city: e.city ?? '',
          state: e.state ?? '',
        });
        setLocalizacao({ lat: e.lat ?? null, lng: e.lng ?? null });
        setAjustadoManualmente(!!e.lat_ajustado_manualmente);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  const formatCEP = (v) => {
    const n = v.replace(/\D/g, '');
    return n.length <= 8 ? n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => (b ? `${a}-${b}` : a)) : v;
  };

  const handleCepChange = async (e) => {
    const formatted = formatCEP(e.target.value);
    set('cep', formatted);

    const digitos = formatted.replace(/\D/g, '');
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    const endereco = await buscarCep(digitos);
    setBuscandoCep(false);
    if (!endereco) return;
    const novoForm = {
      logradouro: endereco.logradouro || form.logradouro,
      neighborhood: endereco.bairro || form.neighborhood,
      city: endereco.cidade || form.city,
      state: endereco.estado || form.state,
    };
    setForm((f) => ({ ...f, ...novoForm }));

    // CEP resolveu um endereço — o pino segue automaticamente, mesma precisão
    // do endereço do cliente.
    const coords = await geocodeEndereco({
      logradouro: novoForm.logradouro, numero: form.numero,
      bairro: novoForm.neighborhood, cidade: novoForm.city, estado: novoForm.state, cep: formatted,
    });
    if (coords) setLocalizacao(coords);
  };

  // Pino é a fonte de verdade: sempre que ajustado no mapa (busca, GPS ou
  // arrastar), o texto do endereço acompanha automaticamente.
  const handlePinChange = (lat, lng) => {
    setLocalizacao({ lat, lng });
    reverseGeocode(lat, lng).then((dados) => {
      if (!dados) return;
      setForm((f) => ({
        ...f,
        logradouro: dados.logradouro || f.logradouro,
        numero: dados.numero || f.numero,
        neighborhood: dados.bairro || f.neighborhood,
        city: dados.cidade || f.city,
        state: dados.estado || f.state,
        cep: dados.cep ? formatCEP(dados.cep) : f.cep,
      }));
    });
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErro('Informe o nome do estabelecimento.');
      return;
    }
    const enderecoPreenchido = !!form.logradouro.trim();
    if (enderecoPreenchido && !form.numero.trim()) {
      setErro('Informe o número do endereço.');
      return;
    }
    if (enderecoPreenchido && (localizacao.lat == null || localizacao.lng == null)) {
      setErro('Ajuste o pino no mapa pra confirmar a localização exata antes de salvar.');
      return;
    }
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      await updateEmpresa({
        name: form.name.trim(),
        logo_url: form.logo_url,
        address: form.logradouro.trim() ? `${form.logradouro.trim()}, ${form.numero.trim()}` : '',
        cep: form.cep.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
      });
      if (enderecoPreenchido) {
        await atualizarLocalizacaoManual(localizacao.lat, localizacao.lng);
        setAjustadoManualmente(true);
      }
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-6 flex justify-center">
      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Dados do estabelecimento</h3>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
        Nome, avatar e endereço. O logo/banner da página de vendas fica em "Designer"; pagamento e motoboy ficam em "Configurações".
      </p>

      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Avatar</label>
          <div className="mt-1 flex items-center gap-4">
            {form.logo_url && (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-zinc-700 flex-shrink-0">
                <img src={form.logo_url} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <ImageUpload value={form.logo_url} onChange={(url) => set('logo_url', url)} folder="logos" aspect="square" placeholder="https://exemplo.com/logo.jpg" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Nome do estabelecimento</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required
            className="w-full mt-1 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Logradouro (rua/av.)</label>
            <input value={form.logradouro} onChange={(e) => set('logradouro', e.target.value)} placeholder="Rua Exemplo"
              className="w-full mt-1 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Número</label>
            <input value={form.numero} onChange={(e) => set('numero', e.target.value)} placeholder="123"
              className="w-full mt-1 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">CEP {buscandoCep && '(buscando...)'}</label>
            <input value={form.cep} onChange={handleCepChange} placeholder="00000-000" maxLength={9}
              className="w-full mt-1 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Bairro</label>
            <input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)}
              className="w-full mt-1 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Cidade</label>
            <input value={form.city} onChange={(e) => set('city', e.target.value)}
              className="w-full mt-1 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Estado</label>
            <input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="UF" maxLength={2}
              className="w-full mt-1 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 mt-3 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Localização exata no mapa</h4>
            {ajustadoManualmente && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 rounded-full px-2 py-0.5">
                <Icon name="Check" size={10} /> Calibrado manualmente
              </span>
            )}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2 mb-3">
            <Icon name="MapPinned" size={15} className="flex-shrink-0 mt-0.5" />
            <span>Fixe o pino no mapa — é a partir dele que o sistema calcula distância, rota e preço do frete pra cada cliente. Só o endereço escrito não garante precisão.</span>
          </div>
          <MapaLocalizacaoPicker lat={localizacao.lat} lng={localizacao.lng} onChange={handlePinChange} />
          {form.logradouro.trim() && localizacao.lat == null && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-2">
              <Icon name="AlertTriangle" size={12} /> Busque o endereço ou use o GPS acima e ajuste o pino antes de salvar
            </p>
          )}
        </div>

        {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
        {sucesso && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <Icon name="CheckCircle" size={16} /> Dados atualizados com sucesso.
          </p>
        )}

        <button type="submit" disabled={salvando}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {salvando ? 'Salvando...' : 'Salvar dados do estabelecimento'}
        </button>
      </form>
    </div>
  );
};

const RestauranteMeuPerfil = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/meu-perfil" title="Meu Perfil" subtitle="Dados do estabelecimento, email e senha de acesso" />

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        <DadosEstabelecimentoForm />
        <CredenciaisForm currentEmail={user?.email} mostrarSeguranca2FA />
      </main>
    </div>
  );
};

export default RestauranteMeuPerfil;
