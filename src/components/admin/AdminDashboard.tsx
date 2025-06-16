
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { database, Product } from '@/lib/database';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import AdminSidebar from './AdminSidebar';
import AdminSummary from './AdminSummary';
import CashierManagement from './CashierManagement';
import AdminReports from './AdminReports';
import AdminInventory from './AdminInventory';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);

  useEffect(() => {
    const checkLowStock = async () => {
      const products = await database.getLowStockProducts();
      setLowStockProducts(products);
      if (products.length > 0) {
        setShowLowStockAlert(true);
      }
    };

    checkLowStock();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'cashiers':
        return <CashierManagement />;
      case 'reports':
        return <AdminReports />;
      case 'inventory':
        return <AdminInventory />;
      default:
        return <AdminSummary />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <SidebarInset>
            <header className="bg-white dark:bg-gray-800 shadow-lg border-b-4 border-purple-600">
              <div className="flex items-center justify-between gap-2 px-4 py-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-gray-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">BIOX+</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Panel de Administrador</h1>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </header>

            {/* Alerta de stock bajo */}
            {showLowStockAlert && lowStockProducts.length > 0 && (
              <div className="px-6 pt-4">
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    <strong>¡Atención!</strong> {lowStockProducts.length} producto(s) con stock bajo: {' '}
                    {lowStockProducts.map(p => p.name).join(', ')}
                    <Button
                      onClick={() => setShowLowStockAlert(false)}
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
                    >
                      Cerrar
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <main className="flex-1 p-6">
              {renderContent()}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminDashboard;
