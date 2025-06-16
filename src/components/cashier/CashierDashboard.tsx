
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, TrendingUp, Plus, FileText, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { database, Product, Purchase, Sale } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import CashierSidebar from './CashierSidebar';
import CashierInventory from './CashierInventory';
import PurchaseManager from './PurchaseManager';
import SalesManager from './SalesManager';
import ProductManager from './ProductManager';
import CashierReports from './CashierReports';
import CustomerManager from './CustomerManager';

const CashierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalPurchases: 0,
    totalSales: 0,
    totalSalesAmount: 0,
    totalPurchasesAmount: 0,
    recentPurchases: [] as Purchase[],
    recentSales: [] as Sale[]
  });

  useEffect(() => {
    if (activeTab === 'summary') {
      loadDashboardData();
    }
  }, [activeTab, user]);

  const loadDashboardData = async () => {
    try {
      const [products, allPurchases, allSales] = await Promise.all([
        database.getAllProducts(),
        database.getPurchasesByUser(user?.id || 0),
        database.getSalesByUser(user?.id || 0)
      ]);

      const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);
      const totalSalesAmount = allSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalPurchasesAmount = allPurchases.reduce((sum, purchase) => sum + (purchase.quantity * purchase.purchasePrice), 0);

      setDashboardData({
        totalProducts: products.length,
        lowStockProducts: lowStockProducts.length,
        totalPurchases: allPurchases.length,
        totalSales: allSales.length,
        totalSalesAmount,
        totalPurchasesAmount,
        recentPurchases: allPurchases.slice(-5).reverse(),
        recentSales: allSales.slice(-5).reverse()
      });
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return <CashierInventory />;
      case 'purchases':
        return <PurchaseManager />;
      case 'sales':
        return <SalesManager />;
      case 'products':
        return <ProductManager />;
      case 'reports':
        return <CashierReports />;
      case 'customers':
        return <CustomerManager />;
      default:
        return (
          <div className="space-y-6">
            {/* Bienvenida */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">¡Bienvenido, {user?.fullName}!</h2>
              <p className="text-purple-100">Aquí tienes un resumen de tu actividad en el sistema</p>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Productos</CardTitle>
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dashboardData.totalProducts}</div>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Productos en el sistema
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Stock Bajo</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{dashboardData.lowStockProducts}</div>
                  <p className="text-xs text-orange-600 dark:text-orange-300">
                    Productos con stock mínimo
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Mis Ventas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{dashboardData.totalSales}</div>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    S/ {dashboardData.totalSalesAmount.toFixed(2)} en total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Mis Compras</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{dashboardData.totalPurchases}</div>
                  <p className="text-xs text-purple-600 dark:text-purple-300">
                    S/ {dashboardData.totalPurchasesAmount.toFixed(2)} en total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actividad reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compras recientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5 text-purple-600" />
                    Compras Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentPurchases.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentPurchases.map((purchase, index) => (
                        <div key={purchase.id || index} className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div>
                            <p className="font-medium">{purchase.productName}</p>
                            <p className="text-sm text-gray-500">{new Date(purchase.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">x{purchase.quantity}</p>
                            <p className="text-sm text-green-600">S/ {(purchase.quantity * purchase.purchasePrice).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No has registrado compras aún</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ventas recientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                    Ventas Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentSales.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentSales.map((sale, index) => (
                        <div key={sale.id || index} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div>
                            <p className="font-medium">{sale.productName}</p>
                            <p className="text-sm text-gray-500">{new Date(sale.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">x{sale.quantity}</p>
                            <p className="text-sm text-green-600">S/ {sale.total.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No has registrado ventas aún</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <CashierSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <SidebarInset>
            <header className="bg-white dark:bg-gray-800 shadow-lg border-b-4 border-purple-600">
              <div className="flex items-center justify-between gap-2 px-4 py-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-purple-600 to-gray-400 rounded-full flex items-center justify-center px-2">
                      <span className="text-white font-bold text-xs">BIOX+</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Panel de Cajero</h1>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 p-6">
              {renderContent()}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default CashierDashboard;
