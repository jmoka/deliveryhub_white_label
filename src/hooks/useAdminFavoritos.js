import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const keyFor = (userId) => `favoritos_admin_${userId}`;
const keyForNomes = (userId) => `favoritos_admin_nomes_${userId}`;

const readFavoritos = (userId) => {
  if (!userId) return [];
  try { return JSON.parse(localStorage.getItem(keyFor(userId)) ?? '[]'); } catch { return []; }
};

const readMostrarNomes = (userId) => {
  if (!userId) return true;
  return localStorage.getItem(keyForNomes(userId)) !== 'false';
};

export const useAdminFavoritos = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState(() => readFavoritos(user?.id));
  const [mostrarNomes, setMostrarNomes] = useState(() => readMostrarNomes(user?.id));

  useEffect(() => { setFavoritos(readFavoritos(user?.id)); }, [user?.id]);
  useEffect(() => { setMostrarNomes(readMostrarNomes(user?.id)); }, [user?.id]);

  const toggleFavorito = useCallback((path) => {
    if (!user?.id) return;
    setFavoritos((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      localStorage.setItem(keyFor(user.id), JSON.stringify(next));
      return next;
    });
  }, [user?.id]);

  const isFavorito = useCallback((path) => favoritos.includes(path), [favoritos]);

  const toggleMostrarNomes = useCallback(() => {
    if (!user?.id) return;
    setMostrarNomes((prev) => {
      const next = !prev;
      localStorage.setItem(keyForNomes(user.id), String(next));
      return next;
    });
  }, [user?.id]);

  return { favoritos, toggleFavorito, isFavorito, mostrarNomes, toggleMostrarNomes };
};
