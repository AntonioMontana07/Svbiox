
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Plus, ShoppingCart } from 'lucide-react';
import { database, Product, Sale } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SalesManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleForm, setSaleForm] = useState({
    productId: '',
    quantity: '',
    salePrice: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allProducts, userSales] = await Promise.all([
        database.getAllProducts(),
        database.getSalesByUser(user?.id || 0)
      ]);
      setProducts(allProducts);
      setSales(userSales);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const handleSale = async () => {
    if (!saleForm.productId || !saleForm.quantity || !saleForm.salePrice) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive"
      });
      return;
    }

    const product = products.find(p => p.id?.toString() === saleForm.productId);
    if (!product) {
      toast({
        title: "Error",
        description: "Producto no encontrado",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseInt(saleForm.quantity);
    const salePrice = parseFloat(saleForm.salePrice);

    if (quantity > product.currentStock) {
      toast({
        title: "Error",
        description: `Stock insuficiente. Disponible: ${product.currentStock}`,
        variant: "destructive"
      });
      return;
    }

    const total = quantity * salePrice;

    try {
      await database.createSale({
        productId: product.id!,
        productName: product.name,
        quantity,
        salePrice,
        total,
        cashierId: user?.id || 0,
        date: new Date()
      });

      toast({
        title: "Venta registrada",
        description: `Venta de ${quantity} ${product.name} por $${total.toFixed(2)}`
      });

      setSaleForm({ productId: '', quantity: '', salePrice: '' });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar la venta",
        variant: "destructive"
      });
    }
  };

  const selectedProduct = products.find(p => p.id?.toString() === saleForm.productId);
  const calculatedTotal = saleForm.quantity && saleForm.salePrice ? 
    (parseInt(saleForm.quantity) * parseFloat(saleForm.salePrice)).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h2>
      </div>

      {/* Formulario de venta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Registrar Nueva Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="product">Producto</Label>
              <Select value={saleForm.productId} onValueChange={(value) => setSaleForm({...saleForm, productId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(product => product.currentStock > 0).map(product => (
                    <SelectItem key={product.id} value={product.id!.toString()}>
                      {product.name} (Stock: {product.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.currentStock || 0}
                value={saleForm.quantity}
                onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})}
                placeholder="Cantidad a vender"
              />
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  Disponible: {selectedProduct.currentStock}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="salePrice">Precio de Venta</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                value={saleForm.salePrice}
                onChange={(e) => setSaleForm({...saleForm, salePrice: e.target.value})}
                placeholder="Precio unitario"
              />
            </div>
            <div>
              <Label>Total Calculado</Label>
              <div className="p-2 bg-green-50 rounded-md border">
                <span className="text-lg font-bold text-green-700">
                  ${calculatedTotal}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={handleSale} className="w-full bg-blue-600 hover:bg-blue-700">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Registrar Venta
          </Button>
        </CardContent>
      </Card>

      {/* Historial de ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Mi Historial de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 10).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>{sale.productName}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>${sale.salePrice.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">${sale.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Completada
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No has registrado ventas aún</p>
              <p className="text-gray-400 text-sm">Las ventas aparecerán aquí una vez registradas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesManager;
