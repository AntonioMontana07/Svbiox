import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Plus, ShoppingBag, Trash2, ShoppingCart, Download, Trash } from 'lucide-react';
import { database, Product, Sale } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { generateSalesPDF } from '@/utils/pdfGenerator';

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  salePrice: number;
  availableStock: number;
  total: number;
}

const SalesManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'yape'>('efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [itemForm, setItemForm] = useState({
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
      console.error('Error cargando datos de ventas:', error);
    }
  };

  const addToCart = () => {
    if (!itemForm.productId || !itemForm.quantity || !itemForm.salePrice) {
      toast({
        title: "Error",
        description: "Producto, cantidad y precio de venta son requeridos",
        variant: "destructive"
      });
      return;
    }

    const product = products.find(p => p.id?.toString() === itemForm.productId);
    if (!product) {
      toast({
        title: "Error",
        description: "Producto no encontrado",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseInt(itemForm.quantity);
    const salePrice = parseFloat(itemForm.salePrice);

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.findIndex(item => item.productId === product.id);
    const existingQuantity = existingItemIndex >= 0 ? cart[existingItemIndex].quantity : 0;
    const totalQuantity = existingQuantity + quantity;

    if (totalQuantity > product.currentStock) {
      toast({
        title: "Error",
        description: `Stock insuficiente. Solo hay ${product.currentStock} unidades disponibles${existingQuantity > 0 ? ` (ya tienes ${existingQuantity} en el carrito)` : ''}`,
        variant: "destructive"
      });
      return;
    }

    const newItem: CartItem = {
      productId: product.id!,
      productName: product.name,
      quantity,
      salePrice,
      availableStock: product.currentStock,
      total: quantity * salePrice
    };

    if (existingItemIndex >= 0) {
      // Actualizar item existente
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: totalQuantity,
        salePrice, // Actualizar precio también
        total: totalQuantity * salePrice
      };
      setCart(updatedCart);
    } else {
      // Agregar nuevo item
      setCart([...cart, newItem]);
    }

    setItemForm({ productId: '', quantity: '', salePrice: '' });
    
    toast({
      title: "Producto agregado",
      description: `${quantity} ${product.name} agregado al carrito`
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast({
      title: "Producto removido",
      description: "Producto removido del carrito"
    });
  };

  const updateCartItem = (productId: number, field: 'quantity' | 'salePrice', value: string) => {
    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        const numValue = parseFloat(value) || 0;
        
        if (field === 'quantity') {
          if (numValue > item.availableStock) {
            toast({
              title: "Error",
              description: `Stock insuficiente. Solo hay ${item.availableStock} unidades disponibles`,
              variant: "destructive"
            });
            return item;
          }
          return {
            ...item,
            quantity: numValue,
            total: numValue * item.salePrice
          };
        } else {
          return {
            ...item,
            salePrice: numValue,
            total: item.quantity * numValue
          };
        }
      }
      return item;
    });
    setCart(updatedCart);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "El carrito está vacío",
        variant: "destructive"
      });
      return;
    }

    const totalSale = cart.reduce((sum, item) => sum + item.total, 0);

    // Validar efectivo
    if (paymentMethod === 'efectivo') {
      const received = parseFloat(amountReceived);
      if (!received || received < totalSale) {
        toast({
          title: "Error",
          description: "El monto recibido debe ser mayor o igual al total de la venta",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const createdSales: Sale[] = [];
      const change = paymentMethod === 'efectivo' ? parseFloat(amountReceived) - totalSale : 0;
      
      // Procesar cada item del carrito como una venta individual
      for (const item of cart) {
        const saleData = {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          salePrice: item.salePrice,
          total: item.total,
          paymentMethod,
          amountReceived: paymentMethod === 'efectivo' ? parseFloat(amountReceived) : undefined,
          change: paymentMethod === 'efectivo' ? change : undefined,
          cashierId: user?.id || 0,
          date: new Date()
        };
        
        const createdSale = await database.createSale(saleData);
        createdSales.push(createdSale);
      }

      toast({
        title: "Venta procesada exitosamente",
        description: `Venta total por S/ ${totalSale.toFixed(2)} registrada. ${cart.length} productos vendidos.${paymentMethod === 'efectivo' ? ` Cambio: S/ ${change.toFixed(2)}` : ''}`
      });

      // Generar PDF automáticamente con todos los productos de la venta
      if (createdSales.length > 0) {
        try {
          await generateSalesPDF(createdSales, user);
          toast({
            title: "Boleta generada",
            description: "La boleta ha sido descargada automáticamente"
          });
        } catch (error) {
          console.error('Error generando PDF:', error);
        }
      }

      setCart([]);
      setPaymentMethod('efectivo');
      setAmountReceived('');
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la venta",
        variant: "destructive"
      });
    }
  };

  const deleteSale = async (saleId: number) => {
    try {
      await database.deleteSale(saleId);
      toast({
        title: "Venta eliminada",
        description: "La venta ha sido eliminada completamente del sistema"
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la venta",
        variant: "destructive"
      });
    }
  };

  const downloadSalesPDF = async (sale: Sale) => {
    try {
      await generateSalesPDF([sale], user);
      toast({
        title: "PDF generado",
        description: "La boleta ha sido descargada exitosamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive"
      });
    }
  };

  const selectedProduct = products.find(p => p.id?.toString() === itemForm.productId);
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartSubtotal = cartTotal / 1.18;
  const cartIGV = cartTotal - cartSubtotal;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h2>
      </div>

      {/* Formulario para agregar productos al carrito */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Agregar Producto a la Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="product">Producto</Label>
              <Select value={itemForm.productId} onValueChange={(value) => setItemForm({...itemForm, productId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.currentStock > 0).map(product => (
                    <SelectItem key={product.id} value={product.id!.toString()}>
                      {product.name} (Stock: {product.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  Stock disponible: {selectedProduct.currentStock} unidades
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.currentStock || 0}
                value={itemForm.quantity}
                onChange={(e) => setItemForm({...itemForm, quantity: e.target.value})}
                placeholder="Cantidad"
              />
            </div>
            <div>
              <Label htmlFor="salePrice">Precio Unitario - S/</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                value={itemForm.salePrice}
                onChange={(e) => setItemForm({...itemForm, salePrice: e.target.value})}
                placeholder="Precio por unidad"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addToCart} className="w-full bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Agregar al Carrito
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carrito de compras */}
      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Carrito de Venta ({cart.length} productos)
              </div>
              <div className="text-lg font-bold text-green-700">
                Total: S/ {cartTotal.toFixed(2)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tabla de productos */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        max={item.availableStock}
                        value={item.quantity}
                        onChange={(e) => updateCartItem(item.productId, 'quantity', e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.salePrice}
                        onChange={(e) => updateCartItem(item.productId, 'salePrice', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="font-bold">
                      S/ {item.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Totales */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Subtotal:</span>
                <span>S/ {cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>IGV (18%):</span>
                <span>S/ {cartIGV.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>S/ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={(value: 'efectivo' | 'tarjeta' | 'yape') => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="yape">Yape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo para efectivo */}
              {paymentMethod === 'efectivo' && (
                <div>
                  <Label htmlFor="amountReceived">Monto Recibido - S/</Label>
                  <Input
                    id="amountReceived"
                    type="number"
                    step="0.01"
                    min={cartTotal}
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Ingrese el monto recibido"
                  />
                  {amountReceived && parseFloat(amountReceived) >= cartTotal && (
                    <p className="text-sm text-green-600 mt-1">
                      Cambio: S/ {(parseFloat(amountReceived) - cartTotal).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={processSale} className="bg-blue-600 hover:bg-blue-700" size="lg">
                <TrendingUp className="mr-2 h-4 w-4" />
                Procesar Venta - S/ {cartTotal.toFixed(2)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" />
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
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 10).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>{sale.productName}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>S/ {sale.salePrice.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">
                      S/ {sale.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Completada
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSalesPDF(sale)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSale(sale.id!)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
