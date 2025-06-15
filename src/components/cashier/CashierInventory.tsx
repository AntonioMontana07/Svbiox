
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package, Search } from 'lucide-react';
import { database, Product } from '@/lib/database';

const CashierInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= product.minStock) {
      return { label: 'Stock Crítico', color: 'bg-red-100 text-red-800' };
    } else if (product.currentStock <= product.minStock * 1.5) {
      return { label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Stock Normal', color: 'bg-green-100 text-green-800' };
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inventario Disponible</h2>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de productos */}
      <div className="grid gap-4">
        {filteredProducts.map((product) => {
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
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && searchTerm && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No se encontraron productos</p>
            <p className="text-gray-400 text-sm">Intenta con otro término de búsqueda</p>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No hay productos en el inventario</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashierInventory;
