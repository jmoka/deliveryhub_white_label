import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/AppIcon';
import { printFichaMotoboy } from '../../utils/printComanda';
import { setTrocoPara, setFreteGratis, cancelarPedidoAdmin } from '../../services/restauranteService';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PAYMENT_LABELS = {
  pix: 'PIX', credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito', cash: 'Dinheiro (cobrar na entrega)',
};

const STATUS_COLORS = {
  pending:            'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  confirmed:          'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  preparing:          'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  ready:              'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  motoboy_collecting: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  out_for_delivery:   'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  delivered:          'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
  canceled:           'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
};

const STATUS_LABEL = {
  pending: 'Recebido', confirmed: 'Aguardando Preparo', preparing: 'Em Preparo',
  ready: 'Pronto', motoboy_collecting: 'Motoboy coletando',
  out_for_delivery: 'Em entrega', delivered: 'Entregue', canceled: 'Cancelado',
};

const PROXIMOS    = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'motoboy_collecting', motoboy_collecting: 'out_for_delivery', out_for_delivery: 'delivered' };
const ANTERIORES  = { confirmed: 'pending', preparing: 'confirmed', ready: 'preparing', motoboy_collecting: 'ready', out_for_delivery: 'motoboy_collecting', delivered: 'out_for_delivery' };

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
};

