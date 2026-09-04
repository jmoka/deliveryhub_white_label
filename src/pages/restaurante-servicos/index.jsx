import React, { useState, useEffect } from 'react';
import {
  getMeusServicos, criarServico, editarServico, deletarServico, toggleServico,
  getSolicitacoesServico, marcarSolicitacaoServicoContatada,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import ImageUpload from '../../components/ui/ImageUpload';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const EMPTY_FORM = { name: '', description: '', image_url: '', categoria: '', preco_min: '', preco_max: '' };

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const faixaPreco = (min, max) => {
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `A partir de ${fmt(min)}`;
  return 'Sob consulta';
};

const soDigitos = (v) => String(v ?? '').replace(/\D/g, '');

const RestauranteServicos = () => {
  const [aba, setAba] = useState('meus');

  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState(null);
  const [deletando, setDeletando] = useState(null);

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loadingSolic, setLoadingSolic] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [marcandoId, setMarcandoId] = useState(null);

  const carregarServicos = () => {
    setLoading(true);
    getMeusServicos()
      .then((r) => setServicos(r.servicos ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  const carregarSolicitacoes = () => {
    setLoadingSolic(true);
    getSolicitacoesServico(filtroStatus || undefined)
      .then((r) => setSolicitacoes(r.solicitacoes ?? []))
      .catch(() => {})
      .finally(() => setLoadingSolic(false));
  };

  useEffect(() => { carregarServicos(); }, []);
  useEffect(() => { carregarSolicitacoes(); }, [filtroStatus]);

  const abrirNovo = () => { setEditando(null); setForm(EMPTY_FORM); setErroForm(null); setShowModal(true); };
  const abrirEditar = (s) => {
    setEditando(s);
    setForm({
      name: s.name ?? '', description: s.description ?? '', image_url: s.image_url ?? '',
      categoria: s.categoria ?? '', preco_min: s.preco_min ?? '', preco_max: s.preco_max ?? '',
    });
    setErroForm(null);
    setShowModal(true);
  };
  const fecharModal = () => setShowModal(false);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErroForm(null);
    if (!form.name.trim()) { setErroForm('Informe o nome do serviço'); return; }
    const precoMin = form.preco_min !== '' ? Number(form.preco_min) : undefined;
    const precoMax = form.preco_max !== '' ? Number(form.preco_max) : undefined;
    if (precoMin != null && precoMax != null && precoMin > precoMax) {
      setErroForm('Preço mínimo não pode ser maior que o máximo');
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        image_url: form.image_url || undefined,
        categoria: form.categoria || undefined,
        preco_min: precoMin,
        preco_max: precoMax,
      };
      if (editando) await editarServico(editando.id, payload);
      else await criarServico(payload);
      setShowModal(false);
      carregarServicos();
    } catch (e) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id) => {
    if (!window.confirm('Excluir este serviço?')) return;
    setDeletando(id);
    try {
      await deletarServico(id);
      carregarServicos();
    } catch (e) {
      setErro(e.message);
    } finally {
      setDeletando(null);
    }
  };

  const handleToggle = async (s) => {
    try {
      await toggleServico(s.id, !s.is_active);
      carregarServicos();
    } catch (e) {
      setErro(e.message);
    }
  };

  const handleMarcarContatado = async (id) => {
    setMarcandoId(id);
    try {
      await marcarSolicitacaoServicoContatada(id);
      carregarSolicitacoes();
    } catch (e) {
      setErro(e.message);
    } finally {
      setMarcandoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/servicos" title="Serviços" />

      <main className="p-6 mx-auto max-w-4xl">
        {erro && <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{erro}</p>}

        <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#27272A] p-1 rounded-xl w-fit mb-5">
          {[['meus', 'Meus Serviços'], ['solicitacoes', 'Solicitações']].map(([k, l]) => (
            <button key={k} onClick={() => setAba(k)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                aba === k ? 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA]'
              }`}>
              {l}
            </button>
          ))}
        </div>

        {aba === 'meus' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={abrirNovo}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
                <Icon name="Plus" size={16} /> Novo Serviço
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Carregando...</p>
            ) : servicos.length === 0 ? (
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Nenhum serviço cadastrado ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {servicos.map((s) => (
                  <div key={s.id} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
                    {s.image_url && <img src={s.image_url} alt="" className="w-full h-32 object-cover" />}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[#18181B] dark:text-[#F4F4F5]">{s.name}</h3>
                        {!s.is_active && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex-shrink-0">Inativo</span>
                        )}
                      </div>
                      {s.categoria && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{s.categoria}</p>}
                      {s.description && <p className="text-sm text-[#52525B] dark:text-[#D4D4D8] mt-2 line-clamp-2">{s.description}</p>}
                      <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] mt-2">{faixaPreco(s.preco_min, s.preco_max)}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => abrirEditar(s)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                          Editar
                        </button>
                        <button onClick={() => handleToggle(s)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                          {s.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => handleDeletar(s.id)} disabled={deletando === s.id}
                          className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50">
                          {deletando === s.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {aba === 'solicitacoes' && (
          <>
            <div className="flex gap-2 mb-4">
              {[['pendente', 'Pendentes'], ['contatado', 'Contatadas'], ['', 'Todas']].map(([k, l]) => (
                <button key={k} onClick={() => setFiltroStatus(k)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                    filtroStatus === k ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#27272A] dark:text-[#F4F4F5]'
                  }`}>
                  {l}
                </button>
              ))}
            </div>

            {loadingSolic ? (
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Carregando...</p>
            ) : solicitacoes.length === 0 ? (
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Nenhuma solicitação por aqui.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {solicitacoes.map((s) => (
                  <div key={s.id} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-[#18181B] dark:text-[#F4F4F5]">{s.nome_cliente}</p>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{s.servico_nome}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        s.status === 'pendente' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                      }`}>
                        {s.status === 'pendente' ? 'Pendente' : 'Contatado'}
                      </span>
                    </div>
                    {s.mensagem && <p className="text-sm text-[#52525B] dark:text-[#D4D4D8] mt-2">{s.mensagem}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <a href={`tel:${s.telefone_cliente}`}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] flex items-center gap-1">
                        <Icon name="Phone" size={12} /> {s.telefone_cliente}
                      </a>
                      <a href={`https://wa.me/55${soDigitos(s.telefone_cliente)}`} target="_blank" rel="noreferrer"
                        className="text-xs px-2.5 py-1 rounded-lg border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 flex items-center gap-1">
                        <Icon name="MessageCircle" size={12} /> WhatsApp
                      </a>
                      {s.status === 'pendente' && (
                        <button onClick={() => handleMarcarContatado(s.id)} disabled={marcandoId === s.id}
                          className="text-xs px-2.5 py-1 rounded-lg bg-[#FF441F] text-white hover:bg-[#E63A19] disabled:opacity-50 ml-auto">
                          {marcandoId === s.id ? '...' : 'Marcar como contatado'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-md md:max-w-[85%] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">
                {editando ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button type="button" onClick={fecharModal} className="text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
                <Icon name="X" size={20} />
              </button>
            </div>
            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="Nome do serviço"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Descrição opcional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Categoria</label>
                <input
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Elétrica, Reforma, Beleza..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Preço mínimo</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.preco_min}
                    onChange={(e) => setForm((f) => ({ ...f, preco_min: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Preço máximo</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.preco_max}
                    onChange={(e) => setForm((f) => ({ ...f, preco_max: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Imagem do serviço</label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  folder="servicos"
                  aspect="square"
                />
              </div>

              {erroForm && <p className="text-sm text-red-600 dark:text-red-400">{erroForm}</p>}

              <button type="submit" disabled={salvando}
                className="w-full px-4 py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestauranteServicos;
