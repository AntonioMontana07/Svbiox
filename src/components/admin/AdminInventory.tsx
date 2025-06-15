
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { database, Product } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    minStock: 0,
    currentStock: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await database.getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) {
      toast({
        title: "Error",
        description: "El nombre del producto es requerido",
        variant: "destructive"
      });
      return;
    }

    try {
      await database.addProduct({
        name: newProduct.name,
        description: newProduct.description,
        minStock: newProduct.minStock,
        currentStock: newProduct.currentStock,
        createdBy: 'admin'
      });

      toast({
        title: "Producto agregado",
        description: `${newProduct.name} ha sido agregado al inventario`
      });

      setNewProduct({ name: '', description: '', minStock: 0, currentStock: 0 });
      setIsAddingProduct(false);
      loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editingProduct.name) {
      toast({
        title: "Error",
        description: "El nombre del producto es requerido",
        variant: "destructive"
      });
      return;
    }

    try {
      await database.updateProduct(editingProduct.id!, editingProduct);

      toast({
        title: "Producto actualizado",
        description: `${editingProduct.name} ha sido actualizado`
      });

      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await database.deleteProduct(productId);
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del inventario"
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive"
      });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= product.minStock) {
      return { label: 'Stock Crítico', color: 'bg-red-100 text-red-800' };
    } else if (product.currentStock <= product.minStock * 1.5) {
      return { label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Stock Normal', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inventario Global</h2>
        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Descripción del producto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStock">Stock Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="currentStock">Stock Inicial</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    value={newProduct.currentStock}
                    onChange={(e) => setNewProduct({...newProduct, currentStock: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button onClick={handleAddProduct} className="w-full">
                Agregar Producto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Productos con stock crítico */}
      {products.filter(p => p.currentStock <= p.minStock).length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>¡Atención!</strong> Hay {products.filter(p => p.currentStock <= p.minStock).length} producto(s) con stock crítico.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de productos */}
      <div className="grid gap-4">
        {products.map((product) => {
          const status = getStockStatus(product);
          return (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm">{product.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Stock actual: <strong>{product.currentStock}</strong>
                        </span>
                        <span className="text-sm text-gray-500">
                          Stock mínimo: <strong>{product.minStock}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No hay productos en el inventario</p>
            <p className="text-gray-400 text-sm">Agrega tu primer producto usando el botón de arriba</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para editar producto */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="edit-name">Nombre del Producto</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  placeholder="Descripción del producto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-minStock">Stock Mínimo</Label>
                  <Input
                    id="edit-minStock"
                    type="number"
                    value={editingProduct.minStock}
                    onChange={(e) => setEditingProduct({...editingProduct, minStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-currentStock">Stock Actual</Label>
                  <Input
                    id="edit-currentStock"
                    type="number"
                    value={editingProduct.currentStock}
                    onChange={(e) => setEditingProduct({...editingProduct, currentStock: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <Button onClick={handleEditProduct} className="w-full">
                Actualizar Producto
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventory;
