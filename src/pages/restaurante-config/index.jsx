import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfig, updateConfig, listarImpressoras, getMinhaEmpresa, updateEmpresa } from '../../services/restauranteService';
import { buscarCep } from '../../utils/viaCep';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';

// URL webhook gerada automaticamente — PagBank chama este endereço ao confirmar pagamento
const WEBHOOK_URL = `${window.location.origin}/api/pagamentos/webhook`;

const PAGBANK_URL = 'https://pagseguro.uol.com.br';

const NavRestaurante = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const slugLoja = useMinhaLojaSlug();
  const tipoRestaurante = useTipoRestaurante();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Delivery', path: '/restaurante/delivery' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Entregas', path: '/restaurante/entregas' },
    ...(tipoRestaurante ? [
      { label: 'Salão', path: '/restaurante/salao' },
      { label: 'Garçons', path: '/restaurante/garcons' },
      { label: 'Impressoras', path: '/restaurante/impressoras' },
    ] : []),
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <nav className="flex gap-1.5 flex-wrap justify-end">
      {links.map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            l.path === '/restaurante/config'
              ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30'
              : 'text-[#27272A] hover:bg-[#F4F4F5]'
          }`}>
          {l.label}
        </button>
      ))}
      {slugLoja && (
        <button onClick={() => window.open(`/r/${slugLoja}`, '_blank')}
          className="px-3 py-2 text-sm font-semibold rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 flex items-center gap-1.5">
          <Icon name="ExternalLink" size={14} /> Loja
        </button>
      )}
      <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
        className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
        Sair
      </button>
    </nav>
  );
};

/* Guia passo a passo colapsável */
const Guia = () => {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const copiarWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon name="BookOpen" size={16} className="text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">Como configurar o PagBank? (passo a passo)</span>
        </div>
        <Icon name={aberto ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-blue-500 flex-shrink-0" />
      </button>

      {aberto && (
        <div className="px-5 pb-5 space-y-4 border-t border-blue-100">
          <ol className="space-y-3 mt-4">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Acesse o PagBank</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Crie uma conta ou faça login em{' '}
                  <a href={PAGBANK_URL} target="_blank" rel="noopener noreferrer"
                    className="underline font-semibold">pagseguro.uol.com.br</a>
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Obtenha o Token</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  <strong>Minha Conta → Preferências → Integrações → Token de Segurança</strong><br />
                  Copie o token e cole no campo "Token PagBank" abaixo.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Obtenha seu Account ID</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  <strong>Minha Conta → Dados da Conta → Identificador da conta</strong><br />
                  Formato: <code className="bg-blue-100 px-1 rounded">ACCT_XXXXXXXXXXXX</code>. Cole no campo "ID da conta" abaixo.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Copie a URL Webhook (gerada automaticamente)</p>
                <p className="text-xs text-blue-700 mt-1">Cadastre esta URL no PagBank em <strong>Preferências → Notificações</strong>:</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs text-blue-900 font-mono break-all">
                    {WEBHOOK_URL}
                  </code>
                  <button type="button" onClick={copiarWebhook}
                    className={`flex-shrink-0 px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      copiado ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}>
                    {copiado ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Salve as configurações abaixo</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  A URL Webhook já foi preenchida automaticamente. Só precisa do token e account ID.
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};

// Endereço estruturado (Estado/Cidade/Bairro/CEP) do estabelecimento — alimenta o
// filtro geográfico da home pública. Separado do resto da tela (que é config de
// pagamento/motoboy) porque usa outro endpoint (minha-empresa, não config).
// Endereço fica guardado como uma string só (address) — não é uma coluna separada de
// número. Pra evitar dono esquecer o número (some casos geocodificavam impreciso por
// causa disso), o form aqui separa Logradouro/Número visualmente e concatena os dois
// antes de salvar; ao carregar, tenta separar de volta um "..., 123" no fim da string
// já salva (melhor esforço — endereço antigo sem número cai tudo em Logradouro mesmo).
const separarNumero = (address) => {
  const m = (address ?? '').match(/^(.*?),?\s*(\d+[a-zA-Z]?)\s*$/);
  return m ? { logradouro: m[1].trim(), numero: m[2] } : { logradouro: address ?? '', numero: '' };
};

