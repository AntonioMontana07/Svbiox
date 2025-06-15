
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import AdminDashboard from '@/components/admin/AdminDashboard';
import CashierDashboard from '@/components/cashier/CashierDashboard';

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">BIOX+</span>
          </div>
          <p className="text-gray-600 text-lg">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user.role === 'cashier') {
    return <CashierDashboard />;
  }

  return <LoginForm />;
};

export default Index;
