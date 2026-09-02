import React, { useState, useEffect } from 'react';
import { getPlataformaConfig, updatePlataformaConfig, uploadImagemPlataforma } from '../../services/adminService';
import Icon from '../../components/AppIcon';
import ImageUpload from '../../components/ui/ImageUpload';
import AdminHeader from '../../components/admin/AdminHeader';
import { APP_NAME } from '../../constants/brand';

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

const PillSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{label}</label>
    <div className="flex gap-1 flex-wrap bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
      {options.map(([k, l]) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            value === k ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
          }`}>
          {l}
        </button>
      ))}
    </div>
  </div>
);

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

const NumberField = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{label}</label>
    <input
      type="number"
      value={value ?? 0}
      onChange={(e) => onChange(Number(e.target.value))}
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
            <TextField label="Nome da marca" value={form.nome_marca} onChange={(v) => set('nome_marca', v)} placeholder={APP_NAME} />
            <OptionalBgField
              label="Incluir fundo atrás do nome da marca"
              value={form.nome_marca_bg_color}
              onChange={(v) => set('nome_marca_bg_color', v)}
              opacity={form.nome_marca_bg_opacity}
              onOpacityChange={(v) => set('nome_marca_bg_opacity', v)}
            />
            <OptionalBgField
              label="Incluir borda no nome da marca"
              value={form.nome_marca_border_color}
              onChange={(v) => set('nome_marca_border_color', v)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Logo</label>
              <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
                {[['icone', 'Ícone'], ['imagem', 'Imagem']].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => set('logo_tipo', k)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      (form.logo_tipo ?? 'icone') === k ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              <ColorField
                label="Cor de fundo do logo"
                value={form.logo_bg_color}
                onChange={(v) => set('logo_bg_color', v)}
                opacity={form.logo_bg_opacity}
                onOpacityChange={(v) => set('logo_bg_opacity', v)}
              />
              <OptionalBgField
                label="Incluir borda no logo"
                value={form.logo_border_color}
                onChange={(v) => set('logo_border_color', v)}
              />

              {(form.logo_tipo ?? 'icone') === 'icone' ? (
                <>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl mb-2 mt-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
                      style={{
                        backgroundColor: form.logo_bg_color || '#FF441F',
                        opacity: (form.logo_bg_opacity ?? 100) / 100,
                        border: form.logo_border_color ? `1px solid ${form.logo_border_color}` : 'none',
                      }}>
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
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl mb-2 mt-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"
                      style={{
                        backgroundColor: form.logo_bg_color || '#FF441F',
                        opacity: (form.logo_bg_opacity ?? 100) / 100,
                        border: form.logo_border_color ? `1px solid ${form.logo_border_color}` : 'none',
                      }}>
                      {form.logo_imagem_url
                        ? <img src={form.logo_imagem_url} alt="Logo" className="w-full h-full object-cover" />
                        : <Icon name="Image" size={20} className="text-white/70" />}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">Aparece no cabeçalho do marketplace, em vez do ícone.</p>
                  </div>
                  <ImageUpload
                    value={form.logo_imagem_url}
                    onChange={(url) => set('logo_imagem_url', url)}
                    uploadFn={uploadImagemPlataforma}
                    folder="plataforma"
                    aspect="square"
                    placeholder="https://exemplo.com/logo.png"
                  />
                </>
              )}
            </div>

            <ColorField label="Cor da barra superior" value={form.header_bg_color} onChange={(v) => set('header_bg_color', v)}
              opacity={form.header_bg_opacity} onOpacityChange={(v) => set('header_bg_opacity', v)} />
            <ColorField label="Cor da fonte da barra superior" value={form.header_text_color} onChange={(v) => set('header_text_color', v)} />
          </Card>

          {/* ── Botões do cabeçalho (Admin, Carrinho, Pedidos, Sair etc.) ── */}
          <Card title="Botões do cabeçalho" icon="MousePointerClick">
            <p className="text-xs text-gray-400 dark:text-zinc-500 -mt-2">
              Estilo único, compartilhado por todos os botões do topo: Admin, Carrinho, Pedidos, Sair, "Seja um entregador/vendedor" e Painel (motoboy/restaurante).
            </p>
            <TextField label="Texto do botão Admin" value={form.botao_admin_texto} onChange={(v) => set('botao_admin_texto', v)} placeholder="Admin" />
            <ColorField label="Cor do texto/ícone" value={form.botoes_header_text_color} onChange={(v) => set('botoes_header_text_color', v)} />
            <PillSelect
              label="Peso da fonte"
              value={form.botoes_header_font_weight}
              onChange={(v) => set('botoes_header_font_weight', v)}
              options={[['400', 'Normal'], ['500', 'Médio'], ['600', 'Semi-negrito'], ['700', 'Negrito']]}
            />
            <OptionalBgField
              label="Incluir fundo"
              value={form.botoes_header_bg_color}
              onChange={(v) => set('botoes_header_bg_color', v)}
              opacity={form.botoes_header_bg_opacity}
              onOpacityChange={(v) => set('botoes_header_bg_opacity', v)}
            />
            <OptionalBgField
              label="Incluir borda"
              value={form.botoes_header_border_color}
              onChange={(v) => set('botoes_header_border_color', v)}
            />
            <ColorField
              label="Cor de fundo ao passar o mouse (hover)"
              value={form.botoes_header_hover_bg_color}
              onChange={(v) => set('botoes_header_hover_bg_color', v)}
              opacity={form.botoes_header_hover_bg_opacity}
              onOpacityChange={(v) => set('botoes_header_hover_bg_opacity', v)}
            />
          </Card>

          {/* ── Hero ──────────────────────────────────────────── */}
          <Card title="Hero (banner principal)" icon="Image">
            <TextField label="Tagline" value={form.hero_tagline} onChange={(v) => set('hero_tagline', v)} placeholder="Delivery · Rápido · Confiável" />
            <TextField label="Título" value={form.hero_titulo} onChange={(v) => set('hero_titulo', v)} placeholder="Seu delivery favorito" />
            <TextField label="Subtítulo" value={form.hero_subtitulo} onChange={(v) => set('hero_subtitulo', v)} placeholder="Peça dos melhores restaurantes da sua cidade" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Fundo do Hero</label>

              <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 cursor-pointer select-none mb-3">
                <input
                  type="checkbox"
                  checked={!!form.hero_fundo_transparente}
                  onChange={(e) => set('hero_fundo_transparente', e.target.checked)}
                  className="rounded border-gray-300 dark:border-zinc-700 text-orange-500 focus:ring-orange-400"
                />
                Deixar transparente (sem fundo — mostra a cor/imagem de fundo da página por trás)
              </label>

              {!form.hero_fundo_transparente && (
                <>
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
                      <div className="h-16 w-full rounded-xl" style={{ background: `linear-gradient(135deg, ${form.hero_fundo_gradient_from}, ${form.hero_fundo_gradient_to})`, opacity: (form.hero_fundo_opacity ?? 100) / 100 }} />
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <ColorField label="Cor inicial" value={form.hero_fundo_gradient_from} onChange={(v) => set('hero_fundo_gradient_from', v)} />
                        <ColorField label="Cor final" value={form.hero_fundo_gradient_to} onChange={(v) => set('hero_fundo_gradient_to', v)} />
                      </div>
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
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Ajuste fino da barra de busca</label>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-2">
                Desloca só a barra de busca (em pixels), útil pra encaixar em harmonia com uma imagem de fundo. Negativo desloca pra cima/esquerda.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Deslocamento vertical (px)" value={form.hero_busca_offset_y} onChange={(v) => set('hero_busca_offset_y', v)} />
                <NumberField label="Deslocamento lateral (px)" value={form.hero_busca_offset_x} onChange={(v) => set('hero_busca_offset_x', v)} />
              </div>
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

            <ColorField label="Cor dos números" value={form.stats_valor_color} onChange={(v) => set('stats_valor_color', v)} />
            <PillSelect
              label="Peso da fonte dos números"
              value={form.stats_valor_font_weight}
              onChange={(v) => set('stats_valor_font_weight', v)}
              options={[['400', 'Normal'], ['500', 'Médio'], ['600', 'Semi-negrito'], ['700', 'Negrito'], ['800', 'Extra-negrito'], ['900', 'Preto']]}
            />
            <ColorField
              label="Cor dos rótulos e ícones"
              value={form.stats_label_color}
              onChange={(v) => set('stats_label_color', v)}
              opacity={form.stats_label_opacity}
              onOpacityChange={(v) => set('stats_label_opacity', v)}
            />
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
