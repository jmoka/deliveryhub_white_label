import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlataformaConfig, updatePlataformaConfig } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const AdminConfiguracoes = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  const [form, setForm] = useState({
    pagbank_platform_token: '',
    pagbank_platform_account_id: '',
    pagbank_sandbox: true,
    cloudflare_tunnel_token: '',
    cloudflare_domain: '',
  });
  const [salvandoCf, setSalvandoCf] = useState(false);
  const [sucessoCf, setSucessoCf] = useState(false);
  const [erroCf, setErroCf] = useState(null);

  useEffect(() => {
    getPlataformaConfig()
      .then((d) => {
        setConfig(d);
        setForm((f) => ({
          ...f,
          pagbank_platform_account_id: d.pagbank_platform_account_id ?? '',
          pagbank_sandbox: d.pagbank_sandbox ?? true,
          cloudflare_domain: d.cloudflare_domain ?? '',
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
        pagbank_platform_account_id: form.pagbank_platform_account_id.trim(),
        pagbank_sandbox: form.pagbank_sandbox,
      };
      if (form.pagbank_platform_token.trim()) {
        payload.pagbank_platform_token = form.pagbank_platform_token.trim();
      }
      const updated = await updatePlataformaConfig(payload);
      setConfig(updated);
      setForm((f) => ({ ...f, pagbank_platform_token: '' }));
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarCloudflare = async (e) => {
    e.preventDefault();
    setSalvandoCf(true);
    setErroCf(null);
    setSucessoCf(false);
    try {
      const payload = { cloudflare_domain: form.cloudflare_domain.trim() };
      if (form.cloudflare_tunnel_token.trim()) {
        payload.cloudflare_tunnel_token = form.cloudflare_tunnel_token.trim();
      }
      const updated = await updatePlataformaConfig(payload);
      setConfig(updated);
      setForm((f) => ({ ...f, cloudflare_tunnel_token: '' }));
      setSucessoCf(true);
      setTimeout(() => setSucessoCf(false), 3000);
    } catch (err) {
      setErroCf(err.message);
    } finally {
      setSalvandoCf(false);
    }
  };

  const NavAdmin = () => (
    <nav className="flex gap-2 flex-wrap justify-end">
      {[
        { label: 'Dashboard', path: '/admin' },
        { label: 'Empresas', path: '/admin/empresas' },
        { label: 'Categorias', path: '/admin/categorias' },
        { label: 'Tags',       path: '/admin/tags' },
        { label: 'Comissões', path: '/admin/comissoes' },
        { label: 'Configurações', path: '/admin/configuracoes' },
      ].map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`px-3 py-2 text-sm font-medium rounded-lg ${
            l.path === '/admin/configuracoes'
              ? 'text-white bg-orange-500'
              : 'text-gray-700 hover:bg-gray-100'
          }`}>
          {l.label}
        </button>
      ))}
      <button
        onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
        className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
      >
        Sair
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurações da Plataforma</h1>
          <p className="text-sm text-gray-500">Integração PagBank Marketplace (Split Payment)</p>
        </div>
        <NavAdmin />
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* Status */}
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${
              config?.configurado ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <Icon
                name={config?.configurado ? 'CheckCircle' : 'AlertCircle'}
                size={20}
                className={`mt-0.5 flex-shrink-0 ${config?.configurado ? 'text-green-600' : 'text-yellow-600'}`}
              />
              <div>
                <p className={`text-sm font-semibold ${config?.configurado ? 'text-green-800' : 'text-yellow-800'}`}>
                  {config?.configurado ? 'Split Payment configurado e ativo' : 'Split Payment não configurado'}
                </p>
                {config?.configurado ? (
                  <p className="text-xs text-green-600 mt-0.5">
                    Token: {config.pagbank_platform_token_masked} · Account: {config.pagbank_platform_account_id} · {config.pagbank_sandbox ? 'Sandbox' : 'Produção'}
                  </p>
                ) : (
                  <p className="text-xs text-yellow-700 mt-0.5">
                    Configure o token e account ID abaixo para ativar o repasse automático aos restaurantes.
                  </p>
                )}
              </div>
            </div>

            {/* Explicação do fluxo */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h2 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Icon name="Info" size={16} /> Como funciona o Split Payment
              </h2>
              <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside">
                <li>Cliente paga → dinheiro vai para a <strong>conta da plataforma</strong> (seu token abaixo)</li>
                <li>PagBank divide automaticamente: restaurante recebe a parte dele, você recebe a comissão</li>
                <li>Nenhum dinheiro transita manualmente — tudo automático no momento do pagamento</li>
              </ol>
              <div className="mt-3 text-xs text-blue-600 bg-blue-100 rounded-lg p-2">
                <strong>Restaurante precisa:</strong> informar o ID da conta deles em /restaurante/config → "ID da conta PagBank"
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-1">Conta PagBank Marketplace</h2>
              <p className="text-sm text-gray-500 mb-5">
                Obtenha o token e account ID na sua conta PagBank tipo Marketplace/Facilitador.
              </p>

              <form onSubmit={handleSalvar} className="space-y-4">
                {/* Token da plataforma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token da Plataforma (Marketplace)
                    {config?.configurado && (
                      <span className="text-xs text-gray-400 ml-2">(deixe vazio para manter atual)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={form.pagbank_platform_token}
                    onChange={(e) => setForm((f) => ({ ...f, pagbank_platform_token: e.target.value }))}
                    placeholder={
                      config?.configurado
                        ? config.pagbank_platform_token_masked
                        : 'Token da conta Marketplace PagBank'
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Usado para processar TODOS os pagamentos dos restaurantes da plataforma
                  </p>
                </div>

                {/* Account ID da plataforma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account ID da Plataforma
                  </label>
                  <input
                    type="text"
                    value={form.pagbank_platform_account_id}
                    onChange={(e) => setForm((f) => ({ ...f, pagbank_platform_account_id: e.target.value }))}
                    placeholder="Ex: ACCT_XXXXXXXXXXXX"
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Conta onde a comissão de cada venda será depositada automaticamente
                  </p>
                </div>

                {/* Sandbox toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, pagbank_sandbox: !f.pagbank_sandbox }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      form.pagbank_sandbox ? 'bg-orange-400' : 'bg-green-500'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.pagbank_sandbox ? 'left-1' : 'left-5'
                    }`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {form.pagbank_sandbox ? 'Sandbox (testes)' : 'Produção (cobranças reais)'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {form.pagbank_sandbox
                        ? 'Pagamentos não são reais — para testes'
                        : 'Atenção: pagamentos reais serão processados'}
                    </p>
                  </div>
                </div>

                {/* Comissão info */}
                <div className="bg-gray-50 border rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Comissão por restaurante</p>
                  <p className="text-xs text-gray-500">
                    Cada restaurante tem sua própria taxa configurada em <strong>Empresas → editar</strong>.
                    O campo <code className="bg-gray-100 px-1 rounded">comissao_pct</code> define o % descontado automaticamente no split.
                  </p>
                </div>

                {erro && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>
                )}
                {sucesso && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    Configuração salva!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar configurações'}
                </button>
              </form>
            </div>
            {/* ── Cloudflare Tunnel ───────────────────────────────── */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900">Acesso via Cloudflare Tunnel</h2>
                {config?.cloudflare_configurado ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Ativo
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Não configurado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Permite que clientes externos acessem o sistema via domínio público seguro (HTTPS), mesmo sem IP fixo.
              </p>

              {/* Instrução de uso */}
              <div className="bg-gray-900 rounded-xl p-4 mb-5 text-xs font-mono">
                <p className="text-gray-400 mb-1"># 1. Instale o cloudflared no PC do restaurante</p>
                <p className="text-green-400">{'winget install Cloudflare.cloudflared'}</p>
                <p className="text-gray-400 mt-2 mb-1"># 2. Execute com o token abaixo</p>
                <p className="text-yellow-300 break-all">
                  {'cloudflared tunnel run --token '}
                  <span className="text-white">
                    {config?.cloudflare_tunnel_token_masked ?? '<TOKEN>'}
                  </span>
                </p>
                {config?.cloudflare_domain && (
                  <>
                    <p className="text-gray-400 mt-2 mb-1"># 3. Acesse via</p>
                    <p className="text-blue-400">https://{config.cloudflare_domain}</p>
                  </>
                )}
              </div>

              <form onSubmit={handleSalvarCloudflare} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token do Tunnel
                    {config?.cloudflare_configurado && (
                      <span className="text-xs text-gray-400 ml-2">(deixe vazio para manter atual: {config.cloudflare_tunnel_token_masked})</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={form.cloudflare_tunnel_token}
                    onChange={(e) => setForm((f) => ({ ...f, cloudflare_tunnel_token: e.target.value }))}
                    placeholder="eyJhIjoiXXX... (obtido no Cloudflare Zero Trust)"
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Cloudflare Zero Trust → Tunnels → criar tunnel → copiar token
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domínio público</label>
                  <input
                    type="text"
                    value={form.cloudflare_domain}
                    onChange={(e) => setForm((f) => ({ ...f, cloudflare_domain: e.target.value }))}
                    placeholder="delivery.seudominio.com"
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Apenas letras, números, pontos e hífens. Ex: pedidos.seusite.com.br
                  </p>
                </div>

                {erroCf && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erroCf}</div>
                )}
                {sucessoCf && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    Configuração Cloudflare salva!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={salvandoCf}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 disabled:opacity-50"
                >
                  {salvandoCf ? 'Salvando...' : 'Salvar configuração Cloudflare'}
                </button>
              </form>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default AdminConfiguracoes;
