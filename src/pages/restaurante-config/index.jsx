import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfig, updateConfig } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const RestauranteConfig = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const [form, setForm] = useState({
    pagbank_token: '',
    pagbank_sandbox: true,
    pagbank_webhook_url: '',
  });

  useEffect(() => {
    getConfig()
      .then((d) => {
        setConfig(d);
        setForm((f) => ({
          ...f,
          pagbank_sandbox: d.pagbank_sandbox ?? true,
          pagbank_webhook_url: d.pagbank_webhook_url ?? '',
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
        pagbank_webhook_url: form.pagbank_webhook_url,
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500">Integração de pagamentos</p>
        </div>
        <nav className="flex gap-3">
          <button onClick={() => navigate('/restaurante')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Dashboard</button>
          <button onClick={() => navigate('/restaurante/produtos')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Produtos</button>
          <button onClick={() => navigate('/restaurante/pedidos')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Pedidos</button>
          <button onClick={() => navigate('/restaurante/config')} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg">Config</button>
          <button
            onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status atual */}
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${
              config?.configurado
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <Icon
                name={config?.configurado ? 'CheckCircle' : 'AlertCircle'}
                size={20}
                className={config?.configurado ? 'text-green-600' : 'text-yellow-600'}
              />
              <div>
                <p className={`text-sm font-semibold ${config?.configurado ? 'text-green-800' : 'text-yellow-800'}`}>
                  {config?.configurado ? 'PagBank configurado' : 'PagBank não configurado'}
                </p>
                {config?.configurado && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Token: {config.pagbank_token_masked} · {config.pagbank_sandbox ? 'Sandbox' : 'Produção'}
                  </p>
                )}
                {!config?.configurado && (
                  <p className="text-xs text-yellow-600 mt-0.5">
                    Pagamentos usam credenciais globais da plataforma
                  </p>
                )}
              </div>
            </div>

            {/* Formulário PagBank */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-1">PagBank</h2>
              <p className="text-sm text-gray-500 mb-5">
                Configure suas credenciais para receber pagamentos diretamente.
                Obtenha o token em{' '}
                <span className="text-blue-600 font-mono text-xs">pagseguro.uol.com.br → Sua Conta → Preferências</span>.
              </p>

              <form onSubmit={handleSalvar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token PagBank
                    {config?.configurado && (
                      <span className="text-xs text-gray-400 ml-2">(deixe vazio para manter atual)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={form.pagbank_token}
                    onChange={(e) => setForm((f) => ({ ...f, pagbank_token: e.target.value }))}
                    placeholder={config?.configurado ? config.pagbank_token_masked : 'Cole seu token aqui'}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Webhook</label>
                  <input
                    type="url"
                    value={form.pagbank_webhook_url}
                    onChange={(e) => setForm((f) => ({ ...f, pagbank_webhook_url: e.target.value }))}
                    placeholder="https://seudominio.com/api/pagamentos/webhook"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    PagBank envia notificações de pagamento para esta URL
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, pagbank_sandbox: !f.pagbank_sandbox }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      form.pagbank_sandbox ? 'bg-orange-400' : 'bg-green-500'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        form.pagbank_sandbox ? 'left-1' : 'left-5'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {form.pagbank_sandbox ? 'Sandbox (testes)' : 'Produção (cobranças reais)'}
                  </span>
                </div>

                {erro && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {erro}
                  </div>
                )}

                {sucesso && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    Configuração salva com sucesso!
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
          </div>
        )}
      </main>
    </div>
  );
};

export default RestauranteConfig;