const Section = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden ${className}`}>{children}</div>
);

const SectionTitle = ({ icon, label, color = 'text-[#FF441F]' }) => (
  <div className="px-4 py-3 border-b border-[#F4F4F5] dark:border-[#3F3F46] flex items-center gap-2">
    <Icon name={icon} size={14} className={color} />
    <p className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">{label}</p>
  </div>
);

const PedidoDetalhe = ({
  detalhe, onAvancar, onReimprimir, atualizando, onClose, onDetalheMudou, saldoCaixa = 0,
  motoboys = [], onAtribuir, onEntregarProprio,
}) => {
  const [trocoInput, setTrocoInput] = useState('');
  const [salvandoTroco, setSalvandoTroco] = useState(false);
  const [zerrandoFrete, setZerrandoFrete] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [motoboySelecionado, setMotoboySelecionado] = useState('');
  const [atribuindo, setAtribuindo] = useState(false);
  const [entregandoProprio, setEntregandoProprio] = useState(false);

  if (!detalhe) return null;
  const { pedido, itens, cliente, motoboy } = detalhe;

  const troco = pedido.troco_para > pedido.total ? Number(pedido.troco_para) - Number(pedido.total) : 0;

  const handleFreteGratis = async () => {
    if (!confirm(`Zerar frete de ${fmt(pedido?.frete_cobrado)} neste pedido? O total será reduzido.`)) return;
    setZerrandoFrete(true);
    try { await setFreteGratis(pedido.id); onDetalheMudou?.(); }
    catch (e) { alert(e.message); }
    finally { setZerrandoFrete(false); }
  };

  const handleCancelarAdmin = async () => {
    if (!motivoCancelamento.trim()) return;
    setCancelando(true);
    try { await cancelarPedidoAdmin(pedido.id, motivoCancelamento); setMotivoCancelamento(''); setShowCancelar(false); onDetalheMudou?.(); }
    catch (e) { alert(e.message); }
    finally { setCancelando(false); }
  };

  const handleSalvarTroco = async () => {
    const val = parseFloat(trocoInput.replace(',', '.'));
    if (!val || val <= pedido.total) return;
    setSalvandoTroco(true);
    try { await setTrocoPara(pedido.id, val); setTrocoInput(''); onDetalheMudou?.(); }
    catch (e) { alert(e.message); }
    finally { setSalvandoTroco(false); }
  };

  const handleAtribuir = async () => {
    if (!motoboySelecionado) return;
    setAtribuindo(true);
    try { await onAtribuir?.(pedido.id, Number(motoboySelecionado)); onDetalheMudou?.(); }
    catch (e) { alert(e.message); }
    finally { setAtribuindo(false); }
  };

  const handleEntregarProprio = async () => {
    if (!confirm('Marcar este pedido como entregue pela própria loja (sem motoboy)?')) return;
    setEntregandoProprio(true);
    try { await onEntregarProprio?.(pedido); onDetalheMudou?.(); }
    catch (e) { alert(e.message); }
    finally { setEntregandoProprio(false); }
  };

  const isCanceled = pedido.status === 'canceled';
  const proxStatus = PROXIMOS[pedido.status];
  const antStatus  = ANTERIORES[pedido.status];
  const statusBadge = STATUS_COLORS[pedido.status] ?? 'bg-gray-100 dark:bg-gray-950/40 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';

  const addr = cliente?.address_json ?? {};
  const linhaRua = [addr.logradouro, addr.numero].filter(Boolean).join(', ');
  const linhaCompl = [addr.complemento, addr.bairro].filter(Boolean).join(' — ');
  const linhaCidade = [addr.cidade, addr.estado, addr.cep].filter(Boolean).join(', ');
  const enderecoCompleto = [linhaRua, linhaCompl, linhaCidade].filter(Boolean).join(', ');
  const mapsClienteUrl = enderecoCompleto
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enderecoCompleto)}`
    : null;
  const mapsMotoboyUrl = pedido.motoboy_lat && pedido.motoboy_lng
    ? `https://www.google.com/maps?q=${pedido.motoboy_lat},${pedido.motoboy_lng}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="flex flex-col gap-3 pr-0.5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#18181B] dark:text-[#F4F4F5] text-lg">Pedido #{pedido.id}</p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            {new Date(pedido.created_at).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })}
            {pedido.updated_at && pedido.updated_at !== pedido.created_at && (
              <span> · atualizado {timeAgo(pedido.updated_at)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusBadge}`}>
            {STATUS_LABEL[pedido.status] ?? pedido.status}
          </span>
          <button onClick={onClose} className="p-1.5 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] rounded-lg">
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {isCanceled && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Icon name="XCircle" size={20} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Pedido Cancelado</p>
            {pedido.cancel_reason ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Motivo: <strong>{pedido.cancel_reason}</strong></p>
            ) : (
              <p className="text-xs text-red-500 dark:text-red-400">Nenhum motivo informado.</p>
            )}
          </div>
        </div>
      )}

      {/* Cliente */}
      <Section>
        <SectionTitle icon="User" label="Dados do cliente" />
        <div className="p-4">
          {cliente ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-black text-[#18181B] dark:text-[#F4F4F5]">{cliente.name}</p>
                  {cliente.email && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{cliente.email}</p>}
                </div>
                {cliente.phone_e164 && (
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={`tel:${cliente.phone_e164}`}
                      className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors" title="Ligar">
                      <Icon name="Phone" size={15} className="text-blue-600 dark:text-blue-400" />
                    </a>
                    <a href={`https://wa.me/${cliente.phone_e164.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors" title="WhatsApp">
                      <Icon name="MessageCircle" size={15} className="text-green-600 dark:text-green-400" />
                    </a>
                  </div>
                )}
              </div>

              {cliente.phone_e164 && (
                <p className="text-sm font-semibold text-[#27272A] dark:text-[#F4F4F5]">{cliente.phone_e164}</p>
              )}

              {enderecoCompleto ? (
                <div className="bg-[#F8F8FF] dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl p-3">
                  <div className="flex items-start gap-2 mb-2.5">
                    <Icon name="MapPin" size={15} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      {linhaRua && <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{linhaRua}</p>}
                      {linhaCompl && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{linhaCompl}</p>}
                      {linhaCidade && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{linhaCidade}</p>}
                      {addr.referencia && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                          <Icon name="Info" size={11} /> {addr.referencia}
                        </p>
                      )}
                    </div>
                  </div>
                  {mapsClienteUrl && (
                    <a href={mapsClienteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors">
                      <Icon name="Navigation" size={13} /> Como chegar
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#A1A1AA] italic">Endereço não cadastrado</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#A1A1AA] italic">Dados do cliente não disponíveis</p>
          )}
        </div>
      </Section>

      {/* Motoboy / Rastreamento */}
      {(motoboy || pedido.motoboy_id) && (
        <Section>
          <SectionTitle icon="Bike" label="Rastreamento da entrega" color="text-indigo-600 dark:text-indigo-400" />
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{motoboy?.name ?? 'Motoboy atribuído'}</p>
                {motoboy?.phone && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{motoboy.phone}</p>}
              </div>
              {motoboy?.phone && (
                <a href={`tel:${motoboy.phone}`}
                  className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex-shrink-0">
                  <Icon name="Phone" size={14} className="text-indigo-600 dark:text-indigo-400" />
                </a>
              )}
            </div>

            {pedido.motoboy_lat && pedido.motoboy_lng ? (
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400">
                    GPS ativo · {timeAgo(pedido.motoboy_location_at) ?? 'agora'}
                  </p>
                </div>
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mb-2 font-mono">
                  {pedido.motoboy_lat.toFixed(5)}, {pedido.motoboy_lng.toFixed(5)}
                </p>
                <div className="flex gap-2">
                  <a href={mapsMotoboyUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors">
                    <Icon name="MapPin" size={12} /> Ver localização
                  </a>
                  {mapsClienteUrl && (
                    <a href={mapsClienteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-[#27272A] border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 font-bold text-xs rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors">
                      <Icon name="Route" size={12} /> Ver rota
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-xl p-3 flex items-center gap-2">
                <Icon name="Signal" size={14} className="text-[#A1A1AA]" />
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Aguardando sinal GPS do motoboy</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Sem motoboy atribuído ainda — atribuir ou entregar pela própria loja */}
      {!isCanceled && !pedido.motoboy_id && ['ready', 'out_for_delivery'].includes(pedido.status) && (
        <Section>
          <SectionTitle icon="Truck" label="Entrega" color="text-indigo-600 dark:text-indigo-400" />
          <div className="p-4 space-y-3">
            {motoboys.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={motoboySelecionado}
                  onChange={(e) => setMotoboySelecionado(e.target.value)}
                  className="flex-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-400"
                >
                  <option value="">Atribuir a um motoboy...</option>
                  {motoboys.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}{m.phone ? ` · ${m.phone}` : ''}</option>
                  ))}
                </select>
                <button
                  onClick={handleAtribuir}
                  disabled={!motoboySelecionado || atribuindo}
                  className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
                >
                  {atribuindo ? '...' : 'Atribuir'}
                </button>
              </div>
            )}
            <button
              onClick={handleEntregarProprio}
              disabled={entregandoProprio}
              className="w-full py-2.5 border-2 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-sm font-bold rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="Store" size={15} />
              {entregandoProprio ? 'Confirmando...' : 'Marcar como entregue (entrega própria)'}
            </button>
          </div>
        </Section>
      )}

      {/* Ocorrência */}
      {pedido.delivery_occurrence && pedido.delivery_notes && (
        <div className={`rounded-2xl border p-4 ${
          pedido.delivery_occurrence === 'cancelada'
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
            : 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800'
        }`}>
          <p className={`text-xs font-black flex items-center gap-1.5 mb-2 ${
            pedido.delivery_occurrence === 'cancelada' ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'
          }`}>
            <Icon name={pedido.delivery_occurrence === 'cancelada' ? 'XCircle' : 'AlertTriangle'} size={14} />
            Ocorrência registrada: {pedido.delivery_occurrence === 'cancelada' ? 'Entrega cancelada' : 'Entrega pendente'}
          </p>
          <p className={`text-xs leading-relaxed ${
            pedido.delivery_occurrence === 'cancelada' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
          }`}>{pedido.delivery_notes}</p>
        </div>
      )}

      {/* Pagamento na entrega — informado pelo motoboy */}
      {pedido.entrega_pagamento && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-3 space-y-1.5">
          <p className="text-xs font-black text-green-700 dark:text-green-400 flex items-center gap-1.5">
            <Icon name="CheckCircle2" size={13} /> Pagamento confirmado pelo motoboy
          </p>
          {pedido.entrega_pagamento.metodo === 'exato' && (
            <p className="text-sm text-green-800 dark:text-green-400">Dinheiro — valor exato <strong>{fmt(pedido.entrega_pagamento.dinheiro)}</strong></p>
          )}
          {pedido.entrega_pagamento.metodo === 'conforme' && !pedido.troco_para && (
            <p className="text-sm text-green-800 dark:text-green-400">Dinheiro — conforme pedido <strong>{fmt(pedido.entrega_pagamento.dinheiro)}</strong></p>
          )}
          {pedido.entrega_pagamento.metodo === 'conforme' && pedido.troco_para > pedido.total && (
            <p className="text-sm text-green-800 dark:text-green-400">
              Dinheiro — recebeu <strong>{fmt(pedido.entrega_pagamento.dinheiro)}</strong>, deu <strong>{fmt(Number(pedido.troco_para) - Number(pedido.total))}</strong> de troco
            </p>
          )}
          {pedido.entrega_pagamento.metodo === 'pix' && (
            <p className="text-sm text-green-800 dark:text-green-400">PIX — <strong>{fmt(pedido.entrega_pagamento.pix)}</strong></p>
          )}
          {pedido.entrega_pagamento.metodo === 'pix_parcial' && (
            <p className="text-sm text-green-800 dark:text-green-400">
              Dinheiro <strong>{fmt(pedido.entrega_pagamento.dinheiro)}</strong> + PIX <strong>{fmt(pedido.entrega_pagamento.pix)}</strong>
            </p>
          )}
        </div>
      )}

      {/* Comprovante PIX enviado pelo motoboy */}
      {pedido.comprovante_pix_url && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2">
            <Icon name="Image" size={14} className="text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Comprovante PIX</p>
          </div>
          <div className="p-3">
            <a href={pedido.comprovante_pix_url} target="_blank" rel="noopener noreferrer">
              <img
                src={pedido.comprovante_pix_url}
                alt="Comprovante PIX"
                className="w-full rounded-xl object-contain max-h-72 border border-blue-100 dark:border-blue-800"
              />
            </a>
            <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1.5 text-center">Toque para ampliar</p>
          </div>
        </div>
      )}

      {/* Itens */}
      <Section>
        <SectionTitle icon="ShoppingBag" label={`Itens do pedido (${itens.length})`} />
        <div className="p-4 space-y-2">
          {itens.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-6 h-6 bg-[#FF441F]/10 text-[#FF441F] font-black text-xs rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.quantity}
                </span>
                <p className="text-sm text-[#18181B] dark:text-[#F4F4F5] truncate">{item.product_name ?? `Produto #${item.product_id}`}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(item.unit_price * item.quantity)}</p>
                {item.quantity > 1 && <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{fmt(item.unit_price)} cada</p>}
              </div>
            </div>
          ))}
          {/* Frete motoboy */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-2">
            <div className="flex items-center gap-1.5">
              <Icon name="Truck" size={13} className="text-[#71717A] dark:text-[#A1A1AA]" />
              <span className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Frete motoboy</span>
            </div>
            <div className="flex items-center gap-2">
              {pedido.frete_cobrado > 0 ? (
                <>
                  <span className="text-sm font-medium text-[#18181B] dark:text-[#F4F4F5]">{fmt(pedido.frete_cobrado)}</span>
                  {!isCanceled && pedido.status !== 'delivered' && (
                    <button
                      onClick={handleFreteGratis}
                      disabled={zerrandoFrete}
                      title="Zerar frete para este pedido"
                      className="text-xs px-2 py-0.5 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors"
                    >
                      {zerrandoFrete ? '...' : 'Grátis'}
                    </button>
                  )}
                </>
              ) : (
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Grátis</span>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-[#E4E4E7] dark:border-[#3F3F46] mt-2">
            <span className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Total</span>
            <span className="text-lg font-black text-[#FF441F]">{fmt(pedido.total)}</span>
          </div>
          {troco > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-xl p-3 mt-1 space-y-1">
              <p className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <Icon name="Banknote" size={13} /> ATENÇÃO — TROCO
              </p>
              <p className="text-sm text-amber-900 dark:text-amber-400">
                Pegar <strong>{fmt(pedido.troco_para)}</strong> do cliente · Dar <strong>{fmt(troco)}</strong> de troco
              </p>
            </div>
          )}
          {troco > 0 && saldoCaixa < troco && (
            <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-800 rounded-xl p-3 mt-1 space-y-1">
              <p className="text-xs font-black text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <Icon name="AlertTriangle" size={13} /> SALDO INSUFICIENTE PARA TROCO
              </p>
              <p className="text-sm text-red-800 dark:text-red-400">
                Caixa tem <strong>{fmt(saldoCaixa)}</strong> · Precisa de <strong>{fmt(troco)}</strong> de troco.
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                Insira pelo menos <strong>{fmt(troco - saldoCaixa)}</strong> em dinheiro no caixa antes de enviar o motoboy.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Pagamento */}
      <Section>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF441F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name={pedido.payment_method === 'cash' ? 'Banknote' : pedido.payment_method === 'pix' ? 'QrCode' : 'CreditCard'} size={16} className="text-[#FF441F]" />
          </div>
          <div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Pagamento</p>
            <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{PAYMENT_LABELS[pedido.payment_method] ?? pedido.payment_method}</p>
          </div>
          {pedido.payment_method === 'cash' && (
            <span className="ml-auto text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-2 py-1 rounded-lg">
              Cobrar na entrega
            </span>
          )}
        </div>

        {/* Input de troco — sempre visível para pedidos cash */}
        {pedido.payment_method === 'cash' && (
          <div className="px-4 pb-3 border-t border-[#F4F4F5] dark:border-[#3F3F46] pt-3">
            <div className="space-y-2">
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">
                {troco > 0 ? 'Alterar valor que o cliente vai pagar:' : 'Cliente vai pagar com quanto? (opcional)'}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min={pedido.total + 0.01}
                  value={trocoInput}
                  onChange={(e) => setTrocoInput(e.target.value)}
                  placeholder={`Mín. ${fmt(pedido.total + 1)}`}
                  className="flex-1 min-w-0 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400 dark:focus:border-amber-400"
                />
                <button
                  onClick={handleSalvarTroco}
                  disabled={salvandoTroco || !trocoInput || parseFloat(trocoInput.replace(',', '.')) <= pedido.total}
                  className="flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
                >
                  {salvandoTroco ? '...' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Ações */}
      {!isCanceled && pedido.status !== 'delivered' && (
        <div className="space-y-2 pb-2">
          {/* Cancelamento admin */}
          {!showCancelar ? (
            <button
              onClick={() => setShowCancelar(true)}
              className="w-full py-2.5 border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Icon name="XCircle" size={14} /> Cancelar Pedido
            </button>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-2xl p-3 space-y-2">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <Icon name="AlertTriangle" size={13} /> Cancelar Pedido #{pedido.id}
              </p>
              <textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Informe o motivo do cancelamento..."
                rows={2}
                className="w-full border border-red-300 dark:border-red-800 bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCancelar(false); setMotivoCancelamento(''); }}
                  className="flex-1 py-2 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-xs font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancelarAdmin}
                  disabled={cancelando || !motivoCancelamento.trim()}
                  className="flex-[2] py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
                >
                  {cancelando ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isCanceled && pedido.status !== 'delivered' && (
        <div className="space-y-2 pb-2">
          {/* Pendente */}
          {pedido.status === 'pending' && proxStatus && (
            <button
              disabled={atualizando === pedido.id}
              onClick={() => onAvancar(pedido, proxStatus)}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-black rounded-2xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
            >
              {atualizando === pedido.id
                ? 'Confirmando...'
                : <><Icon name="ChefHat" size={16} /> Confirmar e Enviar p/ Cozinha</>}
            </button>
          )}

          {/* Ativo: impressão */}
          {['confirmed', 'preparing', 'ready', 'motoboy_collecting', 'out_for_delivery'].includes(pedido.status) && (
            <div className="flex gap-2">
              {onReimprimir && (
                <button
                  onClick={() => onReimprimir(pedido)}
                  className="flex-1 py-3 border-2 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-sm font-bold rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="Printer" size={15} />
                  Reimprimir Comanda
                </button>
              )}
              <button
                onClick={() => printFichaMotoboy(pedido, itens, cliente, null)}
                className="flex-1 py-3 border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-sm font-bold rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="Bike" size={15} />
                Imprimir Motoboy
              </button>
            </div>
          )}

          {/* Ativo: avançar / voltar status */}
          {['confirmed', 'preparing', 'ready', 'motoboy_collecting', 'out_for_delivery'].includes(pedido.status) && (
            <div className="flex gap-2">
              {antStatus && (
                <button
                  disabled={atualizando === pedido.id}
                  onClick={() => onAvancar(pedido, antStatus)}
                  className="flex-1 py-2.5 border-2 border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] text-xs font-bold rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Icon name="ChevronLeft" size={14} /> Voltar Status
                </button>
              )}
              {proxStatus && (
                <button
                  disabled={atualizando === pedido.id}
                  onClick={() => onAvancar(pedido, proxStatus)}
                  className="flex-1 py-2.5 border-2 border-[#FF441F]/30 bg-[#FF441F]/5 text-[#FF441F] text-xs font-bold rounded-2xl hover:bg-[#FF441F]/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  Avançar Status <Icon name="ChevronRight" size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PedidoDetalhe;
