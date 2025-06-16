
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Download, ShoppingBag, ShoppingCart, TrendingUp, Package, Users, Star } from 'lucide-react';
import { database, Sale, Purchase } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

const CashierReports: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(addDays(new Date(), -30)),
    to: endOfDay(new Date())
  });
  const [reportData, setReportData] = useState({
    sales: [] as Sale[],
    purchases: [] as Purchase[],
    totalSales: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    totalPurchaseAmount: 0,
    profit: 0,
    salesByDay: [] as { date: string; ventas: number; ingresos: number }[],
    topCustomerByPurchases: null as { name: string; purchases: number } | null,
    topCustomerByRevenue: null as { name: string; revenue: number } | null
  });

  useEffect(() => {
    if (date?.from && date?.to) {
      generateReport();
    }
  }, [date]);

  const generateReport = async () => {
    if (!date?.from || !date?.to) return;

    try {
      const [sales, purchases, customers] = await Promise.all([
        database.getSalesByDateRange(date.from, date.to),
        database.getPurchasesByDateRange(date.from, date.to),
        database.getAllCustomers()
      ]);

      // Filter by user after getting the data
      const userSales = sales.filter(sale => sale.cashierId === user?.id);
      const userPurchases = purchases.filter(purchase => purchase.cashierId === user?.id);

      const totalSales = userSales.length;
      const totalRevenue = userSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalPurchases = userPurchases.length;
      const totalPurchaseAmount = userPurchases.reduce((sum, purchase) => sum + (purchase.quantity * purchase.purchasePrice), 0);
      
      // Calcular ganancias (ingresos - compras)
      const profit = totalRevenue - totalPurchaseAmount;

      // Generar datos por día
      const salesByDayMap = new Map();
      
      userSales.forEach(sale => {
        const dateKey = format(new Date(sale.date), 'yyyy-MM-dd');
        if (!salesByDayMap.has(dateKey)) {
          salesByDayMap.set(dateKey, { ventas: 0, ingresos: 0 });
        }
        const dayData = salesByDayMap.get(dateKey);
        dayData.ventas += 1;
        dayData.ingresos += sale.total;
      });

      const salesByDay = Array.from(salesByDayMap.entries()).map(([date, data]) => ({
        date: format(new Date(date), 'dd/MM', { locale: es }),
        ventas: data.ventas,
        ingresos: data.ingresos
      }));

      // Análisis de clientes top
      const customerStats = new Map();
      
      userSales.forEach(sale => {
        if (sale.customerId) {
          const customer = customers.find(c => c.id === sale.customerId);
          if (customer) {
            const customerName = `${customer.firstName} ${customer.lastName}`;
            if (!customerStats.has(customerName)) {
              customerStats.set(customerName, { purchases: 0, revenue: 0 });
            }
            const stats = customerStats.get(customerName);
            stats.purchases += 1;
            stats.revenue += sale.total;
          }
        }
      });

      // Cliente que más compró (cantidad de compras)
      let topCustomerByPurchases = null;
      let maxPurchases = 0;
      
      // Cliente que más contribuyó (ingresos)
      let topCustomerByRevenue = null;
      let maxRevenue = 0;

      customerStats.forEach((stats, customerName) => {
        if (stats.purchases > maxPurchases) {
          maxPurchases = stats.purchases;
          topCustomerByPurchases = { name: customerName, purchases: stats.purchases };
        }
        if (stats.revenue > maxRevenue) {
          maxRevenue = stats.revenue;
          topCustomerByRevenue = { name: customerName, revenue: stats.revenue };
        }
      });

      setReportData({
        sales: userSales,
        purchases: userPurchases,
        totalSales,
        totalRevenue,
        totalPurchases,
        totalPurchaseAmount,
        profit,
        salesByDay,
        topCustomerByPurchases,
        topCustomerByRevenue
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
  };

  const exportReport = () => {
    // Implementar exportación a CSV
    console.log('Exportando reporte...');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mis Reportes</h2>
        <Button onClick={exportReport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Rango de Fechas</Label>
              <DatePickerWithRange date={date} setDate={setDate} />
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Generar Reporte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Ventas realizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {reportData.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total generado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Compras realizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inversión</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {reportData.totalPurchaseAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total invertido
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias</CardTitle>
            <TrendingUp className={`h-4 w-4 ${reportData.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              S/ {reportData.profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.profit >= 0 ? 'Ganancia neta' : 'Pérdida neta'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Cliente</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {reportData.topCustomerByRevenue?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              S/ {reportData.topCustomerByRevenue?.revenue.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas de clientes destacados */}
      {(reportData.topCustomerByPurchases || reportData.topCustomerByRevenue) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportData.topCustomerByPurchases && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700">
                  <Users className="h-5 w-5" />
                  <span>Cliente que más compró</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-800">
                  {reportData.topCustomerByPurchases.name}
                </div>
                <div className="text-sm text-blue-600">
                  {reportData.topCustomerByPurchases.purchases} compras realizadas
                </div>
              </CardContent>
            </Card>
          )}
          
          {reportData.topCustomerByRevenue && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <Star className="h-5 w-5" />
                  <span>Cliente que más contribuyó</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-800">
                  {reportData.topCustomerByRevenue.name}
                </div>
                <div className="text-sm text-green-600">
                  S/ {reportData.topCustomerByRevenue.revenue.toLocaleString()} en ingresos
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos y detalles */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="sales">Detalle Ventas</TabsTrigger>
          <TabsTrigger value="purchases">Detalle Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Día</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'ingresos' ? `S/ ${value}` : value,
                      name === 'ventas' ? 'Ventas' : 'Ingresos (S/)'
                    ]}
                  />
                  <Bar dataKey="ventas" fill="#3b82f6" />
                  <Bar dataKey="ingresos" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.sales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{sale.productName}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>S/ {sale.salePrice.toFixed(2)}</TableCell>
                        <TableCell className="font-bold">S/ {sale.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No hay ventas en el período seleccionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.purchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{purchase.productName}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>S/ {purchase.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell className="font-bold">
                          S/ {(purchase.quantity * purchase.purchasePrice).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No hay compras en el período seleccionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashierReports;
