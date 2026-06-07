import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getEmpresa, atualizarEmpresa,
  getEmpresaConfig, updateEmpresaConfig,
  getComissoesPorEmpresa,
} from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const AdminNav = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Empresas', path: '/admin/empresas' },
    { label: 'Categorias', path: '/admin/categorias' },
    { label: 'Comissões', path: '/admin/comissoes' },
  ];
  return (
    <nav className="flex gap-3 items-center">
      {links.map((l) => (
        <button
          key={l.path}
          onClick={() => navigate(l.path)}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            active === l.path ? 'text-white bg-blue-600' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {l.label}
        </button>
      ))}
      <button
        onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
      >
        Sair
      </button>
    </nav>
  );
};

// Tab: Dados gerais
const TabDados = ({ empresa, onAtualizar }) => {
  const [form, setForm] = useState({
    name: empresa.name ?? '',
    address: empresa.address ?? '',
    comissao_pct: empresa.comissao_pct ?? 5,
    user_id: empresa.user_id ?? '',
  });
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await atualizarEmpresa(empresa.id, form);
      setSucesso(true);
      onAtualizar();
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSalvar} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comissão plataforma (%)</label>
        <input
          type="number" min="0" max="100" step="0.5"
          value={form.comissao_pct}
          onChange={(e) => setForm((f) => ({ ...f, comissao_pct: parseFloat(e.target.value) }))}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">UUID do dono (restaurant_owner)</label>
        <input
          value={form.user_id}
          onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value.trim() }))}
          className="w-full border rounded-lg px-3 py-2 text-sm font-mono text-xs"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {sucesso && <p className="text-sm text-green-600">Dados atualizados!</p>}
      <button
        type="submit"
        disabled={salvando}
        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
};

// Tab: PagBank config
const TabPagBank = ({ empresaId }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ pagbank_token: '', pagbank_sandbox: true, pagbank_webhook_url: '' });
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    getEmpresaConfig(empresaId)
      .then((d) => {
        setConfig(d);
        setForm((f) => ({
          ...f,
          pagbank_sandbox: d.pagbank_sandbox ?? true,
          pagbank_webhook_url: d.pagbank_webhook_url ?? '',
        }));
      })
      .finally(() => setLoading(false));
  }, [empresaId]);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const payload = {
        pagbank_sandbox: form.pagbank_sandbox,
        pagbank_webhook_url: form.pagbank_webhook_url,
      };
      if (form.pagbank_token.trim()) payload.pagbank_token = form.pagbank_token.trim();
      const updated = await updateEmpresaConfig(empresaId, payload);
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

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg space-y-5">
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${config?.configurado ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div>
          <p className={`text-sm font-semibold ${config?.configurado ? 'text-green-800' : 'text-yellow-800'}`}>
            {config?.configurado ? 'PagBank configurado' : 'Sem credenciais próprias'}
          </p>
          {config?.configurado && (
            <p className="text-xs text-green-600 mt-0.5">
              Token: {config.pagbank_token_masked} · {config.pagbank_sandbox ? 'Sandbox' : 'Produção'}
            </p>
          )}
          {!config?.configurado && (
            <p className="text-xs text-yellow-600 mt-0.5">Usando credenciais globais da plataforma</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token PagBank
            {config?.configurado && <span className="text-xs text-gray-400 ml-2">(deixe vazio para manter)</span>}
          </label>
          <input
            type="password"
            value={form.pagbank_token}
            onChange={(e) => setForm((f) => ({ ...f, pagbank_token: e.target.value }))}
            placeholder={config?.configurado ? config.pagbank_token_masked : 'Token do restaurante'}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Webhook</label>
          <input
            type="url"
            value={form.pagbank_webhook_url}
            onChange={(e) => setForm((f) => ({ ...f, pagbank_webhook_url: e.target.value }))}
            placeholder="https://seudominio.com/api/pagamentos/webhook"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, pagbank_sandbox: !f.pagbank_sandbox }))}
            className={`relative w-10 h-6 rounded-full transition-colors ${form.pagbank_sandbox ? 'bg-orange-400' : 'bg-green-500'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.pagbank_sandbox ? 'left-1' : 'left-5'}`} />
          </button>
          <span className="text-sm text-gray-700">
            {form.pagbank_sandbox ? 'Sandbox (testes)' : 'Produção (cobranças reais)'}
          </span>
        </div>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {sucesso && <p className="text-sm text-green-600">Configuração salva!</p>}
        <button
          type="submit"
          disabled={salvando}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar configuração PagBank'}
        </button>
      </form>
    </div>
  );
};

// Tab: Comissões
const TabComissoes = ({ empresaId }) => {
  const [comissoes, setComissoes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComissoesPorEmpresa(empresaId)
      .then((d) => {
        setComissoes(d.comissoes ?? []);
        setTotal(d.total_comissao ?? 0);
      })
      .finally(() => setLoading(false));
  }, [empresaId]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-orange-700">Total acumulado</p>
        <p className="text-xl font-bold text-orange-700">{fmt(total)}</p>
      </div>
      {comissoes.length === 0 ? (
        <p className="text-gray-400 text-sm">Nenhuma comissão registrada</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Pedido</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Venda</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Taxa</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Comissão</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{c.pedido_id}</td>
                  <td className="px-4 py-3 text-right">{fmt(c.valor_venda)}</td>
                  <td className="px-4 py-3 text-right"><span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{c.comissao_pct}%</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-700">{fmt(c.comissao_valor)}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TABS = [
  { id: 'dados', label: 'Dados Gerais' },
  { id: 'pagbank', label: 'PagBank' },
  { id: 'comissoes', label: 'Comissões' },
];

const AdminEmpresaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [tabAtiva, setTabAtiva] = useState('dados');

  const carregar = () => {
    getEmpresa(parseInt(id))
      .then((d) => {
        setEmpresa(d.empresa);
        setMetricas(d.metricas);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/empresas')} className="text-sm text-blue-600 hover:underline">
              ← Empresas
            </button>
            {empresa && <span className="text-gray-300">/</span>}
            {empresa && <span className="text-sm font-medium text-gray-700">{empresa.name}</span>}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Painel Dev-Admin</h1>
        </div>
        <AdminNav active="/admin/empresas" />
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : erro ? (
          <p className="text-red-600">{erro}</p>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Pedidos', value: metricas?.total_pedidos ?? 0 },
                { label: 'Entregues', value: metricas?.pedidos_entregues ?? 0 },
                { label: 'Faturamento', value: fmt(metricas?.faturamento) },
                { label: 'Comissão Acumulada', value: fmt(metricas?.comissao_acumulada) },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl border p-4">
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTabAtiva(t.id)}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tabAtiva === t.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border p-6">
              {tabAtiva === 'dados' && <TabDados empresa={empresa} onAtualizar={carregar} />}
              {tabAtiva === 'pagbank' && <TabPagBank empresaId={empresa.id} />}
              {tabAtiva === 'comissoes' && <TabComissoes empresaId={empresa.id} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminEmpresaDetalhe;
