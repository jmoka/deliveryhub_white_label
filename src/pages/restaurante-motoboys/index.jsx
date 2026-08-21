import React, { useState, useEffect, useCallback } from 'react';
import {
  listarMotoboys, listarSolicitacoesMotoboy, aceitarSolicitacaoMotoboy,
  recusarSolicitacaoMotoboy, revisarSolicitacaoMotoboy, removerAfiliacaoMotoboy, forcarLogoutMotoboy,
  criarMotoboy, editarMotoboy, excluirMotoboy, bloquearMotoboy,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

// Signed URL do Supabase carrega query string (?token=...) depois do nome do arquivo —
// preciso olhar o path antes do "?" pra saber a extensão real.
const isPdfUrl = (url) => /\.pdf(\?|$)/i.test(url ?? '');

const ArquivoPreview = ({ url, alt, className }) => {
  if (isPdfUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className={`${className} flex flex-col items-center justify-center gap-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`}>
        <Icon name="FileText" size={20} />
        <span className="text-[10px] font-semibold">Ver PDF</span>
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      <img src={url} alt={alt} className="w-full h-full object-cover" />
    </a>
  );
};

const FichaModal = ({ solicitacao, onFechar, onAceitar, onRecusar, processando, somenteLeitura = false }) => {
  const [motivo, setMotivo] = useState('');
  const [mostrarRecusa, setMostrarRecusa] = useState(false);
  const mb = solicitacao.motoboy;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F4F4F5] dark:bg-[#3F3F46] flex-shrink-0">
            {mb.foto_perfil_url
              ? <ArquivoPreview url={mb.foto_perfil_url} alt={mb.name} className="block w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center"><Icon name="User" size={24} className="text-[#A1A1AA]" /></div>}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-400">{mb.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{mb.phone}</p>
            <p className="text-xs text-gray-400">{mb.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Documentos</p>
          <div className="grid grid-cols-2 gap-2">
            {mb.documento_frente_url && (
              <ArquivoPreview url={mb.documento_frente_url} alt="Documento frente"
                className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 aspect-video bg-gray-50 dark:bg-gray-950/40" />
            )}
            {mb.documento_verso_url && (
              <ArquivoPreview url={mb.documento_verso_url} alt="Documento verso"
                className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 aspect-video bg-gray-50 dark:bg-gray-950/40" />
            )}
          </div>
          {mb.comprovante_endereco_url && (
            <a href={mb.comprovante_endereco_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40">
              <Icon name="FileText" size={16} /> Ver comprovante de endereço
            </a>
          )}
        </div>

        {somenteLeitura ? (
          <button onClick={onFechar} className="w-full mt-5 py-2.5 border rounded-xl text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/40">
            Fechar
          </button>
        ) : mostrarRecusa ? (
          <div className="mt-5 space-y-2">
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
              placeholder="Motivo da recusa (opcional)"
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setMostrarRecusa(false)} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/40">
                Voltar
              </button>
              <button onClick={() => onRecusar(solicitacao.id, motivo)} disabled={processando}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                Confirmar recusa
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-5">
            <button onClick={() => setMostrarRecusa(true)} disabled={processando}
              className="flex-1 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50">
              Recusar
            </button>
            <button onClick={() => onAceitar(solicitacao.id)} disabled={processando}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {processando ? 'Aguarde...' : 'Aceitar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const MotoboyFormModal = ({ motoboy, onFechar, onSalvar, processando, erro }) => {
  const editando = !!motoboy;
  const [name, setName] = useState(motoboy?.name ?? '');
  const [phone, setPhone] = useState(motoboy?.phone ?? '');
  const [email, setEmail] = useState(motoboy?.email ?? '');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const dados = { name, phone, email };
    if (password) dados.password = password;
    onSalvar(dados);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] mb-4">
          {editando ? 'Editar motoboy' : 'Adicionar motoboy'}
        </h3>

        {erro && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-3">{erro}</p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1 block">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1 block">Telefone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 11999998888"
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1 block">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1 block">
              {editando ? 'Nova senha (deixe em branco pra manter a atual)' : 'Senha de acesso'}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres" minLength={8} required={!editando}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
            {!editando && (
              <p className="text-[11px] text-[#A1A1AA] mt-1">Compartilhe telefone/e-mail e essa senha com o motoboy — é o login dele no app.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onFechar} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/40">
            Cancelar
          </button>
          <button type="submit" disabled={processando}
            className="flex-1 py-2.5 bg-[#FF441F] text-white rounded-xl text-sm font-semibold hover:bg-[#E63A19] disabled:opacity-50">
            {processando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

const RestauranteMotoboys = () => {
  const [aba, setAba] = useState('pendentes'); // pendentes | aceitas | recusadas
  const [motoboys, setMotoboys] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [recusadas, setRecusadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [ficha, setFicha] = useState(null); // solicitacao selecionada
  const [fichaSomenteLeitura, setFichaSomenteLeitura] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [removendo, setRemovendo] = useState(null);
  const [revisando, setRevisando] = useState(null);
  const [forcandoLogout, setForcandoLogout] = useState(null);
  const [formModal, setFormModal] = useState(null); // null | 'novo' | motoboy (edição)
  const [salvandoForm, setSalvandoForm] = useState(false);
  const [erroForm, setErroForm] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [bloqueando, setBloqueando] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([listarMotoboys(), listarSolicitacoesMotoboy('pendente'), listarSolicitacoesMotoboy('recusado')])
      .then(([mbs, sols, recs]) => {
        setMotoboys(mbs.motoboys ?? []);
        setSolicitacoes(sols.solicitacoes ?? []);
        setRecusadas(recs.solicitacoes ?? []);
      })
      .catch((e) => setMsg({ tipo: 'erro', texto: e.message }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleAceitar = async (id) => {
    setProcessando(true);
    try {
      await aceitarSolicitacaoMotoboy(id);
      setFicha(null);
      setMsg({ tipo: 'ok', texto: 'Motoboy aceito!' });
      setTimeout(() => setMsg(null), 3000);
      reload();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(false);
    }
  };

  const handleRecusar = async (id, motivo) => {
    setProcessando(true);
    try {
      await recusarSolicitacaoMotoboy(id, motivo);
      setFicha(null);
      reload();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(false);
    }
  };

  const handleRevisar = async (id) => {
    setRevisando(id);
    try {
      await revisarSolicitacaoMotoboy(id);
      reload();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setRevisando(null);
    }
  };

  const handleForcarLogout = async (mb) => {
    if (!window.confirm(`Encerrar a sessão de ${mb.name} no dispositivo onde está logado, pra liberar login em outro?`)) return;
    setForcandoLogout(mb.id);
    try {
      await forcarLogoutMotoboy(mb.id);
      setMotoboys((prev) => prev.map((m) => (m.id === mb.id ? { ...m, sessao_ativa: false } : m)));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setForcandoLogout(null);
    }
  };

  const handleRemover = async (mb) => {
    if (!window.confirm(`Remover "${mb.name}" dos seus entregadores?`)) return;
    setRemovendo(mb.id);
    try {
      await removerAfiliacaoMotoboy(mb.id);
      setMotoboys((prev) => prev.filter((m) => m.id !== mb.id));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setRemovendo(null);
    }
  };

  const handleSalvarForm = async (dados) => {
    setSalvandoForm(true);
    setErroForm(null);
    try {
      if (formModal === 'novo') {
        await criarMotoboy(dados);
        setMsg({ tipo: 'ok', texto: 'Motoboy cadastrado!' });
      } else {
        await editarMotoboy(formModal.id, dados);
        setMsg({ tipo: 'ok', texto: 'Motoboy atualizado!' });
      }
      setTimeout(() => setMsg(null), 3000);
      setFormModal(null);
      reload();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvandoForm(false);
    }
  };

  const handleExcluir = async (mb) => {
    if (!window.confirm(`Excluir "${mb.name}" definitivamente? Essa ação não pode ser desfeita.`)) return;
    setExcluindo(mb.id);
    try {
      await excluirMotoboy(mb.id);
      setMotoboys((prev) => prev.filter((m) => m.id !== mb.id));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setExcluindo(null);
    }
  };

  const handleBloquear = async (mb) => {
    setBloqueando(mb.id);
    try {
      await bloquearMotoboy(mb.id, !mb.bloqueado);
      setMotoboys((prev) => prev.map((m) => (m.id === mb.id ? { ...m, bloqueado: !m.bloqueado } : m)));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setBloqueando(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5] dark:bg-[#18181B]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/motoboys" title="Motoboys" subtitle="Entregadores afiliados ao seu estabelecimento" onRefresh={reload} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {msg && (
          <div className={`text-sm rounded-xl px-4 py-3 ${
            msg.tipo === 'ok' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {msg.texto}
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-1 bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-1">
          {[
            { id: 'pendentes', label: 'Pendentes', count: solicitacoes.length },
            { id: 'aceitas', label: 'Aceitas', count: motoboys.length },
            { id: 'recusadas', label: 'Recusadas', count: recusadas.length },
          ].map((t) => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-colors ${
                aba === t.id ? 'bg-[#FF441F] text-white shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  aba === t.id ? 'bg-white/20 text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {aba === 'pendentes' && (
          <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
            {solicitacoes.length === 0 ? (
              <p className="p-5 text-sm text-[#71717A] dark:text-[#A1A1AA] text-center">Nenhuma solicitação pendente</p>
            ) : solicitacoes.map((s) => (
              <button key={s.id} onClick={() => setFicha(s)}
                className="w-full flex items-center gap-3 p-4 hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] transition-colors text-left">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F4F4F5] dark:bg-[#3F3F46] flex-shrink-0">
                  {s.motoboy.foto_perfil_url && !isPdfUrl(s.motoboy.foto_perfil_url)
                    ? <img src={s.motoboy.foto_perfil_url} alt={s.motoboy.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Icon name="User" size={16} className="text-[#A1A1AA]" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{s.motoboy.name}</p>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{s.motoboy.phone}</p>
                </div>
                <Icon name="ChevronRight" size={16} className="text-[#A1A1AA] flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {aba === 'aceitas' && (
          <div className="space-y-3">
            <button onClick={() => { setErroForm(null); setFormModal('novo'); }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-sm font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:border-[#FF441F] hover:text-[#FF441F] transition-colors">
              <Icon name="Plus" size={16} /> Adicionar motoboy
            </button>

            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
              {motoboys.length === 0 ? (
                <p className="p-5 text-sm text-[#71717A] dark:text-[#A1A1AA] text-center">
                  Nenhum motoboy afiliado ainda. Cadastre o seu próprio acima, ou aguarde um entregador se cadastrar pelo app e solicitar atender aqui.
                </p>
              ) : motoboys.map((mb) => (
                <div key={mb.id} className="p-4 flex flex-wrap items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FF441F]/10 flex-shrink-0">
                    {mb.foto_perfil_url && !isPdfUrl(mb.foto_perfil_url)
                      ? <img src={mb.foto_perfil_url} alt={mb.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Icon name="Bike" size={16} className="text-[#FF441F]" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{mb.name}</p>
                    {mb.phone && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">{mb.phone}</p>}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mb.sessao_ativa && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                          Logado em 1 dispositivo
                        </span>
                      )}
                      {mb.bloqueado && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                          Bloqueado
                        </span>
                      )}
                      {mb.gerenciado_por_mim && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                          Cadastrado por você
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {mb.gerenciado_por_mim && (
                      <button
                        onClick={() => { setErroForm(null); setFormModal(mb); }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46]"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => handleBloquear(mb)}
                      disabled={bloqueando === mb.id}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 ${
                        mb.bloqueado
                          ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/40'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                      }`}
                    >
                      {bloqueando === mb.id ? '...' : mb.bloqueado ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    {mb.sessao_ativa && (
                      <button
                        onClick={() => handleForcarLogout(mb)}
                        disabled={forcandoLogout === mb.id}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 disabled:opacity-50"
                      >
                        {forcandoLogout === mb.id ? '...' : 'Forçar logout'}
                      </button>
                    )}
                    {mb.gerenciado_por_mim ? (
                      <button
                        onClick={() => handleExcluir(mb)}
                        disabled={excluindo === mb.id}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 disabled:opacity-50"
                      >
                        {excluindo === mb.id ? '...' : 'Excluir'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemover(mb)}
                        disabled={removendo === mb.id}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 disabled:opacity-50"
                      >
                        {removendo === mb.id ? '...' : 'Remover'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === 'recusadas' && (
          <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
            {recusadas.length === 0 ? (
              <p className="p-5 text-sm text-[#71717A] dark:text-[#A1A1AA] text-center">Nenhuma solicitação recusada</p>
            ) : recusadas.map((s) => (
              <div key={s.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{s.motoboy.name}</p>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{s.motoboy.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-xs text-[#A1A1AA]">
                      {s.respondido_em && new Date(s.respondido_em).toLocaleDateString('pt-BR')}
                    </p>
                    <button
                      onClick={() => { setFicha(s); setFichaSomenteLeitura(true); }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46]"
                    >
                      Ver ficha
                    </button>
                    <button
                      onClick={() => handleRevisar(s.id)}
                      disabled={revisando === s.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/40 disabled:opacity-50"
                    >
                      {revisando === s.id ? '...' : 'Revisão'}
                    </button>
                  </div>
                </div>
                {s.motivo_recusa && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mt-2">{s.motivo_recusa}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {ficha && (
        <FichaModal
          solicitacao={ficha}
          onFechar={() => { setFicha(null); setFichaSomenteLeitura(false); }}
          onAceitar={handleAceitar}
          onRecusar={handleRecusar}
          processando={processando}
          somenteLeitura={fichaSomenteLeitura}
        />
      )}

      {formModal && (
        <MotoboyFormModal
          motoboy={formModal === 'novo' ? null : formModal}
          onFechar={() => { setFormModal(null); setErroForm(null); }}
          onSalvar={handleSalvarForm}
          processando={salvandoForm}
          erro={erroForm}
        />
      )}
    </div>
  );
};

export default RestauranteMotoboys;
