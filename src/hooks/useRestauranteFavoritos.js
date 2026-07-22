import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const keyFor = (userId) => `favoritos_restaurante_${userId}`;

const readFavoritos = (userId) => {
  if (!userId) return [];
  try { return JSON.parse(localStorage.getItem(keyFor(userId)) ?? '[]'); } catch { return []; }
};

export const useRestauranteFavoritos = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState(() => readFavoritos(user?.id));

  useEffect(() => { setFavoritos(readFavoritos(user?.id)); }, [user?.id]);

  const toggleFavorito = useCallback((path) => {
    if (!user?.id) return;
    setFavoritos((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      localStorage.setItem(keyFor(user.id), JSON.stringify(next));
      return next;
    });
  }, [user?.id]);

  const isFavorito = useCallback((path) => favoritos.includes(path), [favoritos]);

  return { favoritos, toggleFavorito, isFavorito };
};
