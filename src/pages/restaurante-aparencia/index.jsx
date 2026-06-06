import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAparencia, updateAparencia, getMinhaEmpresa } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Aparência', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <nav className="flex gap-2 flex-wrap justify-end">
      {links.map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`px-3 py-2 text-sm font-medium rounded-lg ${active === l.path ? 'text-white bg-orange-500' : 'text-gray-700 hover:bg-gray-100'}`}>
          {l.label}
        </button>
      ))}
      <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
        className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
        Sair
      </button>
    </nav>
  );
};

const RestauranteAparencia = () => {
  const navigate = useNavigate();
  const [aparencia, setAparencia] = useState(null);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  const [form, setForm] = useState({
    descricao: '',
    background_url: '',
    banner_url: '',
    dark_mode: false,
    carousel_images: [],
  });
  const [novaImgCarrossel, setNovaImgCarrossel] = useState('');

  useEffect(() => {
    Promise.all([getAparencia(), getMinhaEmpresa()])
      .then(([ap, emp]) => {
        setAparencia(ap);
        setSlug(emp.empresa?.slug ?? '');
        setForm({
          descricao: ap.descricao ?? '',
          background_url: ap.background_url ?? '',
          banner_url: ap.banner_url ?? '',
          dark_mode: ap.dark_mode ?? false,
          carousel_images: ap.carousel_images ?? [],
        });
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const updated = await updateAparencia(form);
      setAparencia(updated);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const adicionarImgCarrossel = () => {
    const url = novaImgCarrossel.trim();
    if (!url) return;
    setForm((f) => ({ ...f, carousel_images: [...f.carousel_images, url] }));
    setNovaImgCarrossel('');
  };

  const removerImgCarrossel = (idx) => {
    setForm((f) => ({
      ...f,
      carousel_images: f.carousel_images.filter((_, i) => i !== idx),
    }));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aparência</h1>
          <p className="text-sm text-gray-500">Personalização da página de vendas</p>
        </div>
        <NavRestaurante active="/restaurante/aparencia" />
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        {/* Preview link */}
        {slug && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-800">Sua página de vendas</p>
              <p className="text-xs text-blue-600 font-mono">{window.location.origin}/r/{slug}</p>
            </div>
            <a href={`/r/${slug}`} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1">
              <Icon name="ExternalLink" size={12} /> Abrir
            </a>
          </div>
        )}

        <form onSubmit={handleSalvar} className="space-y-6">
          {/* Descrição */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="FileText" size={16} /> Sobre o restaurante
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição curta</label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                rows={2}
                placeholder="Ex: Comida caseira feita com amor desde 2010..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Visual */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="Palette" size={16} /> Visual
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de fundo (URL)</label>
                <input
                  type="url"
                  value={form.background_url}
                  onChange={(e) => setForm((f) => ({ ...f, background_url: e.target.value }))}
                  placeholder="https://exemplo.com/fundo.jpg"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                {form.background_url && (
                  <img src={form.background_url} alt="Preview" onError={(e) => e.target.style.display='none'}
                    className="mt-2 w-full h-24 object-cover rounded-lg" />
                )}
                <button type="button" onClick={() => setForm((f) => ({ ...f, background_url: '' }))}
                  className="mt-1 text-xs text-red-500 hover:underline">
                  Remover fundo
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setForm((f) => ({ ...f, dark_mode: !f.dark_mode }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.dark_mode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.dark_mode ? 'left-5' : 'left-1'}`} />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700">Modo escuro</p>
                  <p className="text-xs text-gray-400">Fundo escuro por padrão para os clientes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="Image" size={16} /> Banner promocional
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do banner</label>
              <input
                type="url"
                value={form.banner_url}
                onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))}
                placeholder="https://exemplo.com/banner.jpg"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {form.banner_url && (
                <img src={form.banner_url} alt="Banner preview" onError={(e) => e.target.style.display='none'}
                  className="mt-2 w-full h-28 object-cover rounded-lg" />
              )}
            </div>
          </div>

          {/* Carrossel */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="Images" size={16} /> Carrossel de imagens
            </h2>
            <div className="space-y-3">
              {form.carousel_images.map((url, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={url} alt="" onError={(e) => e.target.style.display='none'}
                    className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                  <p className="flex-1 text-xs text-gray-500 font-mono truncate">{url}</p>
                  <button type="button" onClick={() => removerImgCarrossel(i)}
                    className="text-red-400 hover:text-red-600 flex-shrink-0">
                    <Icon name="X" size={16} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={novaImgCarrossel}
                  onChange={(e) => setNovaImgCarrossel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarImgCarrossel())}
                  placeholder="Cole a URL da imagem..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button type="button" onClick={adicionarImgCarrossel}
                  className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
                  + Adicionar
                </button>
              </div>
              {form.carousel_images.length === 0 && (
                <p className="text-xs text-gray-400">Nenhuma imagem no carrossel</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{erro}</p>}
          {sucesso && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">Aparência salva com sucesso!</p>}

          <div className="flex gap-3">
            {slug && (
              <a href={`/r/${slug}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3 text-sm font-medium text-center border border-orange-500 text-orange-500 rounded-xl hover:bg-orange-50">
                Visualizar página
              </a>
            )}
            <button type="submit" disabled={salvando}
              className="flex-1 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar aparência'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default RestauranteAparencia;
