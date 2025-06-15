
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { database, User, Product, Sale, Purchase } from '@/lib/database';

const AdminSummary: React.FC = () => {
  const [stats, setStats] = useState({
    totalCashiers: 0,
    activeCashiers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    totalPurchaseAmount: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [cashiers, products, sales, purchases, lowStock] = await Promise.all([
          database.getAllCashiers(),
          database.getAllProducts(),
          database.getAllSales(),
          database.getAllPurchases(),
          database.getLowStockProducts()
        ]);

        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + (purchase.quantity * purchase.purchasePrice), 0);

        setStats({
          totalCashiers: cashiers.length,
          activeCashiers: cashiers.filter(c => c.isActive).length,
          totalProducts: products.length,
          lowStockProducts: lowStock.length,
          totalSales: sales.length,
          totalRevenue,
          totalPurchases: purchases.length,
          totalPurchaseAmount
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    description?: string;
  }> = ({ title, value, icon, color, description }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cajeros"
          value={stats.totalCashiers}
          icon={<Users className="h-4 w-4 text-blue-600" />}
          color="bg-blue-100"
          description={`${stats.activeCashiers} activos`}
        />
        
        <StatCard
          title="Productos en Inventario"
          value={stats.totalProducts}
          icon={<Package className="h-4 w-4 text-green-600" />}
          color="bg-green-100"
          description={`${stats.lowStockProducts} con stock bajo`}
        />
        
        <StatCard
          title="Ventas Totales"
          value={stats.totalSales}
          icon={<ShoppingCart className="h-4 w-4 text-purple-600" />}
          color="bg-purple-100"
          description="Transacciones completadas"
        />
        
        <StatCard
          title="Ingresos Totales"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
          color="bg-green-100"
          description="Revenue total"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>Resumen de Ventas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total de ventas:</span>
                <span className="font-semibold">{stats.totalSales}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ingresos totales:</span>
                <span className="font-semibold text-green-600">
                  ${stats.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Promedio por venta:</span>
                <span className="font-semibold">
                  ${stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Resumen de Inventario</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total productos:</span>
                <span className="font-semibold">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock bajo:</span>
                <span className={`font-semibold ${stats.lowStockProducts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.lowStockProducts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total compras:</span>
                <span className="font-semibold">{stats.totalPurchases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inversión total:</span>
                <span className="font-semibold text-blue-600">
                  ${stats.totalPurchaseAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.lowStockProducts > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Alerta de Stock Bajo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Hay {stats.lowStockProducts} producto(s) con stock igual o menor al mínimo establecido. 
              Revisa la sección de inventario para más detalles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSummary;
