
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  BarChart3, 
  Package, 
  TrendingUp, 
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { database, Product } from '@/lib/database';
import CashierManagement from './CashierManagement';
import AdminReports from './AdminReports';
import AdminInventory from './AdminInventory';
import AdminSummary from './AdminSummary';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">BIOX+</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
                <p className="text-gray-600">Bienvenido, {user?.username}</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Alerta de stock bajo */}
      {showLowStockAlert && lowStockProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>¡Atención!</strong> {lowStockProducts.length} producto(s) con stock bajo: {' '}
              {lowStockProducts.map(p => p.name).join(', ')}
              <Button
                onClick={() => setShowLowStockAlert(false)}
                variant="ghost"
                size="sm"
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                Cerrar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white shadow-md">
            <TabsTrigger value="summary" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="cashiers" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Cajeros</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Inventario</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <AdminSummary />
          </TabsContent>

          <TabsContent value="cashiers">
            <CashierManagement />
          </TabsContent>

          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>

          <TabsContent value="inventory">
            <AdminInventory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
