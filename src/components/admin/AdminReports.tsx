
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, User } from 'lucide-react';
import { database, Sale, User as UserType } from '@/lib/database';

const AdminReports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashiers, setCashiers] = useState<UserType[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    cashierId: ''
  });
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    salesByDay: [],
    salesByCashier: [],
    topProducts: []
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [sales, filters]);

  const loadInitialData = async () => {
    try {
      const [allSales, allCashiers] = await Promise.all([
        database.getAllSales(),
        database.getAllCashiers()
      ]);
      setSales(allSales);
      setCashiers(allCashiers);
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const generateReport = () => {
    let filteredSales = sales;

    // Aplicar filtros
    if (filters.startDate) {
      filteredSales = filteredSales.filter(sale => 
        new Date(sale.date) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filteredSales = filteredSales.filter(sale => 
        new Date(sale.date) <= new Date(filters.endDate)
      );
    }
    if (filters.cashierId) {
      filteredSales = filteredSales.filter(sale => 
        sale.cashierId.toString() === filters.cashierId
      );
    }

    // Calcular métricas
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

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
    }, []).slice(-7); // Últimos 7 días

    // Ventas por cajero
    const salesByCashier = cashiers.map(cashier => {
      const cashierSales = filteredSales.filter(sale => sale.cashierId === cashier.id);
      return {
        name: cashier.fullName || cashier.username,
        sales: cashierSales.length,
        revenue: cashierSales.reduce((sum, sale) => sum + sale.total, 0)
      };
    }).filter(item => item.sales > 0);

    setReportData({
      totalSales,
      totalRevenue,
      salesByDay,
      salesByCashier,
      topProducts: [] // Se implementará cuando tengamos más datos
    });
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', cashierId: '' });
  };

  const COLORS = ['#8B5CF6', '#6B7280', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reportes de Ventas</h2>
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
            <div className="text-gray-600">Ingresos Totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${reportData.totalSales > 0 ? (reportData.totalRevenue / reportData.totalSales).toFixed(2) : '0'}
            </div>
            <div className="text-gray-600">Promedio por Venta</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-600">{reportData.salesByCashier.length}</div>
            <div className="text-gray-600">Cajeros Activos</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
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
    </div>
  );
};

export default AdminReports;
