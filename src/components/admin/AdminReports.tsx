
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, CalendarIcon, User, Activity, Trophy, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { database, Sale, Purchase, User as UserType } from '@/lib/database';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

const AdminReports: React.FC = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(addDays(new Date(), -30)),
    to: endOfDay(new Date())
  });
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    totalPurchaseAmount: 0,
    salesByDay: [] as { date: string; ventas: number; ingresos: number }[],
    salesByCashier: [] as { name: string; sales: number; revenue: number }[],
    purchasesByCashier: [] as { name: string; purchases: number; amount: number }[],
    topCashier: null as { name: string; sales: number; revenue: number } | null
  });

  useEffect(() => {
    if (date?.from && date?.to) {
      generateReport();
    }
  }, [date]);

  const generateReport = async () => {
    if (!date?.from || !date?.to) return;

    try {
      const [sales, purchases, cashiers] = await Promise.all([
        database.getSalesByDateRange(date.from, date.to),
        database.getPurchasesByDateRange(date.from, date.to),
        database.getAllCashiers()
      ]);

      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalPurchases = purchases.length;
      const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + (purchase.quantity * purchase.purchasePrice), 0);

      // Generar datos por día
      const salesByDayMap = new Map();
      
      sales.forEach(sale => {
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

      // Ventas por cajero
      const salesByCashierMap = new Map();
      sales.forEach(sale => {
        const cashier = cashiers.find(c => c.id === sale.cashierId);
        const cashierName = cashier ? cashier.fullName || cashier.username : 'Desconocido';
        
        if (!salesByCashierMap.has(cashierName)) {
          salesByCashierMap.set(cashierName, { sales: 0, revenue: 0 });
        }
        const cashierData = salesByCashierMap.get(cashierName);
        cashierData.sales += 1;
        cashierData.revenue += sale.total;
      });

      const salesByCashier = Array.from(salesByCashierMap.entries()).map(([name, data]) => ({
        name,
        sales: data.sales,
        revenue: data.revenue
      }));

      // Compras por cajero
      const purchasesByCashierMap = new Map();
      purchases.forEach(purchase => {
        const cashier = cashiers.find(c => c.id === purchase.cashierId);
        const cashierName = cashier ? cashier.fullName || cashier.username : 'Desconocido';
        
        if (!purchasesByCashierMap.has(cashierName)) {
          purchasesByCashierMap.set(cashierName, { purchases: 0, amount: 0 });
        }
        const cashierData = purchasesByCashierMap.get(cashierName);
        cashierData.purchases += 1;
        cashierData.amount += (purchase.quantity * purchase.purchasePrice);
      });

      const purchasesByCashier = Array.from(purchasesByCashierMap.entries()).map(([name, data]) => ({
        name,
        purchases: data.purchases,
        amount: data.amount
      })).filter(item => item.purchases > 0);

      // Encontrar el cajero con más ventas
      const topCashier = salesByCashier.length > 0 
        ? salesByCashier.reduce((prev, current) => 
            (prev.sales > current.sales) ? prev : current
          )
        : null;

      setReportData({
        totalSales,
        totalRevenue,
        totalPurchases,
        totalPurchaseAmount,
        salesByDay,
        salesByCashier,
        purchasesByCashier,
        topCashier
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
  };

  const exportReport = () => {
    console.log('Exportando reporte administrativo...');
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reportes Administrativos</h2>
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

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Ventas totales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {reportData.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos generados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Inversión Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {reportData.totalPurchaseAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total invertido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cajero destacado */}
      {reportData.topCashier && date?.from && date?.to && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <Crown className="h-5 w-5" />
              <span>Cajero del Período</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-800">
                    {reportData.topCashier.name}
                  </div>
                  <div className="text-sm text-orange-600">
                    Cajero con más ventas en el período
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-700">
                  {reportData.topCashier.sales} ventas
                </div>
                <div className="text-sm text-orange-600">
                  S/ {reportData.topCashier.revenue.toLocaleString()} en ingresos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pestañas para diferentes reportes */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="cashiers">Por Cajero</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ventas por Cajero</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.salesByCashier}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                    >
                      {reportData.salesByCashier.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Ventas']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashiers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Cajero</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.salesByCashier.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cajero</TableHead>
                        <TableHead>Ventas</TableHead>
                        <TableHead>Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.salesByCashier.map((cashier, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{cashier.name}</TableCell>
                          <TableCell>{cashier.sales}</TableCell>
                          <TableCell className="font-bold">S/ {cashier.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No hay datos de ventas por cajero</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compras por Cajero</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.purchasesByCashier.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cajero</TableHead>
                        <TableHead>Compras</TableHead>
                        <TableHead>Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.purchasesByCashier.map((cashier, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{cashier.name}</TableCell>
                          <TableCell>{cashier.purchases}</TableCell>
                          <TableCell className="font-bold">S/ {cashier.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No hay datos de compras por cajero</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.purchasesByCashier}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'amount' ? `S/ ${value}` : value,
                      name === 'purchases' ? 'Compras' : 'Monto (S/)'
                    ]}
                  />
                  <Bar dataKey="purchases" fill="#f59e0b" />
                  <Bar dataKey="amount" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
