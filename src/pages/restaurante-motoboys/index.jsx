import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarMotoboys, criarMotoboy, toggleMotoboy } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Motoboys', path: '/restaurante/motoboys' },
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <nav className="flex gap-1.5 flex-wrap">
      {links.map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            active === l.path
              ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30'
              : 'text-[#27272A] hover:bg-[#F4F4F5]'
          }`}>
          {l.label}
        </button>
      ))}
    </nav>
  );
};

const RestauranteMotoboys = () => {
  const [motoboys, setMotoboys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copiado, setCopiado] = useState(null); // { id, tipo } | null
  const [acesso, setAcesso] = useState(null); // { lan_ips, porta, cloudflare_domain }

  const reload = () =>
    listarMotoboys()
      .then((r) => setMotoboys(r.motoboys ?? []))
      .catch((e) => setMsg({ tipo: 'erro', texto: e.message }))
      .finally(() => setLoading(false));

  useEffect(() => {
    reload();
    fetch('/api/r/acesso')
      .then((r) => r.json())
      .then(setAcesso)
      .catch(() => {});
  }, []);

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSalvando(true);
    try {
      await criarMotoboy({ name: form.name.trim(), phone: form.phone.trim() || undefined });
      setForm({ name: '', phone: '' });
      setMsg({ tipo: 'ok', texto: 'Motoboy criado!' });
      setTimeout(() => setMsg(null), 3000);
      reload();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  };

  const handleToggle = async (mb) => {
    try {
      await toggleMotoboy(mb.id, !mb.is_active);
      setMotoboys((prev) => prev.map((m) => m.id === mb.id ? { ...m, is_active: !m.is_active } : m));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    }
  };

  const copiar = (texto, id, tipo) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado({ id, tipo });
      setTimeout(() => setCopiado(null), 2500);
    });
  };

  const lanBase = acesso?.lan_ips?.[0]
    ? `http://${acesso.lan_ips[0]}:${acesso.porta ?? 4028}`
    : null;
  const cfBase = acesso?.cloudflare_domain
    ? `https://${acesso.cloudflare_domain}`
    : null;

  const gerarMensagemWhatsApp = (mb) => {
    if (cfBase) {
      // Cloudflare ativo: link direto com token embutido — motoboy clica e entra
      return `🛵 *Portal do Entregador*\n\nOlá, ${mb.name}!\n\n🔗 Clique para entrar:\n${cfBase}/motoboy?token=${mb.access_token}\n\nSe pedir senha manualmente: *${mb.access_token}*`;
    }
    if (lanBase) {
      // Apenas rede local: token separado, aviso claro
      return `🛵 *Portal do Entregador*\n\nOlá, ${mb.name}!\n\n🔗 Link (só funciona no WiFi do restaurante):\n${lanBase}/motoboy\n\n🔑 Sua senha: *${mb.access_token}*\n\n⚠️ Você precisa estar conectado na mesma rede WiFi do restaurante para acessar.`;
    }
    return `🛵 *Portal do Entregador*\n\nOlá, ${mb.name}!\n\n🔑 Sua senha de acesso: *${mb.access_token}*\n\nSolicite o endereço do portal ao restaurante.`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <header className="bg-white border-b border-[#E4E4E7] px-4 sm:px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#18181B]">Motoboys</h1>
            <p className="text-sm text-[#71717A]">Cadastro e links de acesso</p>
          </div>
          <NavRestaurante active="/restaurante/motoboys" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Aviso de acesso */}
        {acesso && (
          <div className={`rounded-xl border px-4 py-3 text-xs space-y-1.5 ${cfBase ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            {cfBase ? (
              <>
                <p className="font-semibold flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Link externo ativo — motoboy pode abrir de qualquer lugar
                </p>
                <p className="font-mono text-green-700">{cfBase}/motoboy</p>
              </>
            ) : (
              <>
                <p className="font-semibold flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Apenas rede local — link via WhatsApp não funcionará fora do WiFi
                </p>
                {lanBase && <p className="font-mono text-amber-700">{lanBase}/motoboy</p>}
                <p>Para acesso externo (motoboy fora do WiFi), configure o Cloudflare Tunnel em <strong>Admin → Configurações</strong>.</p>
              </>
            )}
          </div>
        )}
        {/* Form novo motoboy */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
          <h2 className="font-bold text-[#18181B] text-sm mb-4 flex items-center gap-2">
            <Icon name="UserPlus" size={16} className="text-[#FF441F]" /> Novo motoboy
          </h2>
          <form onSubmit={handleCriar} className="flex flex-col sm:flex-row gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome"
              required
              className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Telefone (opcional)"
              className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
            />
            <button type="submit" disabled={salvando}
              className="px-5 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 whitespace-nowrap">
              {salvando ? '...' : '+ Adicionar'}
            </button>
          </form>
        </div>

        {msg && (
          <div className={`text-sm rounded-xl px-4 py-3 ${
            msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {msg.texto}
          </div>
        )}

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] divide-y divide-[#F4F4F5]">
          {motoboys.length === 0 ? (
            <p className="p-5 text-sm text-[#71717A] text-center">Nenhum motoboy cadastrado</p>
          ) : motoboys.map((mb) => (
            <div key={mb.id} className="p-4 space-y-3">
              {/* Linha superior: avatar + nome + toggle */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${mb.is_active ? 'bg-[#FF441F]/10' : 'bg-[#F4F4F5]'}`}>
                  <Icon name="Bike" size={16} className={mb.is_active ? 'text-[#FF441F]' : 'text-[#A1A1AA]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#18181B]">{mb.name}</p>
                  {mb.phone && <p className="text-xs text-[#71717A]">{mb.phone}</p>}
                </div>
                <button
                  onClick={() => handleToggle(mb)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${
                    mb.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {mb.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              {/* Token + botões de acesso */}
              <div className="bg-[#F4F4F5] rounded-xl px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#71717A] font-medium uppercase tracking-wide mb-0.5">Senha provisória</p>
                  <p className="font-mono text-sm text-[#18181B] break-all">{mb.access_token}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                  {/* Copiar mensagem WhatsApp — ação principal */}
                  <button
                    onClick={() => copiar(gerarMensagemWhatsApp(mb), mb.id, 'wa')}
                    title="Copiar mensagem pronta para WhatsApp"
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                      copiado?.id === mb.id && copiado?.tipo === 'wa'
                        ? 'bg-green-500 text-white'
                        : 'bg-[#25D366] text-white hover:bg-[#1ebe5d]'
                    }`}
                  >
                    <Icon name={copiado?.id === mb.id && copiado?.tipo === 'wa' ? 'Check' : 'MessageCircle'} size={12} />
                    {copiado?.id === mb.id && copiado?.tipo === 'wa' ? 'Copiado!' : 'Copiar p/ WhatsApp'}
                  </button>
                  {/* Copiar só o token */}
                  <button
                    onClick={() => copiar(mb.access_token, mb.id, 'token')}
                    title="Copiar só a senha"
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                      copiado?.id === mb.id && copiado?.tipo === 'token'
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5]'
                    }`}
                  >
                    <Icon name={copiado?.id === mb.id && copiado?.tipo === 'token' ? 'Check' : 'Copy'} size={11} />
                    {copiado?.id === mb.id && copiado?.tipo === 'token' ? 'Copiado!' : 'Senha'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#71717A] text-center">
          Copie a mensagem e cole no WhatsApp do motoboy. Ele abre o link e digita a senha.
        </p>
      </main>
    </div>
  );
};

export default RestauranteMotoboys;
