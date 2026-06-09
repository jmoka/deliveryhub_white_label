import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getMe, getMeusPedidos, atualizarLocalizacao, confirmarEntrega, registrarOcorrencia,
  getPedidosDisponiveis, pegarPedido,
  getMotoboyToken, setMotoboyToken, clearMotoboyToken,
} from '../../services/motoboyService';
import ColetaBarcode from './ColetaBarcode';
import Icon from '../../components/AppIcon';

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

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_LABEL = {
  confirmed: 'Confirmado',
  preparing: 'Em preparo',
  ready: 'Pronto p/ entrega',
  motoboy_collecting: 'Indo buscar',
  out_for_delivery: 'Saiu p/ entrega',
};

const MotoboyLogin = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    setMotoboyToken(token.trim());
    try {
      await getMe();
      onLogin();
    } catch {
      clearMotoboyToken();
      setErro('Token inválido. Verifique o link recebido do restaurante.');
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
          <h1 className="text-lg font-black text-[#18181B]">Portal do Motoboy</h1>
          <p className="text-sm text-[#71717A] mt-1">Cole o token recebido do restaurante</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token de acesso..."
            required
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:border-[#FF441F]"
          />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button type="submit" disabled={loading || !token.trim()}
            className="w-full py-3 bg-[#FF441F] text-white font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 text-sm">
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

const MotoboyPortal = () => {
  const [authed, setAuthed] = useState(!!getMotoboyToken());
  const [me, setMe] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disponiveis, setDisponiveis] = useState([]);
  const [pegando, setPegando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [ocorrencia, setOcorrencia] = useState(null); // { pedido, tipo }
  const [salvandoOcorrencia, setSalvandoOcorrencia] = useState(false);
  const [gpsAtivo, setGpsAtivo] = useState(false);
  const [gpsErro, setGpsErro] = useState(null);
  const gpsRef = useRef(null);

  // Handle URL token on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setMotoboyToken(urlToken);
      window.history.replaceState({}, '', '/motoboy');
      setAuthed(true);
    }
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      const [infoData, pedidosData] = await Promise.all([getMe(), getMeusPedidos()]);
      setMe(infoData);
      setPedidos(pedidosData.pedidos ?? []);
    } catch (e) {
      if (e.message.includes('inválido') || e.message.includes('inativo')) {
        clearMotoboyToken();
        setAuthed(false);
      }
    } finally {
      setLoading(false);
    }
    try {
      const disponiveisData = await getPedidosDisponiveis();
      setDisponiveis(disponiveisData.pedidos ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authed) return;
    carregarDados();
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, [authed, carregarDados]);

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
        // Pendente: atualiza o pedido localmente para mostrar a ocorrência
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

  // Disponíveis atualizam em 10s para motoboy ver pedidos novos rápido
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(async () => {
      try {
        const d = await getPedidosDisponiveis();
        setDisponiveis(d.pedidos ?? []);
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, [authed]);

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
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Pedidos disponíveis para pegar */}
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
                <p className="text-xs text-[#71717A]">{STATUS_LABEL[p.status] ?? p.status}</p>
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
                  {/* Header */}
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

                  {/* Telefone visível */}
                  {cli.phone_e164 && (
                    <div className="px-4 pb-1">
                      <p className="text-xs text-blue-700 font-semibold">{cli.phone_e164}</p>
                    </div>
                  )}

                  {/* Endereço */}
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

            {/* Itens do pedido */}
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

            {/* Pendência ativa */}
            {p.delivery_occurrence === 'pendente' && p.delivery_notes && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-0.5">
                  <Icon name="Clock" size={12} /> Ocorrência registrada
                </p>
                <p className="text-xs text-orange-600">{p.delivery_notes}</p>
              </div>
            )}

            {/* Ações */}
            {p.status === 'motoboy_collecting' ? (
              <ColetaBarcode pedidoId={p.id} onConfirmado={carregarDados} />
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
