import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PAYMENT_LABELS = {
  pix: 'PIX', credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito', cash: 'Dinheiro (cobrar na entrega)',
};

const STATUS_FLOW = [
  { key: 'pending',          label: 'Recebido',   icon: 'Bell' },
  { key: 'confirmed',        label: 'Confirmado', icon: 'CheckCircle' },
  { key: 'preparing',        label: 'Preparo',    icon: 'ChefHat' },
  { key: 'ready',            label: 'Pronto',     icon: 'Package' },
  { key: 'out_for_delivery', label: 'Em entrega', icon: 'Bike' },
  { key: 'delivered',        label: 'Entregue',   icon: 'CheckCircle2' },
];

const STATUS_COLORS = {
  pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed:        'bg-blue-100 text-blue-800 border-blue-200',
  preparing:        'bg-orange-100 text-orange-800 border-orange-200',
  ready:            'bg-purple-100 text-purple-800 border-purple-200',
  out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered:        'bg-green-100 text-green-800 border-green-200',
  canceled:         'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABEL = {
  pending: 'Recebido', confirmed: 'Confirmado', preparing: 'Em Preparo',
  ready: 'Pronto', out_for_delivery: 'Em entrega', delivered: 'Entregue', canceled: 'Cancelado',
};

const PROXIMOS  = { pending: 'confirmed', preparing: 'ready' };
const ANTERIORES = { confirmed: 'pending', preparing: 'confirmed', ready: 'preparing' };

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
};

