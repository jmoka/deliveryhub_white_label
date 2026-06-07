import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getMe, getMeusPedidos, atualizarLocalizacao, confirmarEntrega,
  getMotoboyToken, setMotoboyToken, clearMotoboyToken,
} from '../../services/motoboyService';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_LABEL = {
  out_for_delivery: 'Saiu p/ entrega',
  confirmed: 'Confirmado',
  ready: 'Pronto p/ entrega',
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
  const [confirmando, setConfirmando] = useState(null);
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
        {pedidos.length === 0 ? (
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

            {p.cliente && (
              <div className="bg-[#FAFAFA] rounded-xl p-3">
                <p className="text-xs font-semibold text-[#71717A] mb-1">Entregar para</p>
                <p className="text-sm font-medium text-[#18181B]">{p.cliente.name}</p>
                {p.cliente.phone_e164 && (
                  <a href={`tel:${p.cliente.phone_e164}`} className="text-xs text-[#FF441F] font-medium flex items-center gap-1 mt-0.5">
                    <Icon name="Phone" size={11} /> {p.cliente.phone_e164}
                  </a>
                )}
                {p.cliente.address_json?.logradouro && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [p.cliente.address_json.logradouro, p.cliente.address_json.numero, p.cliente.address_json.bairro, p.cliente.address_json.cidade].filter(Boolean).join(', ')
                    )}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 mt-1"
                  >
                    <Icon name="Navigation" size={11} />
                    {p.cliente.address_json.logradouro}{p.cliente.address_json.numero ? `, ${p.cliente.address_json.numero}` : ''}
                  </a>
                )}
              </div>
            )}

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

            <button
              onClick={() => handleEntregar(p.id)}
              disabled={confirmando === p.id}
              className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="CheckCircle2" size={16} />
              {confirmando === p.id ? 'Registrando...' : 'Confirmar entrega'}
            </button>
          </div>
        ))}

        <p className="text-center text-xs text-[#A1A1AA]">Atualiza a cada 30 segundos</p>
      </main>
    </div>
  );
};

export default MotoboyPortal;
