
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, User, Activity } from 'lucide-react';
import { database, Sale, Purchase, User as UserType, ActivityLog } from '@/lib/database';

const AdminReports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cashiers, setCashiers] = useState<UserType[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    cashierId: ''
  });
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    totalPurchaseAmount: 0,
    salesByDay: [],
    salesByCashier: [],
    purchasesByCashier: []
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [sales, purchases, filters]);

  const loadInitialData = async () => {
    try {
      const [allSales, allPurchases, allCashiers, logs] = await Promise.all([
        database.getAllSales(),
        database.getAllPurchases(),
        database.getAllCashiers(),
        database.getActivityLogs()
      ]);
      setSales(allSales);
      setPurchases(allPurchases);
      setCashiers(allCashiers);
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const applyDateFilter = (items: any[]) => {
    let filtered = items;
    
    if (filters.startDate) {
      filtered = filtered.filter(item => 
        new Date(item.date) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(item => 
        new Date(item.date) <= new Date(filters.endDate)
      );
    }
    if (filters.cashierId) {
      filtered = filtered.filter(item => 
        item.cashierId?.toString() === filters.cashierId
      );
    }
    
    return filtered;
  };

  const generateReport = () => {
    const filteredSales = applyDateFilter(sales);
    const filteredPurchases = applyDateFilter(purchases);

    // Calcular métricas
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPurchases = filteredPurchases.length;
    const totalPurchaseAmount = filteredPurchases.reduce((sum, purchase) => sum + (purchase.quantity * purchase.purchasePrice), 0);

    // Ventas por día
    const salesByDay = filteredSales.reduce((acc: any, sale) => {
      const date = new Date(sale.date).toLocaleDateString();
      const existing = acc.find((item: any) => item.date === date);
      if (existing) {
        existing.sales += 1;
        existing.revenue += sale.total;
      } else {
        acc.push({ date, sales: 1, revenue: sale.total });
      }
      return acc;
    }, []).slice(-7);

    // Ventas por cajero
    const salesByCashier = cashiers.map(cashier => {
      const cashierSales = filteredSales.filter(sale => sale.cashierId === cashier.id);
      return {
        name: cashier.fullName || cashier.username,
        sales: cashierSales.length,
        revenue: cashierSales.reduce((sum, sale) => sum + sale.total, 0)
      };
    }).filter(item => item.sales > 0);

    // Compras por cajero
    const purchasesByCashier = cashiers.map(cashier => {
      const cashierPurchases = filteredPurchases.filter(purchase => purchase.cashierId === cashier.id);
      return {
        name: cashier.fullName || cashier.username,
        purchases: cashierPurchases.length,
        amount: cashierPurchases.reduce((sum, purchase) => sum + (purchase.quantity * purchase.purchasePrice), 0)
      };
    }).filter(item => item.purchases > 0);

    setReportData({
      totalSales,
      totalRevenue,
      totalPurchases,
      totalPurchaseAmount,
      salesByDay,
      salesByCashier,
      purchasesByCashier
    });
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', cashierId: '' });
  };

  const COLORS = ['#8B5CF6', '#6B7280', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reportes del Sistema</h2>
        <Button variant="outline" className="border-purple-600 text-purple-600">
          <Download className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Filtros de Reporte</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate" className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Fecha Inicio</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Fecha Fin</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div>
              <Label className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Cajero</span>
              </Label>
              <Select value={filters.cashierId} onValueChange={(value) => setFilters({...filters, cashierId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cajeros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los cajeros</SelectItem>
                  {cashiers.map(cashier => (
                    <SelectItem key={cashier.id} value={cashier.id!.toString()}>
                      {cashier.fullName || cashier.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{reportData.totalSales}</div>
            <div className="text-gray-600">Ventas Totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              ${reportData.totalRevenue.toLocaleString()}
            </div>
            <div className="text-gray-600">Ingresos por Ventas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{reportData.totalPurchases}</div>
            <div className="text-gray-600">Compras Totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${reportData.totalPurchaseAmount.toLocaleString()}
            </div>
            <div className="text-gray-600">Gastos en Compras</div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas para diferentes reportes */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="sales">Detalle de Ventas</TabsTrigger>
          <TabsTrigger value="purchases">Detalle de Compras</TabsTrigger>
          <TabsTrigger value="activity">Historial de Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <Tooltip />
                    <Bar dataKey="sales" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas por Cajero</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.salesByCashier}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                      label={({name, sales}) => `${name}: ${sales}`}
                    >
                      {reportData.salesByCashier.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Cajero</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applyDateFilter(sales).slice(0, 20).map((sale) => {
                    const cashier = cashiers.find(c => c.id === sale.cashierId);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.productName}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>${sale.salePrice}</TableCell>
                        <TableCell>${sale.total}</TableCell>
                        <TableCell>{cashier?.fullName || cashier?.username || 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Cajero</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applyDateFilter(purchases).slice(0, 20).map((purchase) => {
                    const cashier = cashiers.find(c => c.id === purchase.cashierId);
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                        <TableCell>{purchase.productName}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>${purchase.purchasePrice}</TableCell>
                        <TableCell>${purchase.quantity * purchase.purchasePrice}</TableCell>
                        <TableCell>{cashier?.fullName || cashier?.username || 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Historial de Actividad</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.slice(0, 50).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.date).toLocaleString()}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>ID: {log.userId}</TableCell>
                      <TableCell>
                        <Badge variant={log.userRole === 'admin' ? 'default' : 'secondary'}>
                          {log.userRole === 'admin' ? 'Administrador' : 'Cajero'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
