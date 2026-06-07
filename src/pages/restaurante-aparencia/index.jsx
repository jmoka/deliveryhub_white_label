import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAparencia, updateAparencia, getMinhaEmpresa } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
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
      <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
        className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
        Sair
      </button>
    </nav>
  );
};

/* ── Toggle aberto/fechado ───────────────────────────────────────── */
const ToggleSwitch = ({ value, onChange, label, desc }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-[#18181B]">{label}</p>
      {desc && <p className="text-xs text-[#71717A] mt-0.5">{desc}</p>}
    </div>
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#FF441F]' : 'bg-[#E4E4E7]'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

const Section = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
    <h2 className="font-bold text-[#18181B] mb-4 flex items-center gap-2 text-sm">
      <Icon name={icon} size={16} className="text-[#FF441F]" /> {title}
    </h2>
    {children}
  </div>
);

/* ── Componente principal ────────────────────────────────────────── */
const RestauranteAparencia = () => {
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [msg, setMsg] = useState(null); // { tipo: 'ok'|'erro', texto }
  const [novaImgCarrossel, setNovaImgCarrossel] = useState('');
  const [fundoTipo, setFundoTipo] = useState('gradient'); // gradient | cor | imagem

  const [form, setForm] = useState({
    descricao: '',
    background_url: '',
    background_color: '#FF441F',
    banner_url: '',
    carousel_images: [],
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    Promise.all([getAparencia(), getMinhaEmpresa()])
      .then(([ap, emp]) => {
        setSlug(emp.empresa?.slug ?? '');
        setForm({
          descricao: ap.descricao ?? '',
          background_url: ap.background_url ?? '',
          background_color: ap.background_color ?? '#FF441F',
          banner_url: ap.banner_url ?? '',
          carousel_images: ap.carousel_images ?? [],
        });
        if (ap.background_url) setFundoTipo('imagem');
        else if (ap.background_color && ap.background_color !== '#FF441F') setFundoTipo('cor');
        else setFundoTipo('gradient');
      })
      .catch((e) => setMsg({ tipo: 'erro', texto: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);
    try {
      const payload = {
        ...form,
        background_url: fundoTipo === 'imagem' ? form.background_url : '',
        background_color: fundoTipo === 'cor' ? form.background_color : '',
      };
      await updateAparencia(payload);
      setMsg({ tipo: 'ok', texto: 'Configurações salvas!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  };

  const copiarLink = () => {
    const url = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const adicionarImg = () => {
    const url = novaImgCarrossel.trim();
    if (!url) return;
    set('carousel_images', [...form.carousel_images, url]);
    setNovaImgCarrossel('');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const linkUrl = `${window.location.origin}/r/${slug}`;

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      {/* Header */}
      <header className="bg-white border-b border-[#E4E4E7] px-4 sm:px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#18181B]">Designer</h1>
            <p className="text-sm text-[#71717A]">Personalização da página de vendas</p>
          </div>
          <NavRestaurante active="/restaurante/aparencia" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSalvar} className="space-y-4">

          {/* ── Link para compartilhar ─────────────────────────────── */}
          {slug && (
            <Section icon="Share2" title="Link da sua página">
              <div className="flex items-center gap-2 bg-[#F4F4F5] rounded-xl px-3 py-2.5">
                <Icon name="Link" size={14} className="text-[#71717A] flex-shrink-0" />
                <p className="flex-1 text-xs text-[#27272A] font-mono truncate">{linkUrl}</p>
                <button type="button" onClick={copiarLink}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    copiado ? 'bg-green-500 text-white' : 'bg-[#FF441F] text-white hover:bg-[#E63A19]'
                  }`}>
                  <Icon name={copiado ? 'Check' : 'Copy'} size={12} />
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <a href={`/r/${slug}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#FF441F] hover:underline">
                  <Icon name="ExternalLink" size={12} /> Abrir página
                </a>
              </div>
            </Section>
          )}

          {/* ── Banner ────────────────────────────────────────────── */}
          <Section icon="Image" title="Banner (hero da página)">
            <label className="block text-xs font-medium text-[#71717A] mb-1">URL do banner</label>
            <input type="url" value={form.banner_url}
              onChange={(e) => set('banner_url', e.target.value)}
              placeholder="https://exemplo.com/banner.jpg"
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
            {form.banner_url && (
              <div className="mt-2 relative">
                <img src={form.banner_url} alt="Banner" onError={(e) => (e.target.style.display = 'none')}
                  className="w-full h-28 object-cover rounded-xl" />
                <button type="button" onClick={() => set('banner_url', '')}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
          </Section>

          {/* ── Fundo ─────────────────────────────────────────────── */}
          <Section icon="Palette" title="Fundo da página">
            <div className="flex gap-1 mb-4 bg-[#F4F4F5] p-1 rounded-xl w-fit">
              {[['gradient', 'Gradiente'], ['cor', 'Cor sólida'], ['imagem', 'Imagem']].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setFundoTipo(k)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    fundoTipo === k ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#27272A]'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {fundoTipo === 'gradient' && (
              <div className="h-16 w-full rounded-xl" style={{ background: 'linear-gradient(135deg, #FF441F, #FF7A00)' }} />
            )}

            {fundoTipo === 'cor' && (
              <div className="flex items-center gap-3">
                <input type="color" value={form.background_color}
                  onChange={(e) => set('background_color', e.target.value)}
                  className="w-12 h-10 rounded-lg border border-[#E4E4E7] cursor-pointer p-0.5" />
                <input type="text" value={form.background_color}
                  onChange={(e) => set('background_color', e.target.value)}
                  className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#FF441F]" />
                <div className="w-10 h-10 rounded-xl border border-[#E4E4E7] flex-shrink-0"
                  style={{ background: form.background_color }} />
              </div>
            )}

            {fundoTipo === 'imagem' && (
              <>
                <label className="block text-xs font-medium text-[#71717A] mb-1">URL da imagem de fundo</label>
                <input type="url" value={form.background_url}
                  onChange={(e) => set('background_url', e.target.value)}
                  placeholder="https://exemplo.com/fundo.jpg"
                  className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
                {form.background_url && (
                  <img src={form.background_url} alt="Fundo" onError={(e) => (e.target.style.display = 'none')}
                    className="mt-2 w-full h-20 object-cover rounded-xl" />
                )}
              </>
            )}
          </Section>

          {/* ── Carrossel ─────────────────────────────────────────── */}
          <Section icon="Images" title="Carrossel de imagens">
            <div className="space-y-2.5">
              {form.carousel_images.map((url, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#F4F4F5] rounded-xl p-2">
                  <img src={url} alt="" onError={(e) => (e.target.style.display = 'none')}
                    className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
                  <p className="flex-1 text-xs text-[#71717A] font-mono truncate">{url}</p>
                  <button type="button" onClick={() => set('carousel_images', form.carousel_images.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 flex-shrink-0 p-1">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input type="url" value={novaImgCarrossel}
                  onChange={(e) => setNovaImgCarrossel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarImg())}
                  placeholder="URL da imagem..."
                  className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
                <button type="button" onClick={adicionarImg}
                  className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] transition-colors">
                  + Add
                </button>
              </div>
              {form.carousel_images.length === 0 && (
                <p className="text-xs text-[#71717A]">Nenhuma imagem adicionada</p>
              )}
            </div>
          </Section>

          {/* ── Descrição ─────────────────────────────────────────── */}
          <Section icon="FileText" title="Descrição do restaurante">
            <textarea value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              rows={2} placeholder="Ex: Comida caseira feita com amor desde 2010..."
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F] resize-none" />
          </Section>

          {/* ── Mensagem e salvar ──────────────────────────────────── */}
          {msg && (
            <div className={`text-sm rounded-xl px-4 py-3 ${
              msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {msg.texto}
            </div>
          )}

          <button type="submit" disabled={salvando}
            className="w-full py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50 transition-colors shadow-lg shadow-[#FF441F]/20 text-sm">
            {salvando ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default RestauranteAparencia;
