import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfig, updateConfig } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

// URL webhook gerada automaticamente — PagBank chama este endereço ao confirmar pagamento
const WEBHOOK_URL = `${window.location.origin}/api/pagamentos/webhook`;

const PAGBANK_URL = 'https://pagseguro.uol.com.br';

const NavRestaurante = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
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

const RestauranteConfig = () => {
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
    motoboy_comissao_tipo: 'fixo',
    motoboy_comissao_valor_fixo: '',
    motoboy_comissao_percentual: '',
    motoboy_comissao_valor_km: '',
    motoboy_comissao_km_fallback: '',
  });

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
          motoboy_comissao_tipo: d.motoboy_comissao_tipo ?? 'fixo',
          motoboy_comissao_valor_fixo: d.motoboy_comissao_valor_fixo != null ? String(d.motoboy_comissao_valor_fixo) : '',
          motoboy_comissao_percentual: d.motoboy_comissao_percentual != null ? String(d.motoboy_comissao_percentual) : '',
          motoboy_comissao_valor_km: d.motoboy_comissao_valor_km != null ? String(d.motoboy_comissao_valor_km) : '',
          motoboy_comissao_km_fallback: d.motoboy_comissao_km_fallback != null ? String(d.motoboy_comissao_km_fallback) : '',
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
        motoboy_comissao_tipo: form.motoboy_comissao_tipo,
        motoboy_comissao_valor_fixo: form.motoboy_comissao_valor_fixo !== '' ? parseFloat(form.motoboy_comissao_valor_fixo) : 0,
        motoboy_comissao_percentual: form.motoboy_comissao_percentual !== '' ? parseFloat(form.motoboy_comissao_percentual) : 0,
        motoboy_comissao_valor_km: form.motoboy_comissao_valor_km !== '' ? parseFloat(form.motoboy_comissao_valor_km) : 0,
        motoboy_comissao_km_fallback: form.motoboy_comissao_km_fallback !== '' ? parseFloat(form.motoboy_comissao_km_fallback) : 0,
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
                  <p className="text-xs text-gray-400 mt-1">Valor somado ao pedido e exibido ao cliente no checkout</p>
                </div>

                {/* Comissão do motoboy */}
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
                          <span className="text-amber-600 font-medium"> ⚠️ O endereço do seu estabelecimento não foi localizado — edite-o em "Meu Estabelecimento" pra habilitar o cálculo por km.</span>
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
