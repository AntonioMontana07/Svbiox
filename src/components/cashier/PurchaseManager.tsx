
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Plus, Package } from 'lucide-react';
import { database, Product, Purchase } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const PurchaseManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    productId: '',
    quantity: '',
    purchasePrice: '',
    description: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allProducts = await database.getAllProducts();
      const userPurchases = await database.getPurchasesByUser(user?.id || 0);
      setProducts(allProducts);
      setPurchases(userPurchases);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddPurchase = async () => {
    if (!newPurchase.productId || !newPurchase.quantity || !newPurchase.purchasePrice) {
      toast({
        title: "Error",
        description: "Producto, cantidad y precio son requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedProduct = products.find(p => p.id === parseInt(newPurchase.productId));
      if (!selectedProduct) return;

      await database.createPurchase({
        productId: parseInt(newPurchase.productId),
        productName: selectedProduct.name,
        quantity: parseInt(newPurchase.quantity),
        purchasePrice: parseFloat(newPurchase.purchasePrice),
        description: newPurchase.description,
        cashierId: user?.id || 0,
        date: new Date()
      });

      toast({
        title: "Compra registrada",
        description: `Se registró la compra de ${newPurchase.quantity} ${selectedProduct.name}`
      });

      setNewPurchase({ productId: '', quantity: '', purchasePrice: '', description: '' });
      setIsAddingPurchase(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar la compra",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Compras</h2>
        <Button 
          onClick={() => setIsAddingPurchase(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Compra
        </Button>
      </div>

      {/* Lista de compras */}
      <div className="grid gap-4">
        {purchases.map((purchase) => (
          <Card key={purchase.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{purchase.productName}</h3>
                    <p className="text-gray-600 text-sm">
                      Cantidad: {purchase.quantity} | Precio: ${purchase.purchasePrice}
                    </p>
                    {purchase.description && (
                      <p className="text-gray-500 text-sm">{purchase.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ${(purchase.quantity * purchase.purchasePrice).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(purchase.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {purchases.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No hay compras registradas</p>
            <p className="text-gray-400 text-sm">Registra tu primera compra usando el botón de arriba</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para agregar compra */}
      <Dialog open={isAddingPurchase} onOpenChange={setIsAddingPurchase}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nueva Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="product">Producto *</Label>
              <Select
                value={newPurchase.productId}
                onValueChange={(value) => setNewPurchase({...newPurchase, productId: value})}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newPurchase.quantity}
                  onChange={(e) => setNewPurchase({...newPurchase, quantity: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price">Precio por Unidad *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newPurchase.purchasePrice}
                  onChange={(e) => setNewPurchase({...newPurchase, purchasePrice: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                value={newPurchase.description}
                onChange={(e) => setNewPurchase({...newPurchase, description: e.target.value})}
                placeholder="Detalles adicionales de la compra"
              />
            </div>
            <Button onClick={handleAddPurchase} className="w-full">
              Registrar Compra
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseManager;
