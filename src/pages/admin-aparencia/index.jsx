import React, { useState, useEffect } from 'react';
import { getPlataformaConfig, updatePlataformaConfig, uploadImagemPlataforma } from '../../services/adminService';
import Icon from '../../components/AppIcon';
import ImageUpload from '../../components/ui/ImageUpload';
import AdminHeader from '../../components/admin/AdminHeader';

const ICONES = [
  'Utensils', 'UtensilsCrossed', 'ChefHat', 'Pizza', 'Sandwich', 'Soup', 'Coffee',
  'ShoppingBag', 'Store', 'Truck', 'Bike', 'Package', 'Star', 'Heart', 'Flame', 'Tag',
];

const OpacitySlider = ({ label = 'Transparência', value, onChange }) => (
  <div className="mt-2">
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs text-gray-500 dark:text-zinc-400">{label}</label>
      <span className="text-xs font-mono text-gray-500 dark:text-zinc-400 w-10 text-right">{value ?? 100}%</span>
    </div>
    <input
      type="range" min="0" max="100" value={value ?? 100}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-orange-500 cursor-pointer"
    />
  </div>
);

const ColorField = ({ label, value, onChange, opacity, onOpacityChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{label}</label>
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 flex-shrink-0 rounded-lg border border-gray-300 dark:border-zinc-700 cursor-pointer p-0.5 bg-white dark:bg-zinc-800" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
    </div>
    {onOpacityChange && <OpacitySlider value={opacity} onChange={onOpacityChange} />}
  </div>
);

const OptionalBgField = ({ label, value, onChange, opacity, onOpacityChange }) => {
  const enabled = !!value;
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 cursor-pointer select-none mb-1">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked ? '#FFFFFF' : '')}
          className="rounded border-gray-300 dark:border-zinc-700 text-orange-500 focus:ring-orange-400"
        />
        {label}
      </label>
      {enabled && (
        <>
          <div className="flex items-center gap-3">
            <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
              className="w-12 h-10 flex-shrink-0 rounded-lg border border-gray-300 dark:border-zinc-700 cursor-pointer p-0.5 bg-white dark:bg-zinc-800" />
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {onOpacityChange && <OpacitySlider value={opacity} onChange={onOpacityChange} />}
        </>
      )}
    </div>
  );
};

const TextField = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  </div>
);

const Card = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-6 space-y-4">
    <h2 className="font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
      <Icon name={icon} size={16} className="text-orange-500" /> {title}
    </h2>
    {children}
  </div>
);

