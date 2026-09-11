import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFavoritosMenuAdmin, updateFavoritosMenuAdmin } from '../services/adminService';

// Favoritos da barra superior (pinados a partir do menu lateral) — persistidos
// no banco (user_profiles.favoritos_menu, escopo "admin", cache Redis no
// backend). Antes vivia em localStorage e se perdia ao trocar de dispositivo.
export const useAdminFavoritos = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState([]);
  const [mostrarNomes, setMostrarNomes] = useState(true);

  useEffect(() => {
    if (!user?.id) { setFavoritos([]); setMostrarNomes(true); return; }
    getFavoritosMenuAdmin()
      .then((cfg) => {
        setFavoritos(cfg.paths ?? []);
        setMostrarNomes(cfg.mostrar_nomes ?? true);
      })
      .catch(() => {});
  }, [user?.id]);

  const toggleFavorito = useCallback((path) => {
    if (!user?.id) return;
    setFavoritos((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      updateFavoritosMenuAdmin({ paths: next }).catch(() => {});
      return next;
    });
  }, [user?.id]);

  const isFavorito = useCallback((path) => favoritos.includes(path), [favoritos]);

  const toggleMostrarNomes = useCallback(() => {
    if (!user?.id) return;
    setMostrarNomes((prev) => {
      const next = !prev;
      updateFavoritosMenuAdmin({ mostrar_nomes: next }).catch(() => {});
      return next;
    });
  }, [user?.id]);

  return { favoritos, toggleFavorito, isFavorito, mostrarNomes, toggleMostrarNomes };
};
