import React from 'react';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import CredenciaisForm from '../../components/perfil/CredenciaisForm';
import { useAuth } from '../../contexts/AuthContext';

const RestauranteMeuPerfil = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/meu-perfil" title="Meu Perfil" subtitle="Email e senha de acesso" />

      <main className="p-6 max-w-2xl mx-auto">
        <CredenciaisForm currentEmail={user?.email} />
      </main>
    </div>
  );
};

export default RestauranteMeuPerfil;
