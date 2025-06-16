
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package } from 'lucide-react';
import { database } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ProductManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    imageUrl: '',
    minStock: '',
    currentStock: ''
  });

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.minStock) {
      toast({
        title: "Error",
        description: "Nombre y stock mínimo son requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      await database.addProduct({
        name: newProduct.name,
        description: newProduct.description || '',
        imageUrl: newProduct.imageUrl || '',
        price: 0, // Precio inicial será 0, se establecerá desde compras
        minStock: parseInt(newProduct.minStock),
        currentStock: newProduct.currentStock ? parseInt(newProduct.currentStock) : 0,
        createdBy: user?.username || 'cajero'
      });

      toast({
        title: "Producto agregado",
        description: `${newProduct.name} ha sido agregado al inventario`
      });

      setNewProduct({ name: '', description: '', imageUrl: '', minStock: '', currentStock: '' });
      setIsAddingProduct(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Gestión de Productos
          </span>
          <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="productName">Nombre del Producto *</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Stock Mínimo *</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                    placeholder="Cantidad mínima en inventario"
                  />
                </div>
                <div>
                  <Label htmlFor="currentStock">Stock Inicial (Opcional)</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min="0"
                    value={newProduct.currentStock}
                    onChange={(e) => setNewProduct({...newProduct, currentStock: e.target.value})}
                    placeholder="Cantidad inicial (por defecto 0)"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Descripción del producto"
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddProduct} className="w-full">
                  Agregar Producto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm">
          Agrega nuevos productos al inventario global. Todos los cajeros podrán ver y operar con estos productos.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Importante:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• El nombre y stock mínimo son obligatorios</li>
            <li>• El stock inicial es opcional (por defecto será 0)</li>
            <li>• El precio se establece al registrar compras</li>
            <li>• Los productos se comparten entre todos los cajeros</li>
            <li>• Las alertas aparecen cuando el stock actual ≤ stock mínimo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductManager;
