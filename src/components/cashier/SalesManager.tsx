
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, Plus, DollarSign } from 'lucide-react';
import { database, Product, Sale } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SalesManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [newSale, setNewSale] = useState({
    productId: '',
    quantity: '',
    salePrice: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allProducts = await database.getAllProducts();
      const userSales = await database.getSalesByUser(user?.id || 0);
      setProducts(allProducts.filter(p => p.currentStock > 0));
      setSales(userSales);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddSale = async () => {
    if (!newSale.productId || !newSale.quantity || !newSale.salePrice) {
      toast({
        title: "Error",
        description: "Producto, cantidad y precio son requeridos",
        variant: "destructive"
      });
      return;
    }

    const selectedProduct = products.find(p => p.id === parseInt(newSale.productId));
    if (!selectedProduct) return;

    const quantity = parseInt(newSale.quantity);
    if (quantity > selectedProduct.currentStock) {
      toast({
        title: "Error",
        description: "No hay suficiente stock disponible",
        variant: "destructive"
      });
      return;
    }

    try {
      const salePrice = parseFloat(newSale.salePrice);
      await database.createSale({
        productId: parseInt(newSale.productId),
        productName: selectedProduct.name,
        quantity: quantity,
        salePrice: salePrice,
        total: quantity * salePrice,
        cashierId: user?.id || 0,
        date: new Date()
      });

      toast({
        title: "Venta registrada",
        description: `Se registró la venta de ${quantity} ${selectedProduct.name}`
      });

      setNewSale({ productId: '', quantity: '', salePrice: '' });
      setIsAddingSale(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar la venta",
        variant: "destructive"
      });
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(newSale.productId));
  const total = newSale.quantity && newSale.salePrice 
    ? (parseInt(newSale.quantity) * parseFloat(newSale.salePrice)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h2>
        <Button 
          onClick={() => setIsAddingSale(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Venta
        </Button>
      </div>

      {/* Lista de ventas */}
      <div className="grid gap-4">
        {sales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{sale.productName}</h3>
                    <p className="text-gray-600 text-sm">
                      Cantidad: {sale.quantity} | Precio unitario: ${sale.salePrice}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    ${sale.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(sale.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sales.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No hay ventas registradas</p>
            <p className="text-gray-400 text-sm">Registra tu primera venta usando el botón de arriba</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para agregar venta */}
      <Dialog open={isAddingSale} onOpenChange={setIsAddingSale}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nueva Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="product">Producto *</Label>
              <Select
                value={newSale.productId}
                onValueChange={(value) => setNewSale({...newSale, productId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id!.toString()}>
                      {product.name} (Stock: {product.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProduct && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Stock disponible: <strong>{selectedProduct.currentStock}</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  max={selectedProduct?.currentStock || 0}
                  value={newSale.quantity}
                  onChange={(e) => setNewSale({...newSale, quantity: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price">Precio por Unidad *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newSale.salePrice}
                  onChange={(e) => setNewSale({...newSale, salePrice: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            {newSale.quantity && newSale.salePrice && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Total:</span>
                  <span className="text-blue-900 text-xl font-bold">${total}</span>
                </div>
              </div>
            )}

            <Button onClick={handleAddSale} className="w-full">
              Registrar Venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesManager;
