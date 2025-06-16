
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Package } from 'lucide-react';
import { database, Product, Purchase } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const PurchaseManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseForm, setPurchaseForm] = useState({
    productId: '',
    quantity: '',
    purchasePrice: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allProducts, userPurchases] = await Promise.all([
        database.getAllProducts(),
        database.getPurchasesByUser(user?.id || 0)
      ]);
      setProducts(allProducts);
      setPurchases(userPurchases);
    } catch (error) {
      console.error('Error cargando datos de compras:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    }
  };

  const handlePurchase = async () => {
    console.log('Iniciando registro de compra...');
    console.log('Form data:', purchaseForm);
    console.log('User:', user);

    // Validaciones mejoradas
    if (!purchaseForm.productId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un producto",
        variant: "destructive"
      });
      return;
    }

    if (!purchaseForm.quantity || parseInt(purchaseForm.quantity) <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }

    if (!purchaseForm.purchasePrice || parseFloat(purchaseForm.purchasePrice) <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Usuario no válido",
        variant: "destructive"
      });
      return;
    }

    const product = products.find(p => p.id?.toString() === purchaseForm.productId);
    if (!product) {
      toast({
        title: "Error",
        description: "Producto no encontrado",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseInt(purchaseForm.quantity);
    const purchasePrice = parseFloat(purchaseForm.purchasePrice);

    setIsLoading(true);
    console.log('Creando compra con datos:', {
      productId: product.id!,
      productName: product.name,
      quantity,
      purchasePrice,
      description: purchaseForm.description || '',
      cashierId: user.id,
      date: new Date()
    });

    try {
      const purchaseData = {
        productId: product.id!,
        productName: product.name,
        quantity,
        purchasePrice,
        description: purchaseForm.description || '',
        cashierId: user.id,
        date: new Date()
      };

      const purchaseId = await database.createPurchase(purchaseData);
      console.log('Compra creada con ID:', purchaseId);

      toast({
        title: "Compra registrada",
        description: `Compra de ${quantity} ${product.name} registrada exitosamente. Inventario actualizado.`
      });

      setPurchaseForm({ productId: '', quantity: '', purchasePrice: '', description: '' });
      await loadData(); // Recargar datos
    } catch (error) {
      console.error('Error registrando compra:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar la compra",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id?.toString() === purchaseForm.productId);
  const calculatedTotal = purchaseForm.quantity && purchaseForm.purchasePrice ? 
    (parseInt(purchaseForm.quantity) * parseFloat(purchaseForm.purchasePrice)).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Compras</h2>
      </div>

      {/* Formulario de compra */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Registrar Nueva Compra
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Producto</Label>
              <Select value={purchaseForm.productId} onValueChange={(value) => setPurchaseForm({...purchaseForm, productId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id!.toString()}>
                      {product.name} (Stock actual: {product.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  Stock actual: {selectedProduct.currentStock} | Mínimo: {selectedProduct.minStock}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={purchaseForm.quantity}
                onChange={(e) => setPurchaseForm({...purchaseForm, quantity: e.target.value})}
                placeholder="Cantidad comprada"
              />
            </div>
            <div>
              <Label htmlFor="purchasePrice">Precio de Compra (Unitario) - S/</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={purchaseForm.purchasePrice}
                onChange={(e) => setPurchaseForm({...purchaseForm, purchasePrice: e.target.value})}
                placeholder="Precio por unidad en soles"
              />
            </div>
            <div>
              <Label>Total de la Compra</Label>
              <div className="p-2 bg-blue-50 rounded-md border">
                <span className="text-lg font-bold text-blue-700">
                  S/ {calculatedTotal}
                </span>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={purchaseForm.description}
              onChange={(e) => setPurchaseForm({...purchaseForm, description: e.target.value})}
              placeholder="Notas adicionales sobre la compra..."
              rows={3}
            />
          </div>
          <Button 
            onClick={handlePurchase} 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isLoading ? 'Registrando...' : 'Registrar Compra (Actualiza Inventario Global)'}
          </Button>
        </CardContent>
      </Card>

      {/* Historial de compras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Mi Historial de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length > 0 ? (
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
                {purchases.slice(0, 10).map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                    <TableCell>{purchase.productName}</TableCell>
                    <TableCell>{purchase.quantity}</TableCell>
                    <TableCell>S/ {purchase.purchasePrice.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">
                      S/ {(purchase.quantity * purchase.purchasePrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        Procesada
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No has registrado compras aún</p>
              <p className="text-gray-400 text-sm">Las compras aparecerán aquí una vez registradas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseManager;
