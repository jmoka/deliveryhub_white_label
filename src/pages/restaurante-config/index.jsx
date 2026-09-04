import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getConfig, updateConfig, listarImpressoras, getMinhaEmpresa, updateEmpresa,
  atualizarLocalizacaoManual,
  listarComissoesGarcom, criarComissaoGarcom, atualizarComissaoGarcom, removerComissaoGarcom,
  gerarTokenGdoor, getStatusGdoor, salvarCnpjEsperadoGdoor,
  getCatalogoGdoor, bloquearSyncGdoor, importarDeGdoor, exportarParaGdoor, getStatusExportacaoGdoor,
  getCatalogoClientesGdoor, bloquearSyncClienteGdoor, importarClientesDeGdoor, exportarClientesParaGdoor, getStatusExportacaoClientesGdoor,
} from '../../services/restauranteService';
import { AgenteImpressaoPanel } from '../restaurante-impressoras';
import { buscarCep } from '../../utils/viaCep';
import Icon from '../../components/AppIcon';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import MapaLocalizacaoPicker from '../../components/MapaLocalizacaoPicker';

// URL webhook gerada automaticamente — PagBank chama este endereço ao confirmar pagamento
const WEBHOOK_URL = `${window.location.origin}/api/pagamentos/webhook`;

const PAGBANK_URL = 'https://pagseguro.uol.com.br';

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
    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon name="BookOpen" size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-400">Como configurar o PagBank? (passo a passo)</span>
        </div>
        <Icon name={aberto ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
      </button>

      {aberto && (
        <div className="px-5 pb-5 space-y-4 border-t border-blue-100 dark:border-blue-800">
          <ol className="space-y-3 mt-4">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-400">Acesse o PagBank</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  Crie uma conta ou faça login em{' '}
                  <a href={PAGBANK_URL} target="_blank" rel="noopener noreferrer"
                    className="underline font-semibold">pagseguro.uol.com.br</a>
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-400">Obtenha o Token</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  <strong>Minha Conta → Preferências → Integrações → Token de Segurança</strong><br />
                  Copie o token e cole no campo "Token PagBank" abaixo.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-400">Obtenha seu Account ID</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  <strong>Minha Conta → Dados da Conta → Identificador da conta</strong><br />
                  Formato: <code className="bg-blue-100 dark:bg-blue-950/40 px-1 rounded">ACCT_XXXXXXXXXXXX</code>. Cole no campo "ID da conta" abaixo.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-400">Copie a URL Webhook (gerada automaticamente)</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Cadastre esta URL no PagBank em <strong>Preferências → Notificações</strong>:</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="flex-1 bg-white dark:bg-[#27272A] border border-blue-200 dark:border-blue-800 rounded-lg px-2 py-1.5 text-xs text-blue-900 dark:text-blue-400 font-mono break-all">
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
                <p className="text-sm font-medium text-blue-900 dark:text-blue-400">Salve as configurações abaixo</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
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

// Agente GDOOR local — mesmo padrão do AgenteImpressaoPanel (print-agent):
// token de pareamento gerado aqui, colado na config do agente Python que roda
// na máquina do restaurante (junto do GDOOR). O agente é quem puxa (polling)
// os pedidos pendentes, nunca o servidor empurra — funciona atrás de qualquer
// NAT sem configuração de rede. Camada extra: o agente lê o CNPJ cadastrado no
// GDOOR local e o backend confere contra o CNPJ esperado digitado aqui.
const GdoorAgentePanel = () => {
  const [status, setStatus] = useState(null);
  const [token, setToken] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [cnpjEsperado, setCnpjEsperado] = useState('');
  const [salvandoCnpj, setSalvandoCnpj] = useState(false);

  const carregarStatus = useCallback(() => getStatusGdoor().then((s) => {
    setStatus(s);
    setCnpjEsperado((atual) => (atual ? atual : s.cnpj_esperado ?? ''));
  }).catch(() => {}), []);

  useEffect(() => {
    carregarStatus();
    const interval = setInterval(carregarStatus, 15000);
    return () => clearInterval(interval);
  }, [carregarStatus]);

  const gerar = async () => {
    setGerando(true);
    try {
      const { token } = await gerarTokenGdoor();
      setToken(token);
      carregarStatus();
    } finally {
      setGerando(false);
    }
  };

  const copiar = () => {
    navigator.clipboard?.writeText(token);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const salvarCnpj = async () => {
    setSalvandoCnpj(true);
    try {
      await salvarCnpjEsperadoGdoor(cnpjEsperado.trim());
      carregarStatus();
    } finally {
      setSalvandoCnpj(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Integração GDOOR</p>
        {status && (
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${status.online ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400'}`}>
            {status.online ? 'Online' : status.pareado ? 'Offline' : 'Não pareado'}
          </span>
        )}
      </div>
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">
        Envia automaticamente cada pedido entregue como pré-venda pro GDOOR SLIM (PDV NFC-e), sem digitar de novo.
      </p>

      <div className="mb-3">
        <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1">CNPJ esperado no GDOOR</label>
        <div className="flex gap-2">
          <input value={cnpjEsperado} onChange={(e) => setCnpjEsperado(e.target.value)}
            placeholder="00.000.000/0000-00"
            className="flex-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          <button onClick={salvarCnpj} disabled={salvandoCnpj}
            className="px-3 py-2 bg-zinc-800 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex-shrink-0">
            {salvandoCnpj ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <p className="text-[11px] text-[#A1A1AA] mt-1">
          Segurança extra: o agente lê o CNPJ cadastrado no GDOOR local e o sistema confere aqui — se não bater, não envia nenhuma pré-venda.
        </p>
        {status?.cnpj_confere === false && (
          <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">
            ⚠️ CNPJ não confere — GDOOR reportou "{status.cnpj_confirmado}", esperado "{status.cnpj_esperado}"
          </p>
        )}
      </div>

      <ol className="text-xs text-[#71717A] dark:text-[#A1A1AA] space-y-1.5 mb-3 list-decimal list-inside">
        <li>
          <a href="/api_gdoor.rar" download className="text-[#FF441F] font-semibold">Baixe o agente (api_gdoor.rar)</a>
          {' '}no PC onde o GDOOR SLIM está instalado.
        </li>
        <li>Descompacte o arquivo baixado (botão direito → Extrair aqui).</li>
        <li>Abra a pasta <strong>api_gdoor</strong>.</li>
        <li>Clique em <strong>"Gerar token de conexão"</strong> abaixo, copie a chave.</li>
        <li>Dê duplo clique em <strong>parear.bat</strong> — vai abrir uma janela mostrando se o GDOOR foi encontrado e o CNPJ cadastrado nele. Cole o token no campo, confirme que o CNPJ bate com o do estabelecimento e clique em <strong>Conectar</strong>. Essa janela só testa a conexão uma vez — pode fechar depois.</li>
        <li>
          Dê duplo clique em <strong>iniciar.bat</strong> para ligar o agente de verdade — é essa janela (preta, com linhas de texto passando) que precisa ficar <strong>aberta o tempo todo</strong>. Se fechar, as pré-vendas param de ser enviadas mesmo com o status acima mostrando "Online".
        </li>
        <li>Abra <strong>"Mapeamento de produtos GDOOR"</strong> abaixo e escolha o código do GDOOR pra cada produto — sem isso a pré-venda desse item não sai.</li>
      </ol>
      <p className="text-xs text-[#A1A1AA] mb-3">
        💡 Dica: crie um atalho do <strong>iniciar.bat</strong> na área de trabalho (ou na pasta Inicializar do Windows) para o agente ligar sozinho quando o computador ligar.
      </p>
      <p className="text-xs text-[#A1A1AA] mb-3">
        <a href="https://github.com/jmoka/deliveryhub_white_label/tree/main/api_gdoor" target="_blank" rel="noreferrer" className="text-[#FF441F] font-semibold">Documentação completa</a>
      </p>

      <button onClick={gerar} disabled={gerando}
        className="px-4 py-2 bg-zinc-800 text-white text-sm font-bold rounded-xl disabled:opacity-50">
        {gerando ? 'Gerando...' : 'Gerar token de conexão'}
      </button>
      {token && (
        <div className="flex items-center gap-2 mt-3 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-xl px-3 py-2">
          <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] truncate flex-1">{token}</span>
          <button onClick={copiar} className="text-xs font-bold text-[#FF441F]">{copiado ? 'Copiado!' : 'Copiar'}</button>
        </div>
      )}
    </div>
  );
};

// Mapeia cada produto do DeliveryHub pro código correspondente no ESTOQUE do
// GDOOR — sem isso a pré-venda trava no item (job fica em erro, agente pede pra
// mapear). Estoque vem do cache que o agente reporta a cada poll (não é live).
const formatarMoeda = (v) => (v == null ? '—' : `R$ ${Number(v).toFixed(2)}`);

/* Linha de item dentro do modal de mapeamento — usada tanto pro lado GDOOR
   quanto pro lado DeliveryHub, só muda o conteúdo passado via props. */
const LinhaMapeamento = ({ selecionavel, selecionado, onToggle, titulo, subtitulo, mapeado, diverge, extra }) => (
  <div className={`flex items-center gap-3 border rounded-xl px-3 py-2 ${diverge ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' : 'border-[#E4E4E7] dark:border-[#3F3F46]'}`}>
    {selecionavel && (
      <input type="checkbox" checked={selecionado} onChange={onToggle} className="w-4 h-4 flex-shrink-0 accent-[#FF441F]" />
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm text-[#18181B] dark:text-[#F4F4F5] truncate">{titulo}</p>
      <p className="text-[11px] text-[#A1A1AA] truncate">{subtitulo}</p>
    </div>
    <div className="flex-shrink-0 flex items-center gap-2">
      {mapeado ? (
        diverge ? (
          <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" title="Nome, preço ou quantidade diferentes entre os dois cadastros">⚠ Diverge</span>
        ) : (
          <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">✓ Mapeado</span>
        )
      ) : (
        <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400">— Não mapeado</span>
      )}
      {extra}
    </div>
  </div>
);

const GdoorMapeamentoModal = ({ onClose, onFechado }) => {
  const [carregando, setCarregando] = useState(true);
  const [catalogo, setCatalogo] = useState({ produtos_delivery: [], estoque_gdoor: [] });
  const [aba, setAba] = useState('gdoor');
  const [filtro, setFiltro] = useState('nao_mapeados');
  const [selecionados, setSelecionados] = useState(new Set());
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [exportandoStatus, setExportandoStatus] = useState(null);

  const carregar = useCallback(() => {
    setCarregando(true);
    return getCatalogoGdoor()
      .then(setCatalogo)
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    setSelecionados(new Set());
    setResultado(null);
  }, [aba, filtro]);

  const listaAtual = aba === 'gdoor' ? catalogo.estoque_gdoor : catalogo.produtos_delivery;
  const chave = (item) => (aba === 'gdoor' ? item.codigo : item.id);
  const mapeadoOk = (item) => (aba === 'gdoor' ? !!item.product_id : !!item.codigo_gdoor);

  const filtrada = (listaAtual ?? []).filter((item) => {
    if (aba === 'gdoor' && item.bloqueado_sync && filtro !== 'todos') return false;
    if (filtro === 'nao_mapeados') return !mapeadoOk(item);
    if (filtro === 'mapeados') return mapeadoOk(item);
    return true;
  });

  const selecionaveis = filtrada.filter((item) => !mapeadoOk(item) && !(aba === 'gdoor' && item.bloqueado_sync));

  const toggleSelecionado = (id) => {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  const selecionarTodos = () => {
    setSelecionados((atual) =>
      atual.size === selecionaveis.length ? new Set() : new Set(selecionaveis.map(chave)),
    );
  };

  const bloquear = async (codigo, bloqueado) => {
    await bloquearSyncGdoor(codigo, bloqueado);
    setCatalogo((c) => ({ ...c, estoque_gdoor: c.estoque_gdoor.map((e) => (e.codigo === codigo ? { ...e, bloqueado_sync: bloqueado } : e)) }));
  };

  const importar = async () => {
    setProcessando(true);
    setResultado(null);
    try {
      const r = await importarDeGdoor([...selecionados]);
      setResultado({ tipo: 'importar', ...r });
      await carregar();
      setSelecionados(new Set());
    } finally {
      setProcessando(false);
    }
  };

  const exportar = async () => {
    setProcessando(true);
    setResultado(null);
    try {
      const r = await exportarParaGdoor([...selecionados]);
      setResultado({ tipo: 'exportar', ...r });
      setSelecionados(new Set());
      if (r.enfileirados?.length) {
        setExportandoStatus({ pendentes: r.enfileirados.length });
        const interval = setInterval(async () => {
          const status = await getStatusExportacaoGdoor().catch(() => null);
          if (!status) return;
          const pendentes = status.jobs.filter((j) => j.status === 'pendente' && r.enfileirados.includes(j.product_id));
          setExportandoStatus({ pendentes: pendentes.length });
          if (pendentes.length === 0) {
            clearInterval(interval);
            setExportandoStatus(null);
            carregar();
          }
        }, 3000);
      } else {
        await carregar();
      }
    } finally {
      setProcessando(false);
    }
  };

  const fechar = () => {
    onClose();
    onFechado?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7] dark:border-[#3F3F46]">
          <div>
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Mapeamento de produtos GDOOR</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Liga o cadastro do GDOOR com o do DeliveryHub — sem mapear, a pré-venda desse produto não sai.</p>
          </div>
          <button onClick={fechar} className="text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex border-b border-[#E4E4E7] dark:border-[#3F3F46] px-6">
          {[['gdoor', 'Produtos GDOOR'], ['delivery', 'Produtos DeliveryHub']].map(([valor, label]) => (
            <button key={valor} onClick={() => setAba(valor)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${aba === valor ? 'border-[#FF441F] text-[#FF441F]' : 'border-transparent text-[#71717A] dark:text-[#A1A1AA]'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-3 gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {[['nao_mapeados', 'Não mapeados'], ['mapeados', 'Mapeados'], ['todos', 'Todos']].map(([valor, label]) => (
              <button key={valor} onClick={() => setFiltro(valor)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${filtro === valor ? 'bg-zinc-800 text-white' : 'bg-[#F4F4F5] dark:bg-[#18181B] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                {label}
              </button>
            ))}
          </div>
          {selecionaveis.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] cursor-pointer">
                <input type="checkbox" checked={selecionados.size === selecionaveis.length} onChange={selecionarTodos} className="w-4 h-4 accent-[#FF441F]" />
                Selecionar todos ({selecionaveis.length})
              </label>
              <button
                onClick={aba === 'gdoor' ? importar : exportar}
                disabled={selecionados.size === 0 || processando}
                className="px-3 py-1.5 bg-[#FF441F] text-white text-xs font-bold rounded-lg disabled:opacity-40"
              >
                {processando ? 'Enviando...' : aba === 'gdoor' ? `Importar ${selecionados.size} para o Delivery` : `Enviar ${selecionados.size} para o GDOOR`}
              </button>
            </div>
          )}
        </div>

        {exportandoStatus && (
          <div className="mx-6 mb-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-3 py-2">
            Aguardando o agente criar {exportandoStatus.pendentes} produto(s) no GDOOR...
          </div>
        )}
        {resultado && (
          <div className="mx-6 mb-2 text-xs bg-[#F4F4F5] dark:bg-[#18181B] rounded-lg px-3 py-2 text-[#18181B] dark:text-[#F4F4F5]">
            {resultado.tipo === 'importar' && <p>{resultado.importados?.length ?? 0} importado(s){resultado.ignorados?.length ? `, ${resultado.ignorados.length} ignorado(s)` : ''}.</p>}
            {resultado.tipo === 'exportar' && <p>{resultado.enfileirados?.length ?? 0} enviado(s) pro agente processar{resultado.ignorados?.length ? `, ${resultado.ignorados.length} ignorado(s)` : ''}.</p>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {carregando ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Carregando...</p>
          ) : filtrada.length === 0 ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Nenhum produto {filtro === 'nao_mapeados' ? 'pendente de mapear' : filtro === 'mapeados' ? 'mapeado ainda' : 'encontrado'}.</p>
          ) : (
            filtrada.map((item) => (
              aba === 'gdoor' ? (
                <LinhaMapeamento
                  key={item.codigo}
                  selecionavel={!mapeadoOk(item) && !item.bloqueado_sync}
                  selecionado={selecionados.has(item.codigo)}
                  onToggle={() => toggleSelecionado(item.codigo)}
                  titulo={`${item.codigo} — ${item.descricao}`}
                  subtitulo={`${formatarMoeda(item.preco_venda)} · ${item.qtd ?? 0} ${item.unidade ?? ''}${item.nome_delivery ? ` · mapeado com "${item.nome_delivery}"` : ''}`}
                  mapeado={mapeadoOk(item)}
                  diverge={item.diverge}
                  extra={
                    !mapeadoOk(item) && (
                      <button onClick={() => bloquear(item.codigo, !item.bloqueado_sync)}
                        className="text-[10px] px-2 py-1 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                        {item.bloqueado_sync ? 'Voltar a sincronizar' : 'Não sincronizar'}
                      </button>
                    )
                  }
                />
              ) : (
                <LinhaMapeamento
                  key={item.id}
                  selecionavel={!mapeadoOk(item)}
                  selecionado={selecionados.has(item.id)}
                  onToggle={() => toggleSelecionado(item.id)}
                  titulo={item.name}
                  subtitulo={`${item.category_name} · ${formatarMoeda(item.price)}${item.codigo_gdoor ? ` · GDOOR ${item.codigo_gdoor}` : ''}`}
                  mapeado={mapeadoOk(item)}
                  diverge={item.diverge}
                />
              )
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const GdoorMapeamentoPanel = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    getCatalogoGdoor()
      .then((c) => {
        const naoMapeados = (c.estoque_gdoor ?? []).filter((e) => !e.product_id && !e.bloqueado_sync).length;
        setResumo({ naoMapeados });
      })
      .catch(() => {});
  }, [modalAberto]);

  return (
    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Mapeamento de produtos GDOOR</p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Diz qual produto do GDOOR corresponde a qual produto do DeliveryHub — sem isso a pré-venda não sai.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {resumo && (
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${resumo.naoMapeados > 0 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'}`}>
              {resumo.naoMapeados > 0 ? `${resumo.naoMapeados} sem mapear` : 'Tudo mapeado'}
            </span>
          )}
          <button onClick={() => setModalAberto(true)}
            className="px-3 py-1.5 bg-zinc-800 text-white text-xs font-bold rounded-xl">
            Abrir mapeamento de produtos
          </button>
        </div>
      </div>
      {modalAberto && <GdoorMapeamentoModal onClose={() => setModalAberto(false)} />}
    </div>
  );
};

const GdoorClientesModal = ({ onClose }) => {
  const [carregando, setCarregando] = useState(true);
  const [catalogo, setCatalogo] = useState({ clientes_delivery: [], clientes_gdoor: [] });
  const [aba, setAba] = useState('gdoor');
  const [filtro, setFiltro] = useState('nao_mapeados');
  const [selecionados, setSelecionados] = useState(new Set());
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [exportandoStatus, setExportandoStatus] = useState(null);

  const carregar = useCallback(() => {
    setCarregando(true);
    return getCatalogoClientesGdoor()
      .then(setCatalogo)
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    setSelecionados(new Set());
    setResultado(null);
  }, [aba, filtro]);

  const listaAtual = aba === 'gdoor' ? catalogo.clientes_gdoor : catalogo.clientes_delivery;
  const chave = (item) => (aba === 'gdoor' ? item.codigo : item.id);
  const mapeadoOk = (item) => (aba === 'gdoor' ? !!item.customer_id : !!item.codigo_gdoor);

  const filtrada = (listaAtual ?? []).filter((item) => {
    if (aba === 'gdoor' && item.bloqueado_sync && filtro !== 'todos') return false;
    if (filtro === 'nao_mapeados') return !mapeadoOk(item);
    if (filtro === 'mapeados') return mapeadoOk(item);
    return true;
  });

  const selecionaveis = filtrada.filter((item) => !mapeadoOk(item) && item.sincronizavel && !(aba === 'gdoor' && item.bloqueado_sync));

  const toggleSelecionado = (id) => {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  const selecionarTodos = () => {
    setSelecionados((atual) =>
      atual.size === selecionaveis.length ? new Set() : new Set(selecionaveis.map(chave)),
    );
  };

  const bloquear = async (codigo, bloqueado) => {
    await bloquearSyncClienteGdoor(codigo, bloqueado);
    setCatalogo((c) => ({ ...c, clientes_gdoor: c.clientes_gdoor.map((e) => (e.codigo === codigo ? { ...e, bloqueado_sync: bloqueado } : e)) }));
  };

  const importar = async () => {
    setProcessando(true);
    setResultado(null);
    try {
      const r = await importarClientesDeGdoor([...selecionados]);
      setResultado({ tipo: 'importar', ...r });
      await carregar();
      setSelecionados(new Set());
    } finally {
      setProcessando(false);
    }
  };

  const exportar = async () => {
    setProcessando(true);
    setResultado(null);
    try {
      const r = await exportarClientesParaGdoor([...selecionados]);
      setResultado({ tipo: 'exportar', ...r });
      setSelecionados(new Set());
      if (r.enfileirados?.length) {
        setExportandoStatus({ pendentes: r.enfileirados.length });
        const interval = setInterval(async () => {
          const status = await getStatusExportacaoClientesGdoor().catch(() => null);
          if (!status) return;
          const pendentes = status.jobs.filter((j) => j.status === 'pendente' && r.enfileirados.includes(j.customer_id));
          setExportandoStatus({ pendentes: pendentes.length });
          if (pendentes.length === 0) {
            clearInterval(interval);
            setExportandoStatus(null);
            carregar();
          }
        }, 3000);
      } else {
        await carregar();
      }
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7] dark:border-[#3F3F46]">
          <div>
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Sincronização de clientes GDOOR</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Liga o cadastro de cliente do GDOOR com o do DeliveryHub. Cliente com o mesmo CPF/CNPJ nos dois lados é vinculado automaticamente, sem duplicar.</p>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex border-b border-[#E4E4E7] dark:border-[#3F3F46] px-6">
          {[['gdoor', 'Clientes GDOOR'], ['delivery', 'Clientes DeliveryHub']].map(([valor, label]) => (
            <button key={valor} onClick={() => setAba(valor)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${aba === valor ? 'border-[#FF441F] text-[#FF441F]' : 'border-transparent text-[#71717A] dark:text-[#A1A1AA]'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-3 gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {[['nao_mapeados', 'Não mapeados'], ['mapeados', 'Mapeados'], ['todos', 'Todos']].map(([valor, label]) => (
              <button key={valor} onClick={() => setFiltro(valor)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${filtro === valor ? 'bg-zinc-800 text-white' : 'bg-[#F4F4F5] dark:bg-[#18181B] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                {label}
              </button>
            ))}
          </div>
          {selecionaveis.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] cursor-pointer">
                <input type="checkbox" checked={selecionados.size === selecionaveis.length} onChange={selecionarTodos} className="w-4 h-4 accent-[#FF441F]" />
                Selecionar todos ({selecionaveis.length})
              </label>
              <button
                onClick={aba === 'gdoor' ? importar : exportar}
                disabled={selecionados.size === 0 || processando}
                className="px-3 py-1.5 bg-[#FF441F] text-white text-xs font-bold rounded-lg disabled:opacity-40"
              >
                {processando ? 'Enviando...' : aba === 'gdoor' ? `Importar ${selecionados.size} para o Delivery` : `Enviar ${selecionados.size} para o GDOOR`}
              </button>
            </div>
          )}
        </div>

        {exportandoStatus && (
          <div className="mx-6 mb-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-3 py-2">
            Aguardando o agente criar {exportandoStatus.pendentes} cliente(s) no GDOOR...
          </div>
        )}
        {resultado && (
          <div className="mx-6 mb-2 text-xs bg-[#F4F4F5] dark:bg-[#18181B] rounded-lg px-3 py-2 text-[#18181B] dark:text-[#F4F4F5]">
            {resultado.tipo === 'importar' && <p>{resultado.importados?.length ?? 0} importado(s){resultado.ignorados?.length ? `, ${resultado.ignorados.length} ignorado(s)` : ''}.</p>}
            {resultado.tipo === 'exportar' && (
              <p>
                {resultado.enfileirados?.length ?? 0} enviado(s) pro agente processar
                {resultado.mapeados_direto?.length ? `, ${resultado.mapeados_direto.length} já existia(m) no GDOOR e só foram vinculados` : ''}
                {resultado.ignorados?.length ? `, ${resultado.ignorados.length} ignorado(s)` : ''}.
              </p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {carregando ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Carregando...</p>
          ) : filtrada.length === 0 ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Nenhum cliente {filtro === 'nao_mapeados' ? 'pendente de mapear' : filtro === 'mapeados' ? 'mapeado ainda' : 'encontrado'}.</p>
          ) : (
            filtrada.map((item) => (
              aba === 'gdoor' ? (
                <LinhaMapeamento
                  key={item.codigo}
                  selecionavel={!mapeadoOk(item) && item.sincronizavel && !item.bloqueado_sync}
                  selecionado={selecionados.has(item.codigo)}
                  onToggle={() => toggleSelecionado(item.codigo)}
                  titulo={`${item.codigo} — ${item.nome}`}
                  subtitulo={`${item.cnpj_cnpf ?? 'sem CPF/CNPJ — não sincroniza'}${item.telefone ? ` · ${item.telefone}` : ''}${item.nome_delivery ? ` · vinculado a "${item.nome_delivery}"` : ''}`}
                  mapeado={mapeadoOk(item)}
                  diverge={item.diverge}
                  extra={
                    !mapeadoOk(item) && (
                      <button onClick={() => bloquear(item.codigo, !item.bloqueado_sync)}
                        className="text-[10px] px-2 py-1 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                        {item.bloqueado_sync ? 'Voltar a sincronizar' : 'Não sincronizar'}
                      </button>
                    )
                  }
                />
              ) : (
                <LinhaMapeamento
                  key={item.id}
                  selecionavel={!mapeadoOk(item) && item.sincronizavel}
                  selecionado={selecionados.has(item.id)}
                  onToggle={() => toggleSelecionado(item.id)}
                  titulo={item.name}
                  subtitulo={`${item.cpf_cnpj ?? 'sem CPF/CNPJ — não sincroniza'}${item.phone_e164 ? ` · ${item.phone_e164}` : ''}${item.codigo_gdoor ? ` · GDOOR ${item.codigo_gdoor}` : ''}`}
                  mapeado={mapeadoOk(item)}
                  diverge={item.diverge}
                />
              )
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const GdoorClientesPanel = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    getCatalogoClientesGdoor()
      .then((c) => {
        const naoMapeados = (c.clientes_gdoor ?? []).filter((e) => !e.customer_id && !e.bloqueado_sync).length;
        setResumo({ naoMapeados });
      })
      .catch(() => {});
  }, [modalAberto]);

  return (
    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Sincronização de clientes GDOOR</p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Liga o cadastro de cliente do GDOOR com o do DeliveryHub (por CPF/CNPJ, sem duplicar).</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {resumo && (
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${resumo.naoMapeados > 0 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'}`}>
              {resumo.naoMapeados > 0 ? `${resumo.naoMapeados} sem mapear` : 'Tudo mapeado'}
            </span>
          )}
          <button onClick={() => setModalAberto(true)}
            className="px-3 py-1.5 bg-zinc-800 text-white text-xs font-bold rounded-xl">
            Abrir sincronização de clientes
          </button>
        </div>
      </div>
      {modalAberto && <GdoorClientesModal onClose={() => setModalAberto(false)} />}
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
  const [localizacao, setLocalizacao] = useState({ lat: null, lng: null });
  const [ajustadoManualmente, setAjustadoManualmente] = useState(false);
  const [salvandoLocalizacao, setSalvandoLocalizacao] = useState(false);
  const [sucessoLocalizacao, setSucessoLocalizacao] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState(null);

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
        setLocalizacao({ lat: e.lat ?? null, lng: e.lng ?? null });
        setAjustadoManualmente(!!e.lat_ajustado_manualmente);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const salvarLocalizacao = async () => {
    if (localizacao.lat == null || localizacao.lng == null) return;
    setSalvandoLocalizacao(true);
    setErroLocalizacao(null);
    setSucessoLocalizacao(false);
    try {
      await atualizarLocalizacaoManual(localizacao.lat, localizacao.lng);
      setAjustadoManualmente(true);
      setSucessoLocalizacao(true);
      setTimeout(() => setSucessoLocalizacao(false), 2500);
    } catch (err) {
      setErroLocalizacao(err.message);
    } finally {
      setSalvandoLocalizacao(false);
    }
  };

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
    <div className="bg-white dark:bg-[#27272A] rounded-xl border p-6">
      <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-1">Endereço do estabelecimento</h2>
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-4">Usado pro filtro de Estado/Cidade/Bairro/CEP e "restaurantes perto de mim" na home.</p>

      {geocodeFalhou && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
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
              <label className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">Logradouro (rua/av.)</label>
              <input value={form.logradouro} onChange={(e) => setForm((f) => ({ ...f, logradouro: e.target.value }))}
                placeholder="Rua Exemplo"
                className="w-full mt-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">Número</label>
              <input value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                placeholder="123"
                className="w-full mt-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">CEP</label>
              <input value={form.cep} onChange={handleCepChange}
                placeholder="00000-000" maxLength={9}
                className="w-full mt-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
              {buscandoCep && <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mt-1">Buscando endereço...</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">Bairro</label>
              <input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                placeholder="Centro"
                className="w-full mt-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">Cidade</label>
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="São Paulo"
                className="w-full mt-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">Estado (UF)</label>
              <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))}
                placeholder="SP" maxLength={2}
                className="w-full mt-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF441F]" />
            </div>
          </div>
          {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={salvando}
              className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-lg hover:bg-[#E63A19] disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar endereço'}
            </button>
            {sucesso && <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1"><Icon name="Check" size={14} /> Salvo</span>}
          </div>
        </form>
      )}

      {!loading && (
        <div className="mt-6 pt-5 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-[#18181B] dark:text-[#F4F4F5]">Localização exata no mapa</h3>
            {ajustadoManualmente && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 rounded-full px-2 py-0.5">
                <Icon name="Check" size={10} /> Calibrado manualmente
              </span>
            )}
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3">
            O endereço acima é convertido em coordenadas automaticamente, mas pode errar
            algumas centenas de metros. Ajuste o pino aqui pra garantir que o filtro
            "restaurantes perto de mim" (mesmo em raios pequenos, tipo 20-50m) funcione certinho.
          </p>

          <MapaLocalizacaoPicker
            lat={localizacao.lat}
            lng={localizacao.lng}
            onChange={(lat, lng) => setLocalizacao({ lat, lng })}
          />

          {erroLocalizacao && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{erroLocalizacao}</p>}
          <div className="flex items-center gap-3 pt-3">
            <button type="button" onClick={salvarLocalizacao} disabled={salvandoLocalizacao || localizacao.lat == null}
              className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-lg hover:bg-[#E63A19] disabled:opacity-50">
              {salvandoLocalizacao ? 'Salvando...' : 'Salvar localização precisa'}
            </button>
            {sucessoLocalizacao && <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1"><Icon name="Check" size={14} /> Salvo</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// Regras de comissão são do estabelecimento (não por garçom individual) — toda comanda
// fechada lança a comissão de cada regra ativa (ver lancarComissoes no backend). CRUD
// próprio, salva na hora (não depende do botão "Salvar" do form geral da página).
const ComissoesConfig = () => {
  const [comissoes, setComissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState('percentual');
  const [novoValor, setNovoValor] = useState('');
  const [novoBase, setNovoBase] = useState('total_vendido');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = () =>
    listarComissoesGarcom().then(setComissoes).catch((e) => setErro(e.message)).finally(() => setLoading(false));

  useEffect(() => { carregar(); }, []);

  const adicionar = async () => {
    if (!novoNome.trim() || !novoValor) return;
    setSalvando(true);
    setErro(null);
    try {
      await criarComissaoGarcom({ nome: novoNome.trim(), tipo: novoTipo, valor: parseFloat(novoValor), base_calculo: novoBase });
      setNovoNome('');
      setNovoValor('');
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (c) => {
    setErro(null);
    try {
      await atualizarComissaoGarcom(c.id, { ativo: !c.ativo });
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const remover = async (c) => {
    if (!window.confirm(`Remover a regra "${c.nome}"?`)) return;
    setErro(null);
    try {
      await removerComissaoGarcom(c.id);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Comissão do garçom</label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Regra vale pro estabelecimento inteiro (todo garçom recebe igual). Sem regra ativa, a comissão fica em R$ 0,00.
      </p>

      {loading ? (
        <p className="text-xs text-gray-400">Carregando...</p>
      ) : (
        <div className="space-y-1.5 mb-2">
          {comissoes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-400 truncate">{c.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {c.tipo === 'percentual' ? `${c.valor}%` : `R$ ${Number(c.valor).toFixed(2)}`}
                  {' '}sobre {c.base_calculo === 'total_recebido' ? 'total recebido' : 'total vendido'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => toggleAtivo(c)}
                  className={`text-xs font-bold px-2 py-1 rounded-full ${c.ativo ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400'}`}>
                  {c.ativo ? 'Ativa' : 'Inativa'}
                </button>
                <button type="button" onClick={() => remover(c)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 flex-shrink-0">
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          ))}
          {comissoes.length === 0 && (
            <p className="text-xs text-gray-400">Nenhuma regra cadastrada.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end border-t pt-2">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Nome</label>
          <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Comissão padrão"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tipo</label>
          <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm">
            <option value="percentual">%</option>
            <option value="fixo">R$ fixo</option>
          </select>
        </div>
        <div className="w-24">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Valor</label>
          <input type="number" min="0" step="0.01" value={novoValor} onChange={(e) => setNovoValor(e.target.value)}
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Base de cálculo</label>
          <select value={novoBase} onChange={(e) => setNovoBase(e.target.value)} className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 text-sm">
            <option value="total_vendido">Total vendido</option>
            <option value="total_recebido">Total recebido</option>
          </select>
        </div>
        <button type="button" onClick={adicionar} disabled={salvando || !novoNome.trim() || !novoValor}
          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold disabled:opacity-40">
          Adicionar
        </button>
      </div>
      {erro && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{erro}</p>}
    </div>
  );
};

const RestauranteConfig = () => {
  const { moduloSalao, moduloGdoor } = useModulosEmpresa();
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
    pagamento_manual: false,
    frete_motoboy: '',
    usa_motoboy: true,
    permite_retirada_balcao: false,
    motoboy_comissao_tipo: 'fixo',
    motoboy_comissao_valor_fixo: '',
    motoboy_comissao_percentual: '',
    motoboy_comissao_valor_km: '',
    motoboy_comissao_km_fallback: '',
    km_incluso_frete: '',
    valor_km_excedente: '',
    raio_maximo_entrega_km: '',
    gorjeta_percentual: '',
    taxa_cartao_percentual: '',
    salao_modo: 'ambos',
    recibo_impressora_id: '',
    sangria_acrescimo_impressora_id: '',
    auto_atendimento_habilitado: false,
  });
  const [impressoras, setImpressoras] = useState([]);

  useEffect(() => {
    if (moduloSalao) listarImpressoras().then(setImpressoras).catch(() => {});
  }, [moduloSalao]);

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
          pagamento_manual: d.pagamento_manual ?? false,
          frete_motoboy: d.frete_motoboy != null ? String(d.frete_motoboy) : '',
          usa_motoboy: d.usa_motoboy ?? true,
          permite_retirada_balcao: d.permite_retirada_balcao ?? false,
          motoboy_comissao_tipo: d.motoboy_comissao_tipo ?? 'fixo',
          motoboy_comissao_valor_fixo: d.motoboy_comissao_valor_fixo != null ? String(d.motoboy_comissao_valor_fixo) : '',
          motoboy_comissao_percentual: d.motoboy_comissao_percentual != null ? String(d.motoboy_comissao_percentual) : '',
          motoboy_comissao_valor_km: d.motoboy_comissao_valor_km != null ? String(d.motoboy_comissao_valor_km) : '',
          motoboy_comissao_km_fallback: d.motoboy_comissao_km_fallback != null ? String(d.motoboy_comissao_km_fallback) : '',
          km_incluso_frete: d.km_incluso_frete != null ? String(d.km_incluso_frete) : '1',
          valor_km_excedente: d.valor_km_excedente != null ? String(d.valor_km_excedente) : '',
          raio_maximo_entrega_km: d.raio_maximo_entrega_km != null ? String(d.raio_maximo_entrega_km) : '',
          gorjeta_percentual: d.gorjeta_percentual != null ? String(d.gorjeta_percentual) : '',
          taxa_cartao_percentual: d.taxa_cartao_percentual != null ? String(d.taxa_cartao_percentual) : '',
          salao_modo: d.salao_modo ?? 'ambos',
          recibo_impressora_id: d.recibo_impressora_id != null ? String(d.recibo_impressora_id) : '',
          sangria_acrescimo_impressora_id: d.sangria_acrescimo_impressora_id != null ? String(d.sangria_acrescimo_impressora_id) : '',
          auto_atendimento_habilitado: d.auto_atendimento_habilitado ?? false,
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
        pagamento_manual: form.pagamento_manual,
        frete_motoboy: form.frete_motoboy !== '' ? parseFloat(form.frete_motoboy) : 0,
        usa_motoboy: form.usa_motoboy,
        permite_retirada_balcao: form.permite_retirada_balcao,
        motoboy_comissao_tipo: form.motoboy_comissao_tipo,
        motoboy_comissao_valor_fixo: form.motoboy_comissao_valor_fixo !== '' ? parseFloat(form.motoboy_comissao_valor_fixo) : 0,
        motoboy_comissao_percentual: form.motoboy_comissao_percentual !== '' ? parseFloat(form.motoboy_comissao_percentual) : 0,
        motoboy_comissao_valor_km: form.motoboy_comissao_valor_km !== '' ? parseFloat(form.motoboy_comissao_valor_km) : 0,
        motoboy_comissao_km_fallback: form.motoboy_comissao_km_fallback !== '' ? parseFloat(form.motoboy_comissao_km_fallback) : 0,
        km_incluso_frete: form.km_incluso_frete !== '' ? parseFloat(form.km_incluso_frete) : 1,
        valor_km_excedente: form.valor_km_excedente !== '' ? parseFloat(form.valor_km_excedente) : 0,
        raio_maximo_entrega_km: form.raio_maximo_entrega_km !== '' ? parseFloat(form.raio_maximo_entrega_km) : null,
        gorjeta_percentual: form.gorjeta_percentual !== '' ? parseFloat(form.gorjeta_percentual) : 0,
        taxa_cartao_percentual: form.taxa_cartao_percentual !== '' ? parseFloat(form.taxa_cartao_percentual) : 0,
        salao_modo: form.salao_modo,
        recibo_impressora_id: form.recibo_impressora_id !== '' ? Number(form.recibo_impressora_id) : null,
        sangria_acrescimo_impressora_id: form.sangria_acrescimo_impressora_id !== '' ? Number(form.sangria_acrescimo_impressora_id) : null,
        auto_atendimento_habilitado: form.auto_atendimento_habilitado,
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/config" title="Configurações de Pagamento" subtitle="Integração PagBank" />

      <main className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* Status */}
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${
              config?.configurado ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800'
            }`}>
              <Icon name={config?.configurado ? 'CheckCircle' : 'AlertCircle'} size={20}
                className={config?.configurado ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config?.configurado ? 'text-green-800 dark:text-green-400' : 'text-yellow-800 dark:text-yellow-400'}`}>
                  {config?.configurado ? 'PagBank configurado' : 'PagBank não configurado'}
                </p>
                <p className={`text-xs mt-0.5 ${config?.configurado ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {config?.configurado
                    ? `Token: ${config.pagbank_token_masked} · ${config.split_ativo ? 'Split ativo ✓' : ''} · ${config.pagbank_sandbox ? 'Sandbox' : 'Produção'}`
                    : 'Configure abaixo para receber pagamentos diretamente'
                  }
                </p>
              </div>
            </div>

            {/* Modo de pagamento — PagBank (API) ou manual (motoboy cobra na entrega) */}
            <div className="bg-white dark:bg-[#27272A] rounded-xl border p-4 flex items-start gap-3">
              <button type="button" onClick={() => setForm((f) => ({ ...f, pagamento_manual: !f.pagamento_manual }))}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${form.pagamento_manual ? 'bg-[#FF441F]' : 'bg-[#D4D4D8] dark:bg-[#3F3F46]'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.pagamento_manual ? 'left-5' : 'left-1'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">Receber pagamento manualmente</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  {form.pagamento_manual
                    ? 'Ativado: no checkout, o cliente só informa a forma de pagamento (nenhuma tela do PagBank abre). PIX usa a chave cadastrada abaixo e cartão é cobrado pelo motoboy com a maquininha na entrega — em ambos os casos, com foto do comprovante. Você também pode marcar um pedido como pago manualmente no painel.'
                    : 'Desativado: o checkout cobra automaticamente via PagBank (PIX/cartão), conforme configurado abaixo.'}
                </p>
              </div>
            </div>

            {/* Endereço estruturado — filtro geográfico da home pública */}
            <EnderecoCard geocodeFalhou={config?.geocode_falhou} />

            {/* Guia passo a passo */}
            <Guia />

            {/* Agente de impressão local — baixar, descompactar, rodar e parear impressoras */}
            {moduloSalao && <AgenteImpressaoPanel />}

            {/* Agente GDOOR local — sincroniza pedidos entregues como pré-venda fiscal.
                Módulo comprável no pacote, igual Delivery/Salão — some da tela sem ele. */}
            {moduloGdoor && (
              <>
                <GdoorAgentePanel />
                <GdoorMapeamentoPanel />
                <GdoorClientesPanel />
              </>
            )}

            {/* Formulário — limpo */}
            <div className="bg-white dark:bg-[#27272A] rounded-xl border p-6">
              <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-4">Suas credenciais</h2>

              <form onSubmit={handleSalvar} className="space-y-4">
                {/* Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
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
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Account ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    ID da conta PagBank
                    {config?.split_ativo && (
                      <span className="text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-semibold px-1.5 py-0.5 rounded ml-2">Split ativo</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.pagbank_seller_account_id}
                    onChange={(e) => setForm((f) => ({ ...f, pagbank_seller_account_id: e.target.value }))}
                    placeholder="ACCT_XXXXXXXXXXXX"
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Necessário para o repasse automático (Split Payment)</p>
                </div>

                {/* Taxa PagBank */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Chave PIX (para pagamentos na entrega)
                  </label>
                  <input
                    type="text"
                    value={form.chave_pix}
                    onChange={(e) => setForm((f) => ({ ...f, chave_pix: e.target.value }))}
                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Usada para gerar QR Code PIX quando motoboy precisar cobrar na entrega</p>
                </div>

                {/* Frete Motoboy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Frete Motoboy (taxa de entrega)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.frete_motoboy}
                      onChange={(e) => setForm((f) => ({ ...f, frete_motoboy: e.target.value }))}
                      placeholder="0,00"
                      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Valor somado ao pedido e exibido ao cliente no checkout (independente de usar motoboy ou não)</p>
                </div>

                {/* Excedente de distância */}
                <div className="border-t pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Excedente de distância
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Cobra um adicional do cliente quando a distância de entrega passar do km já incluso no frete. Deixe "Valor por KM excedente" em 0 pra manter desligado (comportamento atual).
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">KM incluso no frete</label>
                      <input type="number" min="0" step="0.1"
                        value={form.km_incluso_frete}
                        onChange={(e) => setForm((f) => ({ ...f, km_incluso_frete: e.target.value }))}
                        placeholder="1"
                        className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Valor por KM excedente</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">R$</span>
                        <input type="number" min="0" step="0.01"
                          value={form.valor_km_excedente}
                          onChange={(e) => setForm((f) => ({ ...f, valor_km_excedente: e.target.value }))}
                          placeholder="0,00"
                          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                    </div>
                  </div>
                  {parseFloat(form.valor_km_excedente || 0) > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/40 rounded-lg px-3 py-2 mt-2">
                      Exemplo: 3km de distância, {form.km_incluso_frete || '1'}km incluso → {Math.max(0, 3 - parseFloat(form.km_incluso_frete || 1)).toFixed(1)}km × R$ {parseFloat(form.valor_km_excedente).toFixed(2)} = R$ {(Math.max(0, 3 - parseFloat(form.km_incluso_frete || 1)) * parseFloat(form.valor_km_excedente)).toFixed(2)} de excedente somado ao frete.
                    </p>
                  )}
                  {parseFloat(form.valor_km_excedente || 0) > 0 && config?.geocode_falhou && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2 mt-2">
                      ⚠️ O endereço do seu estabelecimento não foi localizado — sem isso, o excedente de distância nunca é cobrado (fica sempre R$0). Confira o endereço no topo desta página.
                    </p>
                  )}

                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Raio máximo de entrega (km)</label>
                    <input type="number" min="0" step="0.1"
                      value={form.raio_maximo_entrega_km}
                      onChange={(e) => setForm((f) => ({ ...f, raio_maximo_entrega_km: e.target.value }))}
                      placeholder="Sem limite"
                      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <p className="text-xs text-gray-400 mt-1">Bloqueia o pedido se o endereço do cliente ficar mais longe do que isso. Deixe em branco pra não ter limite.</p>
                  </div>
                </div>

                {/* Como a entrega é feita */}
                <div className="border-t pt-4 mt-2">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">Usar motoboy</span>
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

                {/* Retirada no balcão — independente de usar motoboy ou não */}
                <div className="border-t pt-4 mt-2">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">Permitir retirada no balcão</span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {form.permite_retirada_balcao
                          ? 'No checkout, o cliente pode escolher retirar o pedido no estabelecimento em vez de receber em casa — sem cobrar frete'
                          : 'Desligado: cliente só pode receber o pedido via entrega'}
                      </span>
                    </span>
                    <input type="checkbox" checked={form.permite_retirada_balcao}
                      onChange={(e) => setForm((f) => ({ ...f, permite_retirada_balcao: e.target.checked }))}
                      className="w-5 h-5 accent-orange-500 flex-shrink-0" />
                  </label>
                </div>

                {/* Comissão do motoboy */}
                {form.usa_motoboy && (
                <div className="border-t pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Comissão do Motoboy
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    O motoboy sempre recebe o frete cobrado do cliente. Escolha um adicional pra somar em cima disso.
                  </p>

                  <select
                    value={form.motoboy_comissao_tipo}
                    onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_tipo: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
                  >
                    <option value="fixo">+ Valor fixo por entrega</option>
                    <option value="percentual">+ Percentual do frete</option>
                    <option value="km">+ Valor por km rodado</option>
                  </select>

                  {form.motoboy_comissao_tipo === 'fixo' && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">R$</span>
                      <input type="number" min="0" step="0.01"
                        value={form.motoboy_comissao_valor_fixo}
                        onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_valor_fixo: e.target.value }))}
                        placeholder="0,00"
                        className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  )}

                  {form.motoboy_comissao_tipo === 'percentual' && (
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.01"
                        value={form.motoboy_comissao_percentual}
                        onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_percentual: e.target.value }))}
                        placeholder="Ex: 80"
                        className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  )}

                  {form.motoboy_comissao_tipo === 'km' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">R$/km</span>
                        <input type="number" min="0" step="0.01"
                          value={form.motoboy_comissao_valor_km}
                          onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_valor_km: e.target.value }))}
                          placeholder="0,00"
                          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg pl-16 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">R$</span>
                        <input type="number" min="0" step="0.01"
                          value={form.motoboy_comissao_km_fallback}
                          onChange={(e) => setForm((f) => ({ ...f, motoboy_comissao_km_fallback: e.target.value }))}
                          placeholder="0,00"
                          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                      <p className="text-xs text-gray-400">
                        O valor de segurança é usado quando não conseguimos calcular a distância (endereço não localizado).
                        {config?.geocode_falhou && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium"> ⚠️ O endereço do seu estabelecimento não foi localizado — confira o endereço no topo desta página pra habilitar o cálculo por km.</span>
                        )}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/40 rounded-lg px-3 py-2 mt-2">
                    Exemplo: frete de R$ {form.frete_motoboy || '0,00'} {
                      form.motoboy_comissao_tipo === 'fixo' ? `+ R$ ${form.motoboy_comissao_valor_fixo || '0,00'} fixo`
                      : form.motoboy_comissao_tipo === 'percentual' ? `+ ${form.motoboy_comissao_percentual || '0'}% do frete`
                      : `+ R$ ${form.motoboy_comissao_valor_km || '0,00'} por km rodado`
                    } = total que o motoboy recebe nessa entrega.
                  </p>
                </div>
                )}

                {moduloSalao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Gorjeta sugerida (% sobre o subtotal da comanda)
                    </label>
                    <div className="relative">
                      <input
                        type="number" min="0" max="30" step="0.5"
                        value={form.gorjeta_percentual}
                        onChange={(e) => setForm((f) => ({ ...f, gorjeta_percentual: e.target.value }))}
                        placeholder="Ex: 10"
                        className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      O caixa vê esse valor sugerido ao fechar a conta (PDV do Salão) — ainda pode ajustar na hora.
                    </p>
                  </div>
                )}

                {moduloSalao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Taxa do cartão (% sobre débito e crédito)
                    </label>
                    <div className="relative">
                      <input
                        type="number" min="0" max="20" step="0.1"
                        value={form.taxa_cartao_percentual}
                        onChange={(e) => setForm((f) => ({ ...f, taxa_cartao_percentual: e.target.value }))}
                        placeholder="Ex: 3"
                        className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Acrescentada ao valor cobrado do cliente quando a comanda/mesa é fechada (ou paga
                      parcialmente) com débito ou crédito no PDV do Salão.
                    </p>
                  </div>
                )}

                {moduloSalao && <ComissoesConfig />}

                {moduloSalao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Modo de venda do Salão
                    </label>
                    <select
                      value={form.salao_modo}
                      onChange={(e) => setForm((f) => ({ ...f, salao_modo: e.target.value }))}
                      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="ambos">Mesas e comandas avulsas</option>
                      <option value="mesas">Somente mesas</option>
                      <option value="comandas">Somente comandas avulsas</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Controla o que o garçom pode abrir no portal dele.
                    </p>
                  </div>
                )}

                {moduloSalao && (
                  <div className="border-t pt-4 mt-2">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">Auto atendimento (QR da mesa)</span>
                        <span className="block text-xs text-gray-400 mt-0.5">
                          {form.auto_atendimento_habilitado
                            ? 'Cliente escaneia o QR da mesa e faz o pedido direto, sem depender do garçom'
                            : 'Desligado: só o garçom pode lançar pedido na mesa'}
                        </span>
                      </span>
                      <input type="checkbox" checked={form.auto_atendimento_habilitado}
                        onChange={(e) => setForm((f) => ({ ...f, auto_atendimento_habilitado: e.target.checked }))}
                        className="w-5 h-5 accent-orange-500 flex-shrink-0" />
                    </label>
                    {form.auto_atendimento_habilitado && form.salao_modo === 'comandas' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Só funciona com mesas — o modo de venda do Salão está em "Somente comandas avulsas", então nenhuma mesa terá QR de auto atendimento.
                      </p>
                    )}
                  </div>
                )}

                {moduloSalao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Impressora do recibo
                    </label>
                    <select
                      value={form.recibo_impressora_id}
                      onChange={(e) => setForm((f) => ({ ...f, recibo_impressora_id: e.target.value }))}
                      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Nenhuma — imprimir pelo navegador</option>
                      {impressoras.map((imp) => (
                        <option key={imp.id} value={imp.id}>{imp.nome} ({imp.setor})</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Recibo de venda (pagamento final e venda direta) sai direto nessa impressora se ela tiver o agente local pareado — senão cai no navegador.
                    </p>
                  </div>
                )}

                {moduloSalao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      Impressora de sangria/adição
                    </label>
                    <select
                      value={form.sangria_acrescimo_impressora_id}
                      onChange={(e) => setForm((f) => ({ ...f, sangria_acrescimo_impressora_id: e.target.value }))}
                      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Nenhuma — imprimir pelo navegador</option>
                      {impressoras.map((imp) => (
                        <option key={imp.id} value={imp.id}>{imp.nome} ({imp.setor})</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Toda Sangria ou Adição registrada no caixa sai um recibo nessa impressora se ela tiver o agente local pareado — senão cai no navegador.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Taxa PagBank (% sobre vendas digitais)
                  </label>
                  <div className="relative">
                    <input
                      type="number" min="0" max="30" step="0.01"
                      value={form.taxa_pagbank_percent}
                      onChange={(e) => setForm((f) => ({ ...f, taxa_pagbank_percent: e.target.value }))}
                      placeholder="Ex: 2.50"
                      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Usado para estimar desconto PagBank no painel Financeiro</p>
                </div>

                {/* Webhook — apenas informativo */}
                <div className="bg-gray-50 dark:bg-gray-950/40 border rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Icon name="Link" size={12} /> URL Webhook (gerada automaticamente)
                  </p>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">{WEBHOOK_URL}</p>
                  <p className="text-xs text-gray-400 mt-1">Cadastre esta URL em PagBank → Preferências → Notificações</p>
                </div>

                {/* Sandbox toggle */}
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, pagbank_sandbox: !f.pagbank_sandbox }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${form.pagbank_sandbox ? 'bg-[#FF441F]' : 'bg-green-500'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white dark:bg-[#27272A] rounded-full shadow transition-transform ${form.pagbank_sandbox ? 'left-1' : 'left-5'}`} />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-400">
                    {form.pagbank_sandbox ? 'Sandbox (testes — sem cobranças reais)' : 'Produção (cobranças reais)'}
                  </span>
                </div>

                {erro && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{erro}</div>
                )}
                {sucesso && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
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