const Section = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden ${className}`}>{children}</div>
);

const SectionTitle = ({ icon, label, color = 'text-[#FF441F]' }) => (
  <div className="px-4 py-3 border-b border-[#F4F4F5] flex items-center gap-2">
    <Icon name={icon} size={14} className={color} />
    <p className="text-xs font-bold text-[#71717A] uppercase tracking-wide">{label}</p>
  </div>
);

const PedidoDetalhe = ({ detalhe, onAvancar, onReimprimir, atualizando, onClose, motoboys, onAtribuir }) => {
  const [motoboyId, setMotoboyId] = useState('');
  const [atribuindo, setAtribuindo] = useState(false);

  if (!detalhe) return null;
  const { pedido, itens, cliente, motoboy } = detalhe;

  const isCanceled = pedido.status === 'canceled';
  const stepIdx = STATUS_FLOW.findIndex((s) => s.key === pedido.status);
  const proxStatus = PROXIMOS[pedido.status];
  const antStatus = ANTERIORES[pedido.status];
  const activeMotoboys = (motoboys ?? []).filter((m) => m.is_active);
  const needsMotoboy = pedido.status === 'ready' && !pedido.motoboy_id;
  const statusBadge = STATUS_COLORS[pedido.status] ?? 'bg-gray-100 text-gray-700 border-gray-200';

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

  const handleAtribuir = async () => {
    if (!motoboyId) return;
    setAtribuindo(true);
    try { await onAtribuir(pedido.id, parseInt(motoboyId, 10)); }
    finally { setAtribuindo(false); }
  };

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
          <p className="font-black text-[#18181B] text-lg">Pedido #{pedido.id}</p>
          <p className="text-xs text-[#71717A]">
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
          <button onClick={onClose} className="p-1.5 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-lg">
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      {!isCanceled && (
        <Section>
          <div className="p-4">
            <div className="flex items-center gap-1 mb-3">
              {STATUS_FLOW.map((s, i) => {
                const done = i <= stepIdx;
                const active = i === stepIdx;
                return (
                  <React.Fragment key={s.key}>
                    <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${active ? 'scale-110' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                        done ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#A1A1AA]'
                      }`}>
                        <Icon name={s.icon} size={14} />
                      </div>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-1 rounded-full transition-colors ${i < stepIdx ? 'bg-[#FF441F]' : 'bg-[#E4E4E7]'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              {STATUS_FLOW.map((s, i) => (
                <p key={s.key} className={`text-[9px] font-semibold text-center leading-tight ${
                  i === stepIdx ? 'text-[#FF441F]' : i < stepIdx ? 'text-[#18181B]' : 'text-[#A1A1AA]'
                }`} style={{ width: i < STATUS_FLOW.length - 1 ? undefined : 'auto', flex: i < STATUS_FLOW.length - 1 ? '0 0 auto' : 'none' }}>
                  {s.label}
                </p>
              ))}
            </div>
          </div>
        </Section>
      )}

      {isCanceled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">Pedido Cancelado</p>
            <p className="text-xs text-red-500">Este pedido foi cancelado e não pode ser avançado.</p>
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
                  <p className="text-base font-black text-[#18181B]">{cliente.name}</p>
                  {cliente.email && <p className="text-xs text-[#71717A]">{cliente.email}</p>}
                </div>
                {cliente.phone_e164 && (
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={`tel:${cliente.phone_e164}`}
                      className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors" title="Ligar">
                      <Icon name="Phone" size={15} className="text-blue-600" />
                    </a>
                    <a href={`https://wa.me/${cliente.phone_e164.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors" title="WhatsApp">
                      <Icon name="MessageCircle" size={15} className="text-green-600" />
                    </a>
                  </div>
                )}
              </div>

              {cliente.phone_e164 && (
                <p className="text-sm font-semibold text-[#27272A]">{cliente.phone_e164}</p>
              )}

              {enderecoCompleto ? (
                <div className="bg-[#F8F8FF] border border-blue-100 rounded-xl p-3">
                  <div className="flex items-start gap-2 mb-2.5">
                    <Icon name="MapPin" size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
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
          <SectionTitle icon="Bike" label="Rastreamento da entrega" color="text-indigo-600" />
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#18181B]">{motoboy?.name ?? 'Motoboy atribuído'}</p>
                {motoboy?.phone && <p className="text-xs text-[#71717A]">{motoboy.phone}</p>}
              </div>
              {motoboy?.phone && (
                <a href={`tel:${motoboy.phone}`}
                  className="w-9 h-9 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center hover:bg-indigo-100 transition-colors flex-shrink-0">
                  <Icon name="Phone" size={14} className="text-indigo-600" />
                </a>
              )}
            </div>

            {pedido.motoboy_lat && pedido.motoboy_lng ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <p className="text-xs font-semibold text-indigo-800">
                    GPS ativo · {timeAgo(pedido.motoboy_location_at) ?? 'agora'}
                  </p>
                </div>
                <p className="text-[10px] text-indigo-500 mb-2 font-mono">
                  {pedido.motoboy_lat.toFixed(5)}, {pedido.motoboy_lng.toFixed(5)}
                </p>
                <div className="flex gap-2">
                  <a href={mapsMotoboyUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors">
                    <Icon name="MapPin" size={12} /> Ver localização
                  </a>
                  {mapsClienteUrl && (
                    <a href={mapsClienteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-indigo-200 text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-50 transition-colors">
                      <Icon name="Route" size={12} /> Ver rota
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#F4F4F5] rounded-xl p-3 flex items-center gap-2">
                <Icon name="Signal" size={14} className="text-[#A1A1AA]" />
                <p className="text-xs text-[#71717A]">Aguardando sinal GPS do motoboy</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Ocorrência */}
      {pedido.delivery_occurrence && pedido.delivery_notes && (
        <div className={`rounded-2xl border p-4 ${
          pedido.delivery_occurrence === 'cancelada'
            ? 'bg-red-50 border-red-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <p className={`text-xs font-black flex items-center gap-1.5 mb-2 ${
            pedido.delivery_occurrence === 'cancelada' ? 'text-red-700' : 'text-orange-700'
          }`}>
            <Icon name={pedido.delivery_occurrence === 'cancelada' ? 'XCircle' : 'AlertTriangle'} size={14} />
            Ocorrência registrada: {pedido.delivery_occurrence === 'cancelada' ? 'Entrega cancelada' : 'Entrega pendente'}
          </p>
          <p className={`text-xs leading-relaxed ${
            pedido.delivery_occurrence === 'cancelada' ? 'text-red-600' : 'text-orange-600'
          }`}>{pedido.delivery_notes}</p>
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
                <p className="text-sm text-[#18181B] truncate">{item.product_name ?? `Produto #${item.product_id}`}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-[#18181B]">{fmt(item.unit_price * item.quantity)}</p>
                {item.quantity > 1 && <p className="text-[10px] text-[#71717A]">{fmt(item.unit_price)} cada</p>}
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-3 border-t border-[#E4E4E7] mt-3">
            <span className="text-sm font-bold text-[#18181B]">Total</span>
            <span className="text-lg font-black text-[#FF441F]">{fmt(pedido.total)}</span>
          </div>
        </div>
      </Section>

      {/* Pagamento */}
      <Section>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF441F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name={pedido.payment_method === 'cash' ? 'Banknote' : pedido.payment_method === 'pix' ? 'QrCode' : 'CreditCard'} size={16} className="text-[#FF441F]" />
          </div>
          <div>
            <p className="text-xs text-[#71717A] font-medium">Pagamento</p>
            <p className="text-sm font-bold text-[#18181B]">{PAYMENT_LABELS[pedido.payment_method] ?? pedido.payment_method}</p>
          </div>
          {pedido.payment_method === 'cash' && (
            <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
              Cobrar na entrega
            </span>
          )}
        </div>
      </Section>

      {/* Ações */}
      <div className="space-y-2 pb-2">
        <div className="flex gap-2">
          {antStatus && (
            <button
              disabled={atualizando === pedido.id}
              onClick={() => onAvancar(pedido, antStatus)}
              className="flex-1 py-3 bg-[#F4F4F5] text-[#27272A] text-sm font-bold rounded-2xl hover:bg-[#E4E4E7] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="ArrowLeft" size={15} />
              {STATUS_LABEL[antStatus]}
            </button>
          )}
          {proxStatus && (
            <button
              disabled={atualizando === pedido.id}
              onClick={() => onAvancar(pedido, proxStatus)}
              className={`py-3 text-white text-sm font-bold rounded-2xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg ${antStatus ? 'flex-[2]' : 'flex-1'} ${proxStatus === 'preparing' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-[#FF441F] hover:bg-[#E63A19] shadow-[#FF441F]/20'}`}
            >
              {atualizando === pedido.id ? 'Atualizando...' : (
                <>
                  <Icon name={proxStatus === 'preparing' ? 'ChefHat' : 'ArrowRight'} size={15} />
                  {proxStatus === 'preparing'
                    ? (pedido.status === 'pending' ? 'Confirmar e Enviar p/ Cozinha' : 'Enviar p/ Cozinha')
                    : `→ ${STATUS_LABEL[proxStatus]}`}
                </>
              )}
            </button>
          )}
        </div>

        {/* Reenviar p/ cozinha (reimprimir comanda) */}
        {(pedido.status === 'preparing' || pedido.status === 'confirmed') && onReimprimir && (
          <button
            onClick={() => onReimprimir(pedido)}
            className="w-full py-2.5 border border-orange-200 bg-orange-50 text-orange-700 text-sm font-bold rounded-2xl hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="Printer" size={14} />
            Enviar para a cozinha (reimprimir comanda)
          </button>
        )}

        {needsMotoboy && activeMotoboys.length > 0 && (
          <div className="space-y-2">
            <select value={motoboyId} onChange={(e) => setMotoboyId(e.target.value)}
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]">
              <option value="">Selecionar motoboy...</option>
              {activeMotoboys.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.phone ? ` · ${m.phone}` : ''}</option>
              ))}
            </select>
            <button disabled={!motoboyId || atribuindo} onClick={handleAtribuir}
              className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
              <Icon name="Bike" size={15} />
              {atribuindo ? 'Atribuindo...' : 'Enviar com motoboy'}
            </button>
          </div>
        )}

        {needsMotoboy && activeMotoboys.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Icon name="AlertTriangle" size={16} className="text-orange-500 flex-shrink-0" />
            <p className="text-xs text-orange-700">
              Nenhum motoboy ativo. <strong>Cadastre em Motoboys</strong> para enviar para entrega.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PedidoDetalhe;
