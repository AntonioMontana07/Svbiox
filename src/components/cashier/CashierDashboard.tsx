
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, TrendingUp, Plus, FileText } from 'lucide-react';
import CashierSidebar from './CashierSidebar';
import CashierInventory from './CashierInventory';
import PurchaseManager from './PurchaseManager';
import SalesManager from './SalesManager';
import ProductManager from './ProductManager';
import CashierReports from './CashierReports';

const CashierDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('summary');

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
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Panel de Cajero</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('products')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productos</CardTitle>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Agregar</div>
                  <p className="text-xs text-muted-foreground">
                    Registra nuevos productos
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('inventory')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventario</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Consultar</div>
                  <p className="text-xs text-muted-foreground">
                    Ver stock disponible
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('purchases')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compras</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Registrar</div>
                  <p className="text-xs text-muted-foreground">
                    Gestiona compras
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('sales')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Vender</div>
                  <p className="text-xs text-muted-foreground">
                    Registra ventas
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
                    Gestión de Productos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => setActiveTab('products')}
                  >
                    Agregar Nuevo Producto
                  </Button>
                  <p className="text-sm text-gray-600">
                    Registra productos nuevos en el inventario global
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Operaciones de Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setActiveTab('purchases')}
                    >
                      Comprar
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveTab('sales')}
                    >
                      Vender
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Gestiona el stock mediante compras y ventas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Reportes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => setActiveTab('reports')}
                  >
                    Ver Mis Reportes
                  </Button>
                  <p className="text-sm text-gray-600">
                    Consulta tus ventas y compras por fechas
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <CashierSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <SidebarInset>
            <header className="bg-white shadow-lg border-b-4 border-purple-600">
              <div className="flex items-center gap-2 px-4 py-4">
                <SidebarTrigger className="-ml-1" />
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">BIOX+</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Panel de Cajero</h1>
                </div>
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
