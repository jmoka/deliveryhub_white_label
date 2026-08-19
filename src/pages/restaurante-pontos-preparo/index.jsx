import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarImpressoras, criarImpressora, atualizarImpressora, removerImpressora,
  getImpressorasDetectadas,
} from '../../services/restauranteService';
import { PONTO_PREPARO_ICONES } from '../../config/pontoPreparoIcones';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

// Cadastro focado em pontos de preparo (Cozinha, Bar, Churrasqueira, Drinks...) —
// cada um vira automaticamente uma entrada no menu lateral + tela dedicada, mesmo
// padrão das telas fixas de Cozinha/Bar (ver usePontosPreparoLinks). Por baixo é
// só uma impressora com ponto_preparo=true — a tela de Impressoras continua sendo
// o lugar pra impressoras que não geram tela (recibo, sangria/acréscimo).
const RestaurantePontosPreparo = () => {
  const navigate = useNavigate();
  const [pontos, setPontos] = useState([]);
  const [detectadas, setDetectadas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState(PONTO_PREPARO_ICONES[0]);
  const [tipoConexao, setTipoConexao] = useState('rede');
  const [endereco, setEndereco] = useState('');
  const [nomeSistema, setNomeSistema] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    listarImpressoras().then((lista) => setPontos((lista ?? []).filter((i) => i.ponto_preparo)));
    getImpressorasDetectadas().then(setDetectadas).catch(() => {});
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setNome(''); setIcone(PONTO_PREPARO_ICONES[0]); setTipoConexao('rede'); setEndereco(''); setNomeSistema('');
    setErro(null);
    setMostrarForm(true);
  };

  const abrirEdicao = (ponto) => {
    setEditando(ponto);
    setNome(ponto.nome); setIcone(ponto.icone || PONTO_PREPARO_ICONES[0]);
    setTipoConexao(ponto.tipo_conexao); setEndereco(ponto.endereco ?? ''); setNomeSistema(ponto.nome_sistema ?? '');
    setErro(null);
    setMostrarForm(true);
  };

  const salvar = async (e) => {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const body = {
        nome: nome.trim(),
        // setor não tem mais papel de filtro pra ponto de preparo (a tela usa o
        // id da impressora direto) — mantido só porque a coluna é obrigatória.
        setor: nome.trim(),
        tipo_conexao: tipoConexao,
        endereco: endereco || undefined,
        nome_sistema: nomeSistema || undefined,
        ponto_preparo: true,
        icone,
      };
      if (editando) await atualizarImpressora(editando.id, body);
      else await criarImpressora(body);
      setMostrarForm(false);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (ponto) => {
    await atualizarImpressora(ponto.id, { ativo: !ponto.ativo });
    carregar();
  };

  const remover = async (ponto) => {
    if (!window.confirm(`Remover o ponto de preparo "${ponto.nome}"? Produtos vinculados a ele deixam de imprimir/aparecer numa tela.`)) return;
    await removerImpressora(ponto.id);
    carregar();
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/pontos-preparo" title="Pontos de Preparo" onRefresh={carregar} />
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-4">
          Cada ponto de preparo cadastrado aqui (Cozinha, Bar, Churrasqueira, Drinks...) ganha automaticamente
          sua própria tela — no mesmo padrão das telas de Cozinha e Bar — e uma entrada no menu lateral.
          Vincule os produtos ao ponto de preparo certo na tela de Produtos, campo "Impressora / setor".
        </p>

        <button onClick={abrirNovo}
          className="mb-4 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] flex items-center gap-2">
          <Icon name="Plus" size={16} /> Novo ponto de preparo
        </button>

        {mostrarForm && (
          <form onSubmit={salvar} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4 space-y-3">
            <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{editando ? 'Editar ponto de preparo' : 'Novo ponto de preparo'}</p>
            <div>
              <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Churrasqueira"
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-1 block">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {PONTO_PREPARO_ICONES.map((ic) => (
                  <button key={ic} type="button" onClick={() => setIcone(ic)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                      icone === ic ? 'border-[#FF441F] bg-[#FF441F]/10 text-[#FF441F]' : 'border-[#E4E4E7] dark:border-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'
                    }`}>
                    <Icon name={ic} size={18} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Conexão da impressora</label>
                <select value={tipoConexao} onChange={(e) => setTipoConexao(e.target.value)}
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm">
                  <option value="rede">Rede</option>
                  <option value="local">Local (USB)</option>
                </select>
              </div>
              {detectadas.length > 0 ? (
                <div>
                  <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Impressora detectada pelo agente</label>
                  <select value={nomeSistema} onChange={(e) => setNomeSistema(e.target.value)}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm">
                    <option value="">Nenhuma (manual/rede)</option>
                    {detectadas.map((d) => (
                      <option key={d.id} value={d.nome_sistema}>{d.nome_sistema}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Endereço (IP ou nome, opcional)</label>
                  <input value={endereco} onChange={(e) => setEndereco(e.target.value)}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
                </div>
              )}
            </div>
            {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setMostrarForm(false)}
                className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA]">
                Cancelar
              </button>
              <button type="submit" disabled={salvando}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pontos.map((ponto) => (
            <div key={ponto.id} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FF441F]/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={ponto.icone || 'ChefHat'} size={18} className="text-[#FF441F]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">{ponto.nome}</p>
                    {ponto.nome_sistema
                      ? <p className="text-xs text-emerald-700 dark:text-emerald-400 truncate">🖨 {ponto.nome_sistema} (agente)</p>
                      : ponto.endereco
                        ? <p className="text-xs text-[#A1A1AA] truncate">{ponto.endereco}</p>
                        : <p className="text-xs text-[#A1A1AA]">Sem impressora vinculada — cai no navegador</p>}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium flex-shrink-0 ${ponto.ativo ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400'}`}>
                  {ponto.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate(`/restaurante/ponto-preparo/${ponto.id}`)}
                  className="flex-1 py-1.5 text-xs font-bold border border-[#FF441F] text-[#FF441F] rounded-lg hover:bg-[#FF441F]/5">
                  Abrir tela
                </button>
                <button onClick={() => abrirEdicao(ponto)}
                  className="flex-1 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                  Editar
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => toggleAtivo(ponto)} className="flex-1 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                  {ponto.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => remover(ponto)} className="flex-1 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40">
                  Remover
                </button>
              </div>
            </div>
          ))}
          {pontos.length === 0 && !mostrarForm && (
            <p className="text-sm text-[#A1A1AA] col-span-full">Nenhum ponto de preparo cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantePontosPreparo;