const EnderecoCard = ({ geocodeFalhou }) => {
  const [form, setForm] = useState({ logradouro: '', numero: '', cep: '', neighborhood: '', city: '', state: '' });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const formatCEP = (v) => {
    const n = v.replace(/\D/g, '');
    return n.length <= 8 ? n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => (b ? `${a}-${b}` : a)) : v;
  };

  const handleCepChange = async (e) => {
    const formatted = formatCEP(e.target.value);
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
      neighborhood: endereco.bairro || f.neighborhood,
      city: endereco.cidade || f.city,
      state: endereco.estado || f.state,
    }));
  };

  useEffect(() => {
    getMinhaEmpresa()
      .then((d) => {
        const e = d.empresa ?? {};
        const { logradouro, numero } = separarNumero(e.address);
        setForm({
          logradouro,
          numero,
          cep: e.cep ?? '',
          neighborhood: e.neighborhood ?? '',
          city: e.city ?? '',
          state: e.state ?? '',
        });
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.logradouro.trim() || !form.numero.trim()) {
      setErro('Informe logradouro e número.');
      return;
    }
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      await updateEmpresa({
        address: `${form.logradouro.trim()}, ${form.numero.trim()}`,
        cep: form.cep.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
      });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2500);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="font-semibold text-[#18181B] mb-1">Endereço do estabelecimento</h2>
      <p className="text-xs text-[#71717A] mb-4">Usado pro filtro de Estado/Cidade/Bairro/CEP e "restaurantes perto de mim" na home.</p>

      {geocodeFalhou && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          ⚠️ Não conseguimos localizar esse endereço no mapa — confira se está completo e correto.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={salvar} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-[#71717A]">Logradouro (rua/av.)</label>
              <input value={form.logradouro} onChange={(e) => setForm((f) => ({ ...f, logradouro: e.target.value }))}
                placeholder="Rua Exemplo"
                className="w-full mt-1 border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717A]">Número</label>
              <input value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                placeholder="123"
                className="w-full mt-1 border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-[#71717A]">CEP</label>
              <input value={form.cep} onChange={handleCepChange}
                placeholder="00000-000" maxLength={9}
                className="w-full mt-1 border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
              {buscandoCep && <p className="text-[10px] text-[#71717A] mt-1">Buscando endereço...</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717A]">Bairro</label>
              <input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                placeholder="Centro"
                className="w-full mt-1 border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717A]">Cidade</label>
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="São Paulo"
                className="w-full mt-1 border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717A]">Estado (UF)</label>
              <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))}
                placeholder="SP" maxLength={2}
                className="w-full mt-1 border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={salvando}
              className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-lg hover:bg-[#E63A19] disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar endereço'}
            </button>
            {sucesso && <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><Icon name="Check" size={14} /> Salvo</span>}
          </div>
        </form>
      )}
    </div>
  );
};

