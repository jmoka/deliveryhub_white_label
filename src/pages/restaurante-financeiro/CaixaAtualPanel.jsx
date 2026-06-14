import React, { useState } from 'react';
import Icon from '../../components/AppIcon';
import { adicionarSaida, adicionarEntrada, fecharCaixa } from '../../services/restauranteService';
import FecharCaixaModal from '../restaurante-dashboard/FecharCaixaModal';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtHora = (d) => d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
const MEIO_LABELS = { dinheiro: 'Dinheiro', pix: 'PIX', transferencia: 'Transferência', cartao: 'Cartão' };
const PL = { cash: 'Dinheiro', pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito' };

const Kpi = ({ icon, label, value, sub, color = 'gray' }) => {
  const colors = {
    green: 'border-green-200 bg-green-50',
    blue:  'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    red:   'border-red-200 bg-red-50',
    gray:  'border-[#E4E4E7] bg-white',
  };
  const txt = { green: 'text-green-700', blue: 'text-blue-700', amber: 'text-amber-700', red: 'text-red-600', gray: 'text-[#18181B]' };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={13} className={txt[color]} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">{label}</p>
      </div>
      <p className={`text-xl font-black ${txt[color]}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#71717A] mt-0.5">{sub}</p>}
    </div>
  );
};

// Modal de sangria ou adição
const MovimentoModal = ({ tipo, onSalvar, onCancelar, salvando }) => {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [meio, setMeio] = useState('dinheiro');
  const isSaida = tipo === 'sangria';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-4">
          <p className="text-2xl mb-1">{isSaida ? '💸' : '💰'}</p>
          <h2 className="text-base font-bold text-[#18181B]">{isSaida ? 'Sangria (Retirada)' : 'Adição de Dinheiro'}</h2>
          <p className="text-xs text-[#71717A] mt-0.5">{isSaida ? 'Retirada de dinheiro do caixa com motivo' : 'Entrada de dinheiro no caixa'}</p>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-[#71717A] mb-1">
              {isSaida ? 'Motivo da retirada *' : 'Descrição *'}
            </label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder={isSaida ? 'Ex: Pagamento fornecedor, troco extra…' : 'Ex: Reforço de troco, fundo extra…'}
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#71717A] mb-1">Valor (R$) *</label>
            <input type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#71717A] mb-1">Meio</label>
            <select value={meio} onChange={(e) => setMeio(e.target.value)}
              className="mx-2 sm:mx-0 w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]">
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">Cancelar</button>
          <button
            onClick={() => onSalvar({ descricao: descricao.trim(), valor: parseFloat(valor) || 0, meio })}
            disabled={salvando || !descricao.trim() || !parseFloat(valor)}
            className={`flex-1 py-2.5 text-sm rounded-xl font-bold text-white disabled:opacity-50 ${isSaida ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
            {salvando ? 'Salvando...' : isSaida ? 'Registrar Sangria' : 'Registrar Adição'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CaixaAtualPanel = ({ caixa, taxaPagbank, onRefresh, pedidosAbertos = [] }) => {
  const [modal, setModal] = useState(null); // 'sangria' | 'adicao' | 'fechar' | null
  const [salvando, setSalvando] = useState(false);
  const [fechando, setFechando] = useState(false);

  if (!caixa?.aberto) return null;

  const r = caixa.resumo ?? {};
  const por = r.por_pagamento ?? {};
  const digitalTotal = Object.entries(por).filter(([k]) => k !== 'cash').reduce((s, [, v]) => s + v, 0);
  const taxaEst = taxaPagbank > 0 ? digitalTotal * (taxaPagbank / 100) : 0;
  const saidas = caixa.saidas ?? [];
  const entradas = caixa.entradas ?? [];

  const handleMovimento = async (body) => {
    setSalvando(true);
    try {
      if (modal === 'sangria') await adicionarSaida(body);
      else await adicionarEntrada(body);
      await onRefresh();
      setModal(null);
    } catch (e) { alert(e.message); }
    finally { setSalvando(false); }
  };

  const handleFechar = async (body) => {
    setFechando(true);
    try {
      await fecharCaixa(body);
      await onRefresh();
      setModal(null);
    } catch (e) {
      if (e.data?.pedidos) alert('Existem pedidos em aberto');
      else alert(e.message);
    }
    finally { setFechando(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-bold text-[#18181B]">Caixa em Operação</p>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            {caixa.nome_operador} · aberto às {fmtHora(caixa.aberto_em)} · fundo: {fmt(caixa.valor_inicial)}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('sangria')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 rounded-xl hover:bg-red-50">
            <Icon name="ArrowDownLeft" size={13} /> Sangria
          </button>
          <button onClick={() => setModal('adicao')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-green-200 text-green-700 rounded-xl hover:bg-green-50">
            <Icon name="ArrowUpRight" size={13} /> Adição
          </button>
          <button onClick={() => setModal('fechar')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-xl hover:bg-red-600">
            <Icon name="Lock" size={13} /> Fechar Caixa
          </button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Kpi icon="Banknote"   label="Espécie no caixa" value={fmt(r.especie_calculada)} color="green" sub="Dinheiro físico esperado" />
        <Kpi icon="Smartphone" label="Digital (PagBank)" value={fmt(digitalTotal)} color="blue"
          sub={taxaEst > 0 ? `Taxa est.: ${fmt(taxaEst)}` : 'Sem taxa configurada'} />
        <Kpi icon="TrendingUp" label="Total Vendas" value={fmt(r.total_vendas)} color="gray" sub={`${r.entregues ?? 0} pedidos entregues`} />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Kpi icon="Wallet"       label="Fundo Inicial (Troco)" value={fmt(caixa.valor_inicial)} color="gray" />
        <Kpi icon="ArrowUpRight" label="Adições"               value={fmt(r.total_entradas)}   color="green" sub={`${entradas.length} registros`} />
        <Kpi icon="ArrowDownLeft" label="Sangrias / Saídas"    value={fmt(r.total_saidas)}     color="red"   sub={`${saidas.length} registros`} />
      </div>

      {/* Vendas por método */}
      {Object.keys(por).length > 0 && (
        <div className="bg-[#FAFAFA] rounded-xl p-3 mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Vendas por método de pagamento</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(por).map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="text-[#71717A]">{PL[k] ?? k}: </span>
                <span className="font-bold text-[#18181B]">{fmt(v)}</span>
              </div>
            ))}
          </div>
          {taxaEst > 0 && (
            <div className="mt-2 pt-2 border-t border-[#E4E4E7] flex justify-between text-xs">
              <span className="text-[#71717A]">Estimativa desconto PagBank ({taxaPagbank}%)</span>
              <span className="font-bold text-red-500">- {fmt(taxaEst)}</span>
            </div>
          )}
        </div>
      )}

      {/* Movimentos recentes */}
      {(saidas.length > 0 || entradas.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {saidas.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Sangrias / Saídas</p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {[...saidas].reverse().map((s, i) => (
                  <div key={i} className="flex justify-between text-xs bg-red-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-[#71717A] truncate mr-2">{MEIO_LABELS[s.meio] ?? '💵'} {s.descricao}</span>
                    <span className="font-bold text-red-600 flex-shrink-0">- {fmt(s.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {entradas.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Adições</p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {[...entradas].reverse().map((e, i) => (
                  <div key={i} className="flex justify-between text-xs bg-green-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-[#71717A] truncate mr-2">{MEIO_LABELS[e.meio] ?? '💵'} {e.descricao}</span>
                    <span className="font-bold text-green-700 flex-shrink-0">+ {fmt(e.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      {(modal === 'sangria' || modal === 'adicao') && (
        <MovimentoModal tipo={modal} onSalvar={handleMovimento} onCancelar={() => setModal(null)} salvando={salvando} />
      )}
      {modal === 'fechar' && (
        <FecharCaixaModal
          resumo={caixa.resumo}
          aberto_em={caixa.aberto_em}
          valorInicial={caixa.valor_inicial}
          pedidosAbertos={pedidosAbertos}
          onConfirmar={handleFechar}
          onFecharETransferir={() => {}}
          onCancelar={() => setModal(null)}
          fechando={fechando}
        />
      )}
    </div>
  );
};

export default CaixaAtualPanel;
