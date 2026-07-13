import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMe, getMeusPedidos, atualizarLocalizacao, confirmarEntrega, registrarOcorrencia,
  getPedidosDisponiveis, pegarPedido,
  getEstabelecimentosDisponiveis, solicitarAfiliacao, getMinhasAfiliacoes,
  getGanhosResumo, getGanhosHistorico,
} from '../../services/motoboyService';
import { login, completarCadastro, arquivoParaBase64, getMotoboyToken, setMotoboyToken, clearMotoboyToken } from '../../services/motoboyAuthService';
import ColetaBarcode from './ColetaBarcode';
import EntregaBarcode from './EntregaBarcode';
import Icon from '../../components/AppIcon';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const OcorrenciaModal = ({ pedido, tipo, onConfirmar, onFechar, salvando }) => {
  const [motivo, setMotivo] = useState('');
  const isPendente = tipo === 'pendente';
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isPendente ? 'bg-orange-100' : 'bg-red-100'}`}>
            <Icon name={isPendente ? 'Clock' : 'XCircle'} size={20} className={isPendente ? 'text-orange-600' : 'text-red-600'} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#18181B]">
              {isPendente ? 'Entrega Pendente' : 'Cancelar Entrega'}
            </h2>
            <p className="text-xs text-[#71717A]">Pedido #{pedido.id}</p>
          </div>
        </div>

        <p className="text-xs text-[#71717A] mb-2">
          {isPendente
            ? 'Descreva o motivo da pendência (ex: cliente ausente, endereço incorreto):'
            : 'Descreva o motivo do cancelamento com detalhes:'}
        </p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={4}
          placeholder={isPendente
            ? 'Ex: Cliente não atendeu o interfone. Aguardando retorno do restaurante...'
            : 'Ex: Endereço não encontrado após 3 tentativas. CEP diverge do cadastro...'}
          className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F] resize-none"
        />

        {isPendente && (
          <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-2">
            Pedido permanece "Em entrega". Restaurante será notificado da ocorrência.
          </p>
        )}
        {!isPendente && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
            Pedido será cancelado. Registre o máximo de detalhes para auditoria.
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={onFechar}
            className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">
            Voltar
          </button>
          <button
            onClick={() => onConfirmar(motivo)}
            disabled={salvando || motivo.trim().length < 10}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-50 transition-colors ${
              isPendente ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {salvando ? 'Registrando...' : 'Confirmar'}
          </button>
        </div>
        <p className="text-[10px] text-[#A1A1AA] text-center mt-2">Mínimo 10 caracteres</p>
      </div>
    </div>
  );
};

const STATUS_LABEL = {
  confirmed: 'Confirmado',
  preparing: 'Em preparo',
  ready: 'Pronto p/ entrega',
  motoboy_collecting: 'Indo buscar',
  out_for_delivery: 'Saiu p/ entrega',
};

const MotoboyLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const { token } = await login(identificador.trim(), password);
      setMotoboyToken(token);
      onLogin();
    } catch (err) {
      setErro(err.message ?? 'Telefone/e-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 w-full max-w-sm shadow-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#FF441F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="Bike" size={28} className="text-[#FF441F]" />
          </div>
          <h1 className="text-lg font-black text-[#18181B]">Portal do Entregador</h1>
          <p className="text-sm text-[#71717A] mt-1">Entre com seu telefone/e-mail e senha</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder="Telefone ou e-mail"
            required
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#FF441F]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            required
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#FF441F]"
          />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#FF441F] text-white font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 text-sm">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <button type="button" onClick={() => navigate('/motoboy/cadastro')}
            className="w-full py-2.5 text-sm text-[#71717A] hover:text-[#27272A]">
            Ainda não tenho cadastro
          </button>
        </form>
      </div>
    </div>
  );
};

const CAMPOS_ARQUIVO_COMPLETAR = [
  { name: 'foto_perfil', label: 'Foto de perfil', icon: 'User' },
  { name: 'documento_frente', label: 'Documento com foto', icon: 'IdCard' },
  { name: 'comprovante_endereco', label: 'Comprovante de endereço', icon: 'FileText' },
];

// Motoboys cadastrados antes do login por senha (link antigo do restaurante) completam aqui.
const CompletarCadastro = ({ nomeAtual, onCompletar }) => {
  const [form, setForm] = useState({ name: nomeAtual ?? '', phone: '', email: '', password: '' });
  const [arquivos, setArquivos] = useState({});
  const [previews, setPreviews] = useState({});
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleArquivo = async (campo, file) => {
    if (!file) return;
    const base64 = await arquivoParaBase64(file);
    setArquivos((a) => ({ ...a, [campo]: base64 }));
    setPreviews((p) => ({ ...p, [campo]: file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    for (const campo of CAMPOS_ARQUIVO_COMPLETAR) {
      if (!arquivos[campo.name]) { setErro(`Envie: ${campo.label}`); return; }
    }
    setEnviando(true);
    try {
      const { token } = await completarCadastro({ ...form, ...arquivos });
      setMotoboyToken(token);
      onCompletar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 w-full max-w-sm shadow-lg my-8">
        <div className="text-center mb-6">
          <Icon name="ShieldAlert" size={28} className="text-[#FF441F] mx-auto mb-2" />
          <h1 className="text-lg font-black text-[#18181B]">Complete seu cadastro</h1>
          <p className="text-sm text-[#71717A] mt-1">Defina uma senha e envie seus documentos pra continuar usando o app</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome completo"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Telefone"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="E-mail"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input required type="password" minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Crie uma senha"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          <div className="space-y-2.5 pt-1">
            {CAMPOS_ARQUIVO_COMPLETAR.map((campo) => (
              <label key={campo.name} className="flex items-center gap-3 border border-dashed border-[#E4E4E7] rounded-xl px-3 py-2.5 cursor-pointer hover:border-[#FF441F]/50">
                <Icon name={previews[campo.name] ? 'CheckCircle2' : campo.icon} size={18} className={previews[campo.name] ? 'text-green-600' : 'text-[#71717A]'} />
                <span className="flex-1 text-sm text-[#27272A] truncate">{previews[campo.name] ?? campo.label}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleArquivo(campo.name, e.target.files?.[0])} />
              </label>
            ))}
          </div>
          {erro && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
          <button type="submit" disabled={enviando}
            className="w-full py-3 bg-[#FF441F] text-white font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 text-sm mt-2">
            {enviando ? 'Enviando...' : 'Concluir cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
};

const STATUS_AFILIACAO_LABEL = {
  pendente: { label: 'Solicitação enviada', color: 'bg-yellow-100 text-yellow-700' },
  aceito: { label: 'Você atende aqui', color: 'bg-green-100 text-green-700' },
  recusado: { label: 'Recusado', color: 'bg-red-100 text-red-700' },
};

const AbaEstabelecimentos = ({ afiliacoes, recarregarAfiliacoes }) => {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [solicitando, setSolicitando] = useState(null);

  const buscar = useCallback(async (termo) => {
    setBuscando(true);
    try {
      const d = await getEstabelecimentosDisponiveis(termo);
      setResultados(d.estabelecimentos ?? []);
    } catch {} finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => { buscar(''); }, [buscar]);

  const handleSolicitar = async (restaurantId) => {
    setSolicitando(restaurantId);
    try {
      await solicitarAfiliacao(restaurantId);
      await buscar(busca);
      await recarregarAfiliacoes();
    } catch (e) {
      alert(e.message);
    } finally {
      setSolicitando(null);
    }
  };

  return (
    <div className="space-y-4">
      {afiliacoes.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#71717A] uppercase mb-2">Meus estabelecimentos</p>
          <div className="space-y-2">
            {afiliacoes.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-[#E4E4E7] p-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#18181B]">{a.restaurant?.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_AFILIACAO_LABEL[a.status]?.color}`}>
                  {STATUS_AFILIACAO_LABEL[a.status]?.label ?? a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-[#71717A] uppercase mb-2">Buscar estabelecimentos</p>
        <div className="flex items-center gap-2 bg-white border border-[#E4E4E7] rounded-xl px-3 py-2 mb-3">
          <Icon name="Search" size={15} className="text-[#71717A]" />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); buscar(e.target.value); }}
            placeholder="Nome do estabelecimento..."
            className="flex-1 text-sm outline-none bg-transparent" />
        </div>
        {buscando ? (
          <p className="text-xs text-[#A1A1AA] text-center py-4">Buscando...</p>
        ) : (
          <div className="space-y-2">
            {resultados.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-[#E4E4E7] p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#18181B] truncate">{r.name}</p>
                  {r.address && <p className="text-xs text-[#71717A] truncate">{r.address}</p>}
                </div>
                {r.status_afiliacao ? (
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_AFILIACAO_LABEL[r.status_afiliacao]?.color}`}>
                    {STATUS_AFILIACAO_LABEL[r.status_afiliacao]?.label ?? r.status_afiliacao}
                  </span>
                ) : (
                  <button onClick={() => handleSolicitar(r.id)} disabled={solicitando === r.id}
                    className="flex-shrink-0 px-3 py-1.5 bg-[#FF441F] text-white text-xs font-bold rounded-lg hover:bg-[#E63A19] disabled:opacity-50">
                    {solicitando === r.id ? '...' : 'Solicitar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AbaGanhos = () => {
  const [resumo, setResumo] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getGanhosResumo(), getGanhosHistorico()])
      .then(([r, h]) => { setResumo(r); setHistorico(h.historico ?? []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-xs text-[#A1A1AA] text-center py-8">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[#FF441F] to-[#FF7A00] rounded-2xl p-5 text-white">
        <p className="text-xs text-white/80">Total ganho</p>
        <p className="text-2xl font-black">{fmt(resumo?.total_geral)}</p>
      </div>

      <div>
        <p className="text-xs font-bold text-[#71717A] uppercase mb-2">Por estabelecimento</p>
        <div className="space-y-2">
          {(resumo?.resumo ?? []).map((r) => (
            <div key={r.restaurant_id} className="bg-white rounded-xl border border-[#E4E4E7] p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#18181B]">{r.nome}</p>
                <p className="text-xs text-[#71717A]">{r.entregas} entrega(s)</p>
              </div>
              <p className="text-sm font-black text-[#FF441F]">{fmt(r.total)}</p>
            </div>
          ))}
          {(resumo?.resumo ?? []).length === 0 && (
            <p className="text-xs text-[#A1A1AA] text-center py-4">Nenhuma entrega concluída ainda</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-[#71717A] uppercase mb-2">Histórico de entregas</p>
        <div className="space-y-2">
          {historico.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-[#E4E4E7] p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#18181B]">Pedido #{h.pedido_id} · {h.restaurant?.name}</p>
                <p className="text-[10px] text-[#A1A1AA]">
                  {new Date(h.criado_em).toLocaleDateString('pt-BR')} · {h.tipo}
                  {h.distancia_km != null && ` · ${h.distancia_km} km`}
                </p>
                <p className="text-[10px] text-[#A1A1AA]">
                  Frete {fmt(h.frete_repassado)} + adicional {fmt(h.valor_base ?? h.comissao_valor - h.frete_repassado)}
                </p>
              </div>
              <p className="text-sm font-bold text-green-600">{fmt(h.comissao_valor)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MotoboyPortal = () => {
  const [authed, setAuthed] = useState(!!getMotoboyToken());
  const [me, setMe] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('pedidos');
  const [afiliacoes, setAfiliacoes] = useState([]);
  const [estabelecimentoAtivo, setEstabelecimentoAtivo] = useState(null);
  const [disponiveis, setDisponiveis] = useState([]);
  const [pegando, setPegando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [ocorrencia, setOcorrencia] = useState(null); // { pedido, tipo }
  const [salvandoOcorrencia, setSalvandoOcorrencia] = useState(false);
  const [gpsAtivo, setGpsAtivo] = useState(false);
  const [gpsErro, setGpsErro] = useState(null);
  const gpsRef = useRef(null);
  const prevDisponiveisCount = useRef(0);
  const tocarSom = useNotificacaoSonora('motoboy');

  const carregarAfiliacoes = useCallback(async () => {
    try {
      const d = await getMinhasAfiliacoes();
      const lista = d.afiliacoes ?? [];
      setAfiliacoes(lista);
      const aceitos = lista.filter((a) => a.status === 'aceito');
      setEstabelecimentoAtivo((atual) => atual ?? aceitos[0]?.restaurant?.id ?? null);
    } catch {}
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      const [infoData, pedidosData] = await Promise.all([getMe(), getMeusPedidos()]);
      setMe(infoData);
      setPedidos(pedidosData.pedidos ?? []);
    } catch (e) {
      if (e.message.includes('inválido') || e.message.includes('expirada') || e.message.includes('desativada')) {
        clearMotoboyToken();
        setAuthed(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle URL token on first load (link legado de restaurante — vira modo "completar cadastro")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setMotoboyToken(urlToken);
      window.history.replaceState({}, '', '/motoboy');
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    carregarDados();
    carregarAfiliacoes();
    const interval = setInterval(() => { carregarDados(); carregarAfiliacoes(); }, 30000);
    return () => clearInterval(interval);
  }, [authed, carregarDados, carregarAfiliacoes]);

  useEffect(() => {
    if (!authed || !estabelecimentoAtivo) return;
    const carregarDisponiveis = async () => {
      try {
        const d = await getPedidosDisponiveis(estabelecimentoAtivo);
        const novos = d.pedidos ?? [];
        if (novos.length > prevDisponiveisCount.current) tocarSom();
        prevDisponiveisCount.current = novos.length;
        setDisponiveis(novos);
      } catch {}
    };
    carregarDisponiveis();
    const id = setInterval(carregarDisponiveis, 10000);
    return () => clearInterval(id);
  }, [authed, estabelecimentoAtivo, tocarSom]);

  // GPS loop
  useEffect(() => {
    if (!gpsAtivo || pedidos.length === 0) {
      if (gpsRef.current) { clearInterval(gpsRef.current); gpsRef.current = null; }
      return;
    }
    const enviarGps = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pedidos.forEach((p) =>
            atualizarLocalizacao(p.id, pos.coords.latitude, pos.coords.longitude).catch(() => {})
          );
          setGpsErro(null);
        },
        () => setGpsErro('Permissão de GPS negada'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
    enviarGps();
    gpsRef.current = setInterval(enviarGps, 30000);
    return () => clearInterval(gpsRef.current);
  }, [gpsAtivo, pedidos]);

  const handleEntregar = async (pedidoId) => {
    setConfirmando(pedidoId);
    try {
      await confirmarEntrega(pedidoId);
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    } catch (e) {
      alert(e.message);
    } finally {
      setConfirmando(null);
    }
  };

  const handleOcorrencia = async (motivo) => {
    if (!ocorrencia) return;
    setSalvandoOcorrencia(true);
    try {
      await registrarOcorrencia(ocorrencia.pedido.id, ocorrencia.tipo, motivo);
      if (ocorrencia.tipo === 'cancelada') {
        setPedidos((prev) => prev.filter((p) => p.id !== ocorrencia.pedido.id));
      } else {
        setPedidos((prev) => prev.map((p) =>
          p.id === ocorrencia.pedido.id
            ? { ...p, delivery_occurrence: 'pendente', delivery_notes: motivo }
            : p
        ));
      }
      setOcorrencia(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvandoOcorrencia(false);
    }
  };

  const handlePegar = async (pedidoId) => {
    setPegando(pedidoId);
    try {
      await pegarPedido(pedidoId);
      await carregarDados();
    } catch (e) {
      alert(e.message);
      await carregarDados();
    } finally {
      setPegando(null);
    }
  };

  const handleSair = () => {
    clearMotoboyToken();
    setAuthed(false);
  };

  if (!authed) return <MotoboyLogin onLogin={() => { setAuthed(true); setLoading(true); }} />;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (me?.precisa_completar_cadastro) {
    return <CompletarCadastro nomeAtual={me?.name} onCompletar={() => carregarDados()} />;
  }

  const aceitos = afiliacoes.filter((a) => a.status === 'aceito');

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <header className="bg-white border-b border-[#E4E4E7] px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-base font-black text-[#18181B]">
              <Icon name="Bike" size={16} className="inline mr-1.5 text-[#FF441F]" />
              {me?.name ?? 'Motoboy'}
            </h1>
            <p className="text-xs text-[#71717A]">{pedidos.length} pedido(s) em aberto</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGpsAtivo((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                gpsAtivo ? 'bg-green-500 text-white' : 'bg-[#F4F4F5] text-[#27272A]'
              }`}
            >
              <Icon name="MapPin" size={12} />
              {gpsAtivo ? 'GPS ON' : 'GPS OFF'}
            </button>
            <button onClick={handleSair} className="p-2 text-[#71717A] hover:text-red-500">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
        {gpsErro && <p className="text-xs text-red-500 text-center mt-1">{gpsErro}</p>}

        {/* Abas */}
        <div className="flex gap-1 max-w-lg mx-auto mt-3 bg-[#F4F4F5] rounded-xl p-1">
          {[
            { id: 'pedidos', label: 'Pedidos', icon: 'Package' },
            { id: 'estabelecimentos', label: 'Estabelecimentos', icon: 'Store' },
            { id: 'ganhos', label: 'Ganhos', icon: 'Wallet' },
          ].map((t) => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-colors ${
                aba === t.id ? 'bg-white text-[#FF441F] shadow-sm' : 'text-[#71717A]'
              }`}>
              <Icon name={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {aba === 'estabelecimentos' && (
          <AbaEstabelecimentos afiliacoes={afiliacoes} recarregarAfiliacoes={carregarAfiliacoes} />
        )}

        {aba === 'ganhos' && <AbaGanhos />}

        {aba === 'pedidos' && (
          <>
            {aceitos.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 text-center">
                <Icon name="Store" size={32} className="text-[#E4E4E7] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#18181B]">Você ainda não atende nenhum estabelecimento</p>
                <button onClick={() => setAba('estabelecimentos')}
                  className="mt-3 px-4 py-2 bg-[#FF441F] text-white text-xs font-bold rounded-xl hover:bg-[#E63A19]">
                  Buscar estabelecimentos
                </button>
              </div>
            )}

            {aceitos.length > 1 && (
              <div className="flex items-center gap-2 bg-white border border-[#E4E4E7] rounded-xl px-3 py-2">
                <Icon name="Store" size={14} className="text-[#71717A] flex-shrink-0" />
                <select value={estabelecimentoAtivo ?? ''} onChange={(e) => setEstabelecimentoAtivo(Number(e.target.value))}
                  className="flex-1 text-sm bg-transparent outline-none">
                  {aceitos.map((a) => (
                    <option key={a.restaurant.id} value={a.restaurant.id}>{a.restaurant.name}</option>
                  ))}
                </select>
              </div>
            )}

            {disponiveis.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF441F] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF441F]" />
                  </span>
                  <p className="text-sm font-black text-[#18181B] uppercase tracking-wide">
                    {disponiveis.length} pedido{disponiveis.length > 1 ? 's' : ''} disponível{disponiveis.length > 1 ? 'is' : ''} para entrega
                  </p>
                </div>
                {disponiveis.map((p) => {
                  const cli = p.cliente ?? {};
                  const addr = cli.address_json ?? {};
                  const endereco = [addr.logradouro, addr.numero, addr.bairro].filter(Boolean).join(', ');
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border-2 border-[#FF441F] p-4 mb-3 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-[#18181B] text-lg">Pedido #{p.id}</p>
                          {cli.name && <p className="text-sm text-[#71717A]">{cli.name}</p>}
                          {endereco && (
                            <p className="text-xs text-[#71717A] flex items-center gap-1 mt-0.5">
                              <Icon name="MapPin" size={11} className="text-[#FF441F]" />
                              {endereco}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-[#FF441F]">{fmt(p.total)}</p>
                          <p className="text-xs text-[#71717A]">{p.itens?.length ?? 0} iten(s)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePegar(p.id)}
                        disabled={pegando === p.id}
                        className="w-full py-3 bg-[#FF441F] hover:bg-[#E63A19] text-white font-black text-sm rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Icon name="Bike" size={16} />
                        {pegando === p.id ? 'Pegando...' : 'Pegar este pedido'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {pedidos.length === 0 && disponiveis.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] p-10 text-center">
                <Icon name="CheckCircle" size={40} className="mx-auto mb-3 text-green-400" />
                <p className="font-semibold text-[#18181B]">Nenhum pedido no momento</p>
                <p className="text-sm text-[#71717A] mt-1">Atualizando automaticamente</p>
              </div>
            ) : pedidos.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[#18181B]">Pedido #{p.id}</p>
                    <p className="text-xs text-[#71717A]">{p.restaurante?.name} · {STATUS_LABEL[p.status] ?? p.status}</p>
                  </div>
                  <p className="text-sm font-bold text-[#FF441F]">{fmt(p.total)}</p>
                </div>

                {(() => {
                  const cli = p.cliente ?? {};
                  const addr = cli.address_json ?? {};
                  const linhaRua = [addr.logradouro, addr.numero].filter(Boolean).join(', ');
                  const linhaCompl = [addr.complemento, addr.bairro].filter(Boolean).join(' — ');
                  const linhaCidade = [addr.cidade, addr.estado, addr.cep].filter(Boolean).join(', ');
                  const enderecoCompleto = [linhaRua, linhaCompl, linhaCidade].filter(Boolean).join(', ');
                  const mapsUrl = enderecoCompleto
                    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enderecoCompleto)}`
                    : null;
                  return (
                    <div className="border-2 border-blue-100 bg-blue-50 rounded-2xl overflow-hidden">
                      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon name="User" size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">Entregar para</p>
                          <p className="text-base font-black text-[#18181B] leading-tight truncate">
                            {cli.name ?? <span className="text-[#A1A1AA] font-normal text-sm">Nome não cadastrado</span>}
                          </p>
                        </div>
                        {cli.phone_e164 ? (
                          <a href={`tel:${cli.phone_e164}`}
                            className="flex-shrink-0 w-9 h-9 bg-white rounded-xl border border-blue-200 flex items-center justify-center hover:bg-blue-100 transition-colors">
                            <Icon name="Phone" size={16} className="text-blue-600" />
                          </a>
                        ) : (
                          <span className="flex-shrink-0 w-9 h-9 bg-[#F4F4F5] rounded-xl border border-[#E4E4E7] flex items-center justify-center opacity-40">
                            <Icon name="Phone" size={16} className="text-[#71717A]" />
                          </span>
                        )}
                      </div>

                      {cli.phone_e164 && (
                        <div className="px-4 pb-1">
                          <p className="text-xs text-blue-700 font-semibold">{cli.phone_e164}</p>
                        </div>
                      )}

                      <div className="px-4 pb-3 mt-1">
                        <div className="bg-white rounded-xl border border-blue-100 p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <Icon name="MapPin" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            {enderecoCompleto ? (
                              <div>
                                {linhaRua && <p className="text-sm font-bold text-[#18181B]">{linhaRua}</p>}
                                {linhaCompl && <p className="text-xs text-[#71717A] mt-0.5">{linhaCompl}</p>}
                                {linhaCidade && <p className="text-xs text-[#71717A]">{linhaCidade}</p>}
                                {addr.referencia && (
                                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                    <Icon name="Info" size={11} /> {addr.referencia}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-[#A1A1AA] italic">Endereço não cadastrado</p>
                            )}
                          </div>
                        </div>

                        {mapsUrl ? (
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-blue-200">
                            <Icon name="Navigation" size={16} />
                            Como chegar
                          </a>
                        ) : (
                          <div className="flex items-center justify-center gap-2 w-full py-3 bg-[#E4E4E7] text-[#A1A1AA] text-sm rounded-xl cursor-not-allowed">
                            <Icon name="Navigation" size={16} />
                            Endereço não disponível
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {p.itens?.length > 0 && (
                  <div className="border border-[#E4E4E7] rounded-xl p-3">
                    <p className="text-xs font-semibold text-[#71717A] mb-2">Itens</p>
                    <div className="space-y-1">
                      {p.itens.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-[#18181B]">
                            <span className="font-bold text-[#FF441F]">{item.quantity}×</span>{' '}
                            {item.product_name}
                          </span>
                          <span className="text-[#71717A]">{fmt(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-[#F4F4F5] text-sm font-bold text-[#18181B]">
                      <span>Total</span>
                      <span className="text-[#FF441F]">{fmt(p.total)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-[#71717A]">
                  <Icon name="CreditCard" size={12} />
                  <span>Pagamento: <strong className="text-[#18181B]">{p.payment_method === 'cash' ? 'Dinheiro' : p.payment_method}</strong></span>
                  {p.payment_method === 'cash' && (
                    <span className="ml-auto text-orange-600 font-semibold flex items-center gap-1">
                      <Icon name="Banknote" size={12} /> Cobrar na entrega
                    </span>
                  )}
                </div>

                {p.payment_method === 'cash' && p.troco_para > p.total && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                      <Icon name="Banknote" size={14} /> ATENÇÃO — TROCO
                    </p>
                    <p className="text-sm text-amber-900">
                      Pegar <strong>{fmt(p.troco_para)}</strong> do cliente · Dar <strong>{fmt(Number(p.troco_para) - Number(p.total))}</strong> de troco
                    </p>
                  </div>
                )}

                {p.delivery_occurrence === 'pendente' && p.delivery_notes && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-0.5">
                      <Icon name="Clock" size={12} /> Ocorrência registrada
                    </p>
                    <p className="text-xs text-orange-600">{p.delivery_notes}</p>
                  </div>
                )}

                {p.status === 'motoboy_collecting' ? (
                  <ColetaBarcode pedidoId={p.id} onConfirmado={carregarDados} />
                ) : p.status === 'out_for_delivery' ? (
                  <EntregaBarcode
                    pedido={p}
                    onConfirmado={carregarDados}
                    chavePix={p.restaurante?.chave_pix ?? null}
                    restauranteNome={p.restaurante?.name ?? null}
                    restauranteCidade={null}
                  />
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEntregar(p.id)}
                      disabled={confirmando === p.id}
                      className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Icon name="CheckCircle2" size={14} />
                      {confirmando === p.id ? '...' : 'Entregue'}
                    </button>
                    <button
                      onClick={() => setOcorrencia({ pedido: p, tipo: 'pendente' })}
                      className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Icon name="Clock" size={14} /> Pendente
                    </button>
                    <button
                      onClick={() => setOcorrencia({ pedido: p, tipo: 'cancelada' })}
                      className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Icon name="XCircle" size={14} /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}

            <p className="text-center text-xs text-[#A1A1AA]">Atualiza a cada 30 segundos</p>
          </>
        )}
      </main>

      {ocorrencia && (
        <OcorrenciaModal
          pedido={ocorrencia.pedido}
          tipo={ocorrencia.tipo}
          onConfirmar={handleOcorrencia}
          onFechar={() => setOcorrencia(null)}
          salvando={salvandoOcorrencia}
        />
      )}
    </div>
  );
};

export default MotoboyPortal;