const RestauranteConfig = () => {
  const tipoRestaurante = useTipoRestaurante();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const [form, setForm] = useState({
    pagbank_token: '',
    pagbank_sandbox: true,
    pagbank_seller_account_id: '',
    taxa_pagbank_percent: '',
    chave_pix: '',
    frete_motoboy: '',
    usa_motoboy: true,
    motoboy_comissao_tipo: 'fixo',
    motoboy_comissao_valor_fixo: '',
    motoboy_comissao_percentual: '',
    motoboy_comissao_valor_km: '',
    motoboy_comissao_km_fallback: '',
    gorjeta_percentual: '',
    salao_modo: 'ambos',
    recibo_impressora_id: '',
  });
  const [impressoras, setImpressoras] = useState([]);

  useEffect(() => {
    if (tipoRestaurante) listarImpressoras().then(setImpressoras).catch(() => {});
  }, [tipoRestaurante]);

  useEffect(() => {
    getConfig()
      .then((d) => {
        setConfig(d);
        setForm((f) => ({
          ...f,
          pagbank_sandbox: d.pagbank_sandbox ?? true,
          pagbank_seller_account_id: d.pagbank_seller_account_id ?? '',
          taxa_pagbank_percent: d.taxa_pagbank_percent != null ? String(d.taxa_pagbank_percent) : '',
          chave_pix: d.chave_pix ?? '',
          frete_motoboy: d.frete_motoboy != null ? String(d.frete_motoboy) : '',
          usa_motoboy: d.usa_motoboy ?? true,
          motoboy_comissao_tipo: d.motoboy_comissao_tipo ?? 'fixo',
          motoboy_comissao_valor_fixo: d.motoboy_comissao_valor_fixo != null ? String(d.motoboy_comissao_valor_fixo) : '',
          motoboy_comissao_percentual: d.motoboy_comissao_percentual != null ? String(d.motoboy_comissao_percentual) : '',
          motoboy_comissao_valor_km: d.motoboy_comissao_valor_km != null ? String(d.motoboy_comissao_valor_km) : '',
          motoboy_comissao_km_fallback: d.motoboy_comissao_km_fallback != null ? String(d.motoboy_comissao_km_fallback) : '',
          gorjeta_percentual: d.gorjeta_percentual != null ? String(d.gorjeta_percentual) : '',
          salao_modo: d.salao_modo ?? 'ambos',
          recibo_impressora_id: d.recibo_impressora_id != null ? String(d.recibo_impressora_id) : '',
        }));
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const payload = {
        pagbank_sandbox: form.pagbank_sandbox,
        pagbank_webhook_url: WEBHOOK_URL,
        pagbank_seller_account_id: form.pagbank_seller_account_id.trim(),
        taxa_pagbank_percent: form.taxa_pagbank_percent !== '' ? parseFloat(form.taxa_pagbank_percent) : null,
        chave_pix: form.chave_pix.trim() || null,
        frete_motoboy: form.frete_motoboy !== '' ? parseFloat(form.frete_motoboy) : 0,
        usa_motoboy: form.usa_motoboy,
        motoboy_comissao_tipo: form.motoboy_comissao_tipo,
        motoboy_comissao_valor_fixo: form.motoboy_comissao_valor_fixo !== '' ? parseFloat(form.motoboy_comissao_valor_fixo) : 0,
        motoboy_comissao_percentual: form.motoboy_comissao_percentual !== '' ? parseFloat(form.motoboy_comissao_percentual) : 0,
        motoboy_comissao_valor_km: form.motoboy_comissao_valor_km !== '' ? parseFloat(form.motoboy_comissao_valor_km) : 0,
        motoboy_comissao_km_fallback: form.motoboy_comissao_km_fallback !== '' ? parseFloat(form.motoboy_comissao_km_fallback) : 0,
        gorjeta_percentual: form.gorjeta_percentual !== '' ? parseFloat(form.gorjeta_percentual) : 0,
        salao_modo: form.salao_modo,
        recibo_impressora_id: form.recibo_impressora_id !== '' ? Number(form.recibo_impressora_id) : null,
      };
      if (form.pagbank_token.trim()) {
        payload.pagbank_token = form.pagbank_token.trim();
      }
      const updated = await updateConfig(payload);
      setConfig(updated);
      setForm((f) => ({ ...f, pagbank_token: '' }));
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#18181B]">Configurações de Pagamento</h1>
          <p className="text-sm text-[#71717A]">Integração PagBank</p>
        </div>
        <NavRestaurante />
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* Status */}
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${
              config?.configurado ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <Icon name={config?.configurado ? 'CheckCircle' : 'AlertCircle'} size={20}
                className={config?.configurado ? 'text-green-600' : 'text-yellow-600'} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config?.configurado ? 'text-green-800' : 'text-yellow-800'}`}>
                  {config?.configurado ? 'PagBank configurado' : 'PagBank não configurado'}
                </p>
                <p className={`text-xs mt-0.5 ${config?.configurado ? 'text-green-600' : 'text-yellow-600'}`}>
                  {config?.configurado
                    ? `Token: ${config.pagbank_token_masked} · ${config.split_ativo ? 'Split ativo ✓' : ''} · ${config.pagbank_sandbox ? 'Sandbox' : 'Produção'}`
                    : 'Configure abaixo para receber pagamentos diretamente'
                  }
                </p>
              </div>
            </div>

            {/* Endereço estruturado — filtro geográfico da home pública */}
            <EnderecoCard geocodeFalhou={config?.geocode_falhou} />

            {/* Guia passo a passo */}
            <Guia />

            {/* Formulário — limpo */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#18181B] mb-4">Suas credenciais</h2>

              <form onSubmit={handleSalvar} className="space-y-4">
                {/* Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token PagBank
                    {config?.configurado && (
                      <span className="text-xs text-gray-400 ml-2">(deixe vazio para manter o atual)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={form.pagbank_token}
                    onChange={(e) => setForm((f) => ({ ...f, pagbank_token: e.target.value }))}
                    placeholder={config?.configurado ? config.pagbank_token_masked : 'Cole o token do PagBank'}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Account ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID da conta PagBank
                    {config?.split_ativo && (
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded ml-2">Split ativo</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.pagbank_seller_account_id}
                    onChange={(e) => setForm((f) => ({ ...f, pagbank_seller_account_id: e.target.value }))}
                    placeholder="ACCT_XXXXXXXXXXXX"
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Necessário para o repasse automático (Split Payment)</p>
                </div>

                {/* Taxa PagBank */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave PIX (para pagamentos na entrega)
                  </label>
                  <input
                    type="text"
                    value={form.chave_pix}
                    onChange={(e) => setForm((f) => ({ ...f, chave_pix: e.target.value }))}
                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Usada para gerar QR Code PIX quando motoboy precisar cobrar na entrega</p>
                </div>

                {/* Frete Motoboy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frete Motoboy (taxa de entrega)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.frete_motoboy}
                      onChange={(e) => setForm((f) => ({ ...f, frete_motoboy: e.target.value }))}
                      placeholder="0,00"
                      className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Valor somado ao pedido e exibido ao cliente no checkout (independente de usar motoboy ou não)</p>
                </div>

                {/* Como a entrega é feita */}
                <div className="border-t pt-4 mt-2">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span>
                      <span className="block text-sm font-medium text-gray-700">Usar motoboy</span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {form.usa_motoboy
                          ? 'Motoboys afiliados podem pegar seus pedidos prontos'
                          : 'Desligado: as entregas são feitas pela própria loja, sem envolver motoboy'}
                      </span>
                    </span>
                    <input type="checkbox" checked={form.usa_motoboy}
                      onChange={(e) => setForm((f) => ({ ...f, usa_motoboy: e.target.checked }))}
                      className="w-5 h-5 accent-orange-500 flex-shrink-0" />
                  </label>
                </div>

                {/* Comissão do motoboy */}
                {form.usa_motoboy && (
                <div className="border-t pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comissão do Motoboy
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    O motoboy sempre recebe o frete cobrado do cliente. Escolha um adicional pra somar em cima disso.
                  </p>

                  <select
                    value={form.motoboy_comissao_tipo}
                    onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_tipo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
                  >
                    <option value="fixo">+ Valor fixo por entrega</option>
                    <option value="percentual">+ Percentual do frete</option>
                    <option value="km">+ Valor por km rodado</option>
                  </select>

                  {form.motoboy_comissao_tipo === 'fixo' && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                      <input type="number" min="0" step="0.01"
                        value={form.motoboy_comissao_valor_fixo}
                        onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_valor_fixo: e.target.value }))}
                        placeholder="0,00"
                        className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  )}

                  {form.motoboy_comissao_tipo === 'percentual' && (
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.01"
                        value={form.motoboy_comissao_percentual}
                        onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_percentual: e.target.value }))}
                        placeholder="Ex: 80"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                    </div>
                  )}

                  {form.motoboy_comissao_tipo === 'km' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$/km</span>
                        <input type="number" min="0" step="0.01"
                          value={form.motoboy_comissao_valor_km}
                          onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_valor_km: e.target.value }))}
                          placeholder="0,00"
                          className="w-full border rounded-lg pl-16 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                        <input type="number" min="0" step="0.01"
                          value={form.motoboy_comissao_km_fallback}
                          onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_km_fallback: e.target.value }))}
                          placeholder="0,00"
                          className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                      <p className="text-xs text-gray-400">
                        O valor de segurança é usado quando não conseguimos calcular a distância (endereço não localizado).
                        {config?.geocode_falhou && (
                          <span className="text-amber-600 font-medium"> ⚠️ O endereço do seu estabelecimento não foi localizado — confira o endereço no topo desta página pra habilitar o cálculo por km.</span>
                        )}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-2">
                    Exemplo: frete de R$ {form.frete_motoboy || '0,00'} {
                      form.motoboy_comissao_tipo === 'fixo' ? `+ R$ ${form.motoboy_comissao_valor_fixo || '0,00'} fixo`
                      : form.motoboy_comissao_tipo === 'percentual' ? `+ ${form.motoboy_comissao_percentual || '0'}% do frete`
                      : `+ R$ ${form.motoboy_comissao_valor_km || '0,00'} por km rodado`
                    } = total que o motoboy recebe nessa entrega.
                  </p>
                </div>
                )}

                {tipoRestaurante && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gorjeta sugerida (% sobre o subtotal da comanda)
                    </label>
                    <div className="relative">
                      <input
                        type="number" min="0" max="30" step="0.5"
                        value={form.gorjeta_percentual}
                        onChange={(e) => setForm((f) => ({ ...f, gorjeta_percentual: e.target.value }))}
                        placeholder="Ex: 10"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      O caixa vê esse valor sugerido ao fechar a conta (PDV do Salão) — ainda pode ajustar na hora.
                    </p>
                  </div>
                )}

                {tipoRestaurante && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modo de venda do Salão
                    </label>
                    <select
                      value={form.salao_modo}
                      onChange={(e) => setForm((f) => ({ ...f, salao_modo: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="ambos">Mesas e comandas avulsas</option>
                      <option value="mesas">Somente mesas</option>
                      <option value="comandas">Somente comandas avulsas</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Controla o que o garçom pode abrir no portal dele.
                    </p>
                  </div>
                )}

                {tipoRestaurante && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impressora do recibo
                    </label>
                    <select
                      value={form.recibo_impressora_id}
                      onChange={(e) => setForm((f) => ({ ...f, recibo_impressora_id: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Nenhuma — imprimir pelo navegador</option>
                      {impressoras.map((imp) => (
                        <option key={imp.id} value={imp.id}>{imp.nome} ({imp.setor})</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Recibo de venda (pagamento final e venda direta) sai direto nessa impressora se ela tiver o agente local pareado — senão cai no navegador.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa PagBank (% sobre vendas digitais)
                  </label>
                  <div className="relative">
                    <input
                      type="number" min="0" max="30" step="0.01"
                      value={form.taxa_pagbank_percent}
                      onChange={(e) => setForm((f) => ({ ...f, taxa_pagbank_percent: e.target.value }))}
                      placeholder="Ex: 2.50"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Usado para estimar desconto PagBank no painel Financeiro</p>
                </div>

                {/* Webhook — apenas informativo */}
                <div className="bg-gray-50 border rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Icon name="Link" size={12} /> URL Webhook (gerada automaticamente)
                  </p>
                  <p className="text-xs font-mono text-gray-500 break-all">{WEBHOOK_URL}</p>
                  <p className="text-xs text-gray-400 mt-1">Cadastre esta URL em PagBank → Preferências → Notificações</p>
                </div>

                {/* Sandbox toggle */}
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, pagbank_sandbox: !f.pagbank_sandbox }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${form.pagbank_sandbox ? 'bg-[#FF441F]' : 'bg-green-500'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.pagbank_sandbox ? 'left-1' : 'left-5'}`} />
                  </button>
                  <span className="text-sm text-gray-700">
                    {form.pagbank_sandbox ? 'Sandbox (testes — sem cobranças reais)' : 'Produção (cobranças reais)'}
                  </span>
                </div>

                {erro && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>
                )}
                {sucesso && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    Configuração salva com sucesso!
                  </div>
                )}

                <button type="submit" disabled={salvando}
                  className="w-full py-2.5 bg-[#FF441F] text-white rounded-lg font-semibold text-sm hover:bg-[#e03b1a] disabled:opacity-50">
                  {salvando ? 'Salvando...' : 'Salvar configurações'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RestauranteConfig;
