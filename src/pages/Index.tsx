
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database, initializeTestData } from '@/lib/database';
import LoginForm from '@/components/LoginForm';
import AdminDashboard from '@/components/admin/AdminDashboard';
import CashierDashboard from '@/components/cashier/CashierDashboard';
import StockAlerts from '@/components/StockAlerts';

const Index = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await database.init();
        await initializeTestData();
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initDatabase();
  }, []);

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

  return (
    <>
      {/* Mostrar alertas de stock cuando el usuario esté logueado */}
      <StockAlerts />
      
      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'cashier' && <CashierDashboard />}
      {user.role !== 'admin' && user.role !== 'cashier' && <LoginForm />}
    </>
  );
};

export default Index;
