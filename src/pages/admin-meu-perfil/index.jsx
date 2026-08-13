import React from 'react';
import AdminHeader from '../../components/admin/AdminHeader';
import CredenciaisForm from '../../components/perfil/CredenciaisForm';
import { useAuth } from '../../contexts/AuthContext';

const AdminMeuPerfil = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/meu-perfil" title="Painel Dev-Admin" subtitle="Meu Perfil" />

      <main className="p-6 max-w-2xl mx-auto">
        <CredenciaisForm currentEmail={user?.email} />
      </main>
    </div>
  );
};

export default AdminMeuPerfil;
