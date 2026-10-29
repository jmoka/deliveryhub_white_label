import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RestauranteGuard = ({ children }) => {
  const { loading, isAuthenticated, isRestaurantOwner, planoStatus } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/customer-registration-login" state={{ from: location.pathname }} replace />;
  }
  if (!isRestaurantOwner()) return <Navigate to="/" replace />;

  // Assinatura vencida além da tolerância — só a própria tela do plano (e o
  // link de pagamento com login, que é justamente pra pagar e desbloquear)
  // continuam acessíveis.
  const rotaLivreDeBloqueio =
    location.pathname === '/restaurante/plano' || location.pathname.startsWith('/fatura/pagar-logado/');
  if (planoStatus?.bloqueado && !rotaLivreDeBloqueio) {
    return <Navigate to="/restaurante/plano" replace />;
  }

  return children;
};

export default RestauranteGuard;
