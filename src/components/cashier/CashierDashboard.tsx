
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  LogOut,
  Receipt
} from 'lucide-react';

const CashierDashboard: React.FC = () => {
  const { user, logout } = useAuth();

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
                <h1 className="text-2xl font-bold text-gray-900">Panel de Cajero</h1>
                <p className="text-gray-600">Bienvenido, {user?.fullName || user?.username}</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white shadow-md">
            <TabsTrigger value="summary" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Inventario</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Compras</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Ventas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Reportes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="text-center py-20">
              <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Resumen del Cajero</h3>
              <p className="text-gray-500">Vista general de tus actividades y métricas</p>
              <p className="text-sm text-gray-400 mt-2">Próximamente disponible</p>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="text-center py-20">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Gestión de Inventario</h3>
              <p className="text-gray-500">Registra y consulta productos del inventario compartido</p>
              <p className="text-sm text-gray-400 mt-2">Próximamente disponible</p>
            </div>
          </TabsContent>

          <TabsContent value="purchases">
            <div className="text-center py-20">
              <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Registro de Compras</h3>
              <p className="text-gray-500">Registra las compras de productos para tu inventario</p>
              <p className="text-sm text-gray-400 mt-2">Próximamente disponible</p>
            </div>
          </TabsContent>

          <TabsContent value="sales">
            <div className="text-center py-20">
              <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Punto de Venta</h3>
              <p className="text-gray-500">Registra ventas y genera recibos para tus clientes</p>
              <p className="text-sm text-gray-400 mt-2">Próximamente disponible</p>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="text-center py-20">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Reportes Personales</h3>
              <p className="text-gray-500">Visualiza tus métricas de ventas y desempeño</p>
              <p className="text-sm text-gray-400 mt-2">Próximamente disponible</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CashierDashboard;