const AdminAparencia = () => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    getPlataformaConfig()
      .then((d) => setForm(d.aparencia_marketplace))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const atualizado = await updatePlataformaConfig({ aparencia_marketplace: form });
      setForm(atualizado.aparencia_marketplace);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
        <AdminHeader active="/admin/aparencia" title="Aparência do Marketplace" subtitle="Branding público de /menu-catalog-product-browse" />
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/aparencia" title="Aparência do Marketplace" subtitle="Branding público de /menu-catalog-product-browse" />

      <main className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSalvar} className="space-y-6">

          {/* ── Cabeçalho ─────────────────────────────────────── */}
          <Card title="Cabeçalho" icon="LayoutTemplate">
            <TextField label="Nome da marca" value={form.nome_marca} onChange={(v) => set('nome_marca', v)} placeholder="DeliveryHub" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Ícone da logo</label>
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl mb-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF441F, #FF7A00)' }}>
                  <Icon name={form.logo_icon} size={22} />
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{form.logo_icon}</p>
              </div>
              <div className="grid grid-cols-8 gap-1.5 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl">
                {ICONES.map((icon) => (
                  <button key={icon} type="button" title={icon} onClick={() => set('logo_icon', icon)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      form.logo_icon === icon ? 'bg-orange-500 text-white shadow-md scale-110' : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}>
                    <Icon name={icon} size={16} />
                  </button>
                ))}
              </div>
              <input value={form.logo_icon} onChange={(e) => set('logo_icon', e.target.value)}
                className="w-full mt-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Ou digite o nome exato do ícone (ex: Pizza)" />
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                Busque mais opções em{' '}
                <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-orange-600 dark:text-orange-400 underline">lucide.dev/icons</a>.
              </p>
            </div>

            <ColorField label="Cor da barra superior" value={form.header_bg_color} onChange={(v) => set('header_bg_color', v)}
              opacity={form.header_bg_opacity} onOpacityChange={(v) => set('header_bg_opacity', v)} />
            <ColorField label="Cor da fonte da barra superior" value={form.header_text_color} onChange={(v) => set('header_text_color', v)} />
          </Card>

          {/* ── Hero ──────────────────────────────────────────── */}
          <Card title="Hero (banner principal)" icon="Image">
            <TextField label="Tagline" value={form.hero_tagline} onChange={(v) => set('hero_tagline', v)} placeholder="Delivery · Rápido · Confiável" />
            <TextField label="Título" value={form.hero_titulo} onChange={(v) => set('hero_titulo', v)} placeholder="Seu delivery favorito" />
            <TextField label="Subtítulo" value={form.hero_subtitulo} onChange={(v) => set('hero_subtitulo', v)} placeholder="Peça dos melhores restaurantes da sua cidade" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Fundo do Hero</label>
              <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
                {[['gradiente', 'Gradiente'], ['cor', 'Cor sólida'], ['imagem', 'Imagem']].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => set('hero_fundo_tipo', k)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      form.hero_fundo_tipo === k ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {form.hero_fundo_tipo === 'gradiente' && (
                <>
                  <div className="h-16 w-full rounded-xl" style={{ background: 'linear-gradient(135deg, #FF441F, #FF5C30, #FF7A00)', opacity: (form.hero_fundo_opacity ?? 100) / 100 }} />
                  <OpacitySlider value={form.hero_fundo_opacity} onChange={(v) => set('hero_fundo_opacity', v)} />
                </>
              )}
              {form.hero_fundo_tipo === 'cor' && (
                <ColorField label="Cor do fundo" value={form.hero_fundo_cor} onChange={(v) => set('hero_fundo_cor', v)}
                  opacity={form.hero_fundo_opacity} onOpacityChange={(v) => set('hero_fundo_opacity', v)} />
              )}
              {form.hero_fundo_tipo === 'imagem' && (
                <>
                  <ImageUpload
                    value={form.hero_fundo_imagem_url}
                    onChange={(url) => set('hero_fundo_imagem_url', url)}
                    uploadFn={uploadImagemPlataforma}
                    folder="plataforma"
                    aspect="banner"
                    placeholder="https://exemplo.com/fundo-hero.jpg"
                  />
                  <OpacitySlider value={form.hero_fundo_opacity} onChange={(v) => set('hero_fundo_opacity', v)} />
                </>
              )}
            </div>
          </Card>

          {/* ── Estatísticas ──────────────────────────────────── */}
          <Card title="Estatísticas do Hero" icon="BarChart2">
            <p className="text-xs text-gray-400 dark:text-zinc-500 -mt-2">
              Os números de restaurantes e avaliação média são calculados automaticamente — aqui dá pra editar só os rótulos e o tempo estimado de entrega.
            </p>
            <TextField label="Rótulo 1 (contagem de restaurantes)" value={form.stat1_label} onChange={(v) => set('stat1_label', v)} placeholder="Restaurantes" />
            <TextField label="Rótulo 2 (avaliação média)" value={form.stat2_label} onChange={(v) => set('stat2_label', v)} placeholder="Avaliação média" />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Valor do tempo de entrega" value={form.stat3_valor} onChange={(v) => set('stat3_valor', v)} placeholder="~30" />
              <TextField label="Rótulo 3 (tempo de entrega)" value={form.stat3_label} onChange={(v) => set('stat3_label', v)} placeholder="Min. entrega" />
            </div>
          </Card>

          {/* ── Página ────────────────────────────────────────── */}
          <Card title="Página" icon="Palette">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Fundo da página</label>
              <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
                {[['cor', 'Cor sólida'], ['imagem', 'Imagem']].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => set('page_fundo_tipo', k)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      form.page_fundo_tipo === k ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {form.page_fundo_tipo === 'cor' ? (
                <ColorField label="Cor de fundo da página" value={form.page_bg_color} onChange={(v) => set('page_bg_color', v)}
                  opacity={form.page_bg_opacity} onOpacityChange={(v) => set('page_bg_opacity', v)} />
              ) : (
                <>
                  <ImageUpload
                    value={form.page_fundo_imagem_url}
                    onChange={(url) => set('page_fundo_imagem_url', url)}
                    uploadFn={uploadImagemPlataforma}
                    folder="plataforma"
                    aspect="banner"
                    placeholder="https://exemplo.com/fundo-pagina.jpg"
                  />
                  <OpacitySlider value={form.page_bg_opacity} onChange={(v) => set('page_bg_opacity', v)} />
                </>
              )}
            </div>

            <ColorField
              label="Cor de fundo das faixas de conteúdo (filtros, categorias, carrosséis)"
              value={form.secoes_bg_color}
              onChange={(v) => set('secoes_bg_color', v)}
              opacity={form.secoes_bg_opacity}
              onOpacityChange={(v) => set('secoes_bg_opacity', v)}
            />
            <ColorField
              label="Cor da fonte dos títulos (ex: 'Combos em destaque', 'Todos os restaurantes')"
              value={form.texto_principal_color}
              onChange={(v) => set('texto_principal_color', v)}
            />
            <OptionalBgField
              label="Incluir fundo atrás dos títulos"
              value={form.texto_principal_bg_color}
              onChange={(v) => set('texto_principal_bg_color', v)}
              opacity={form.texto_principal_bg_opacity}
              onOpacityChange={(v) => set('texto_principal_bg_opacity', v)}
            />
            <ColorField
              label="Cor da fonte dos textos secundários (ex: contagem de restaurantes, legendas)"
              value={form.texto_secundario_color}
              onChange={(v) => set('texto_secundario_color', v)}
            />
            <OptionalBgField
              label="Incluir fundo atrás dos textos secundários"
              value={form.texto_secundario_bg_color}
              onChange={(v) => set('texto_secundario_bg_color', v)}
              opacity={form.texto_secundario_bg_opacity}
              onOpacityChange={(v) => set('texto_secundario_bg_opacity', v)}
            />
          </Card>

          {/* ── Rodapé ────────────────────────────────────────── */}
          <Card title="Rodapé" icon="PanelBottom">
            <ColorField label="Cor de fundo do rodapé" value={form.footer_bg_color} onChange={(v) => set('footer_bg_color', v)}
              opacity={form.footer_bg_opacity} onOpacityChange={(v) => set('footer_bg_opacity', v)} />
            <ColorField label="Cor do texto (copyright)" value={form.footer_text_color} onChange={(v) => set('footer_text_color', v)} />
            <ColorField label="Cor dos links" value={form.footer_link_color} onChange={(v) => set('footer_link_color', v)} />
          </Card>

          {erro && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">{erro}</div>
          )}
          {sucesso && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg text-sm text-green-700 dark:text-green-400">
              Aparência salva! Recarregue /menu-catalog-product-browse pra ver a mudança.
            </div>
          )}

          <button type="submit" disabled={salvando}
            className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar aparência'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AdminAparencia;
