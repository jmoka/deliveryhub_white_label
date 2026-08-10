import React, { useState, useEffect } from 'react';
import { getPlataformaConfig, updatePlataformaConfig, getRedeInfo, getEmpresas } from '../../services/adminService';
import Icon from '../../components/AppIcon';
import AdminHeader from '../../components/admin/AdminHeader';

const AdminConfiguracoes = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  const [form, setForm] = useState({
    pagbank_platform_token: '',
    pagbank_platform_account_id: '',
    pagbank_sandbox: true,
  });
  const [redeInfo, setRedeInfo] = useState(null);

  const [modoIndividual, setModoIndividual] = useState(false);
  const [modoIndividualRestauranteId, setModoIndividualRestauranteId] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [salvandoModo, setSalvandoModo] = useState(false);
  const [sucessoModo, setSucessoModo] = useState(false);
  const [erroModo, setErroModo] = useState(null);

  const [comissaoPadrao, setComissaoPadrao] = useState('5');
  const [diasTolerancia, setDiasTolerancia] = useState('3');
  const [limiteRevisoesMotoboy, setLimiteRevisoesMotoboy] = useState('2');
  const [salvandoComissao, setSalvandoComissao] = useState(false);
  const [sucessoComissao, setSucessoComissao] = useState(false);
  const [erroComissao, setErroComissao] = useState(null);

  useEffect(() => {
    getPlataformaConfig()
      .then((d) => {
        setConfig(d);
        setForm((f) => ({
          ...f,
          pagbank_platform_account_id: d.pagbank_platform_account_id ?? '',
          pagbank_sandbox: d.pagbank_sandbox ?? true,
        }));
        setModoIndividual(d.modo_individual ?? false);
        setModoIndividualRestauranteId(d.modo_individual_restaurant_id ?? '');
        setComissaoPadrao(String(d.comissao_padrao_pct ?? 5));
        setDiasTolerancia(String(d.plano_dias_tolerancia ?? 3));
        setLimiteRevisoesMotoboy(String(d.motoboy_limite_revisoes ?? 2));
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
    getRedeInfo().then(setRedeInfo).catch(() => {});
    getEmpresas().then((d) => setEmpresas(d.empresas ?? [])).catch(() => {});
  }, []);

  const handleSalvarModoIndividual = async (e) => {
    e.preventDefault();
    setSalvandoModo(true);
    setErroModo(null);
    setSucessoModo(false);
    try {
      const payload = {
        modo_individual: modoIndividual,
        modo_individual_restaurant_id: modoIndividual && modoIndividualRestauranteId
          ? parseInt(modoIndividualRestauranteId, 10)
          : null,
      };
      const updated = await updatePlataformaConfig(payload);
      setConfig(updated);
      setSucessoModo(true);
      setTimeout(() => setSucessoModo(false), 3000);
    } catch (err) {
      setErroModo(err.message);
    } finally {
      setSalvandoModo(false);
    }
  };

  const handleSalvarComissao = async (e) => {
    e.preventDefault();
    setSalvandoComissao(true);
    setErroComissao(null);
    setSucessoComissao(false);
    try {
      const payload = {
        comissao_padrao_pct: parseFloat(comissaoPadrao),
        plano_dias_tolerancia: parseInt(diasTolerancia, 10),
        motoboy_limite_revisoes: parseInt(limiteRevisoesMotoboy, 10),
      };
      const updated = await updatePlataformaConfig(payload);
      setConfig(updated);
      setSucessoComissao(true);
      setTimeout(() => setSucessoComissao(false), 3000);
    } catch (err) {
      setErroComissao(err.message);
    } finally {
      setSalvandoComissao(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/configuracoes" title="Configurações da Plataforma" subtitle="Integração PagBank Marketplace (Split Payment)" />

      <main className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* Status */}
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${
              config?.configurado ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900'
            }`}>
              <Icon
                name={config?.configurado ? 'CheckCircle' : 'AlertCircle'}
                size={20}
                className={`mt-0.5 flex-shrink-0 ${config?.configurado ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}
              />
              <div>
                <p className={`text-sm font-semibold ${config?.configurado ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
                  {config?.configurado ? 'Split Payment configurado e ativo' : 'Split Payment não configurado'}
                </p>
                {config?.configurado ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Token: {config.pagbank_platform_token_masked} · Account: {config.pagbank_platform_account_id} · {config.pagbank_sandbox ? 'Sandbox' : 'Produção'}
                  </p>
                ) : (
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                    Configure o token e account ID abaixo para ativar o repasse automático aos restaurantes.
                  </p>
                )}
              </div>
            </div>

            {/* Explicação do fluxo */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-5">
              <h2 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Icon name="Info" size={16} /> Como funciona o Split Payment
              </h2>
              <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-2 list-decimal list-inside">
                <li>Cliente paga → dinheiro vai para a <strong>conta da plataforma</strong> (seu token abaixo)</li>
                <li>PagBank divide automaticamente: restaurante recebe a parte dele, você recebe a comissão</li>
                <li>Nenhum dinheiro transita manualmente — tudo automático no momento do pagamento</li>
              </ol>
              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2">
                <strong>Restaurante precisa:</strong> informar o ID da conta deles em /restaurante/config → "ID da conta PagBank"
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Conta PagBank Marketplace</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
                Obtenha o token e account ID na sua conta PagBank tipo Marketplace/Facilitador.
              </p>

              <form onSubmit={handleSalvar} className="space-y-4">
                {/* Token da plataforma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Token da Plataforma (Marketplace)
                    {config?.configurado && (
                      <span className="text-xs text-gray-400 dark:text-zinc-500 ml-2">(deixe vazio para manter atual)</span>
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
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Usado para processar TODOS os pagamentos dos restaurantes da plataforma
                  </p>
                </div>

                {/* Account ID da plataforma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Account ID da Plataforma
                  </label>
                  <input
                    type="text"
                    value={form.pagbank_platform_account_id}
                    onChange={(e) => setForm((f) => ({ ...f, pagbank_platform_account_id: e.target.value }))}
                    placeholder="Ex: ACCT_XXXXXXXXXXXX"
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
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
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      {form.pagbank_sandbox ? 'Sandbox (testes)' : 'Produção (cobranças reais)'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {form.pagbank_sandbox
                        ? 'Pagamentos não são reais — para testes'
                        : 'Atenção: pagamentos reais serão processados'}
                    </p>
                  </div>
                </div>

                {/* Comissão info */}
                <div className="bg-gray-50 dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Comissão por restaurante</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Cada restaurante tem sua própria taxa configurada em <strong>Empresas → editar</strong>.
                    O campo <code className="bg-gray-100 dark:bg-zinc-800 px-1 rounded">comissao_pct</code> define o % descontado automaticamente no split.
                  </p>
                </div>

                {erro && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">{erro}</div>
                )}
                {sucesso && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg text-sm text-green-700 dark:text-green-400">
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
            {/* ── Modo de instalação ──────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Modo de instalação</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
                Marque se este sistema roda para um único estabelecimento, sem outras empresas na plataforma.
              </p>

              <form onSubmit={handleSalvarModoIndividual} className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModoIndividual((v) => !v)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      modoIndividual ? 'bg-orange-500' : 'bg-gray-300 dark:bg-zinc-600'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      modoIndividual ? 'left-5' : 'left-1'
                    }`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Instalação individual (mono-estabelecimento)
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {modoIndividual
                        ? 'Painel admin restrito a 1 restaurante — sem cadastro de novas empresas'
                        : 'Desligado — plataforma multi-empresa normal'}
                    </p>
                  </div>
                </div>

                {modoIndividual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                      Estabelecimento
                    </label>
                    <select
                      value={modoIndividualRestauranteId}
                      onChange={(e) => setModoIndividualRestauranteId(e.target.value)}
                      className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Selecione o restaurante...</option>
                      {empresas.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                      Restaurante que ficará visível no painel admin. Não afeta o login do dono, que já acessa direto o painel da loja.
                    </p>
                  </div>
                )}

                {erroModo && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">{erroModo}</div>
                )}
                {sucessoModo && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg text-sm text-green-700 dark:text-green-400">
                    Configuração salva!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={salvandoModo || (modoIndividual && !modoIndividualRestauranteId)}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 disabled:opacity-50"
                >
                  {salvandoModo ? 'Salvando...' : 'Salvar modo de instalação'}
                </button>
              </form>
            </div>

            {/* ── Comissão e Inadimplência ─────────────────────────── */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Comissão e Inadimplência</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
                Valores padrão aplicados quando a loja não tem configuração própria.
              </p>

              <form onSubmit={handleSalvarComissao} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Comissão padrão por venda (%)
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={comissaoPadrao}
                    onChange={(e) => setComissaoPadrao(e.target.value)}
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Aplicada em lojas sem % própria definida (campo em branco em Empresas → editar).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Dias de tolerância antes de bloquear painel do dono
                  </label>
                  <input
                    type="number" min="0" step="1"
                    value={diasTolerancia}
                    onChange={(e) => setDiasTolerancia(e.target.value)}
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Dias após o vencimento de uma fatura de plano até o painel do dono ser bloqueado.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Limite de pedidos de revisão (motoboy recusado)
                  </label>
                  <input
                    type="number" min="0" step="1"
                    value={limiteRevisoesMotoboy}
                    onChange={(e) => setLimiteRevisoesMotoboy(e.target.value)}
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Quantas vezes um motoboy com cadastro recusado pode pedir reavaliação antes de travar o botão.
                  </p>
                </div>

                {erroComissao && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">{erroComissao}</div>
                )}
                {sucessoComissao && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg text-sm text-green-700 dark:text-green-400">
                    Configuração salva!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={salvandoComissao}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 disabled:opacity-50"
                >
                  {salvandoComissao ? 'Salvando...' : 'Salvar comissão e tolerância'}
                </button>
              </form>
            </div>

            {/* ── Acesso via Rede Local (WiFi) ──────────────────── */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Acesso via Rede Local (WiFi)</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                Outros dispositivos na mesma rede (celulares, tablets, outros PCs) podem acessar o sistema pelo IP abaixo.
              </p>
              {redeInfo ? (
                <div className="space-y-3">
                  {redeInfo.ips.length === 0 ? (
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                      Nenhum IP de rede local detectado. Verifique se o PC está conectado ao WiFi ou rede cabeada.
                    </p>
                  ) : (
                    redeInfo.ips.map((ip) => (
                      <div key={ip} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-gray-400 text-[10px] mb-0.5">Abrir no celular / outro PC (mesma rede WiFi)</p>
                          <p className="text-green-400 font-mono text-sm select-all">
                            http://{ip}:{redeInfo.porta}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(`http://${ip}:${redeInfo.porta}`)}
                          className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-1 flex-shrink-0"
                        >
                          Copiar
                        </button>
                      </div>
                    ))
                  )}
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    O celular e o PC devem estar na mesma rede WiFi.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500">
                  <div className="w-4 h-4 border-2 border-gray-300 dark:border-zinc-600 border-t-transparent rounded-full animate-spin" />
                  Detectando IP...
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default AdminConfiguracoes;
