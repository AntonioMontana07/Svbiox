
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Package } from 'lucide-react';
import { database, Product } from '@/lib/database';

interface StockAlertsProps {
  onClose?: () => void;
}

const StockAlerts: React.FC<StockAlertsProps> = ({ onClose }) => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkStockAlerts();
  }, []);

  const checkStockAlerts = async () => {
    try {
      const alerts = await database.getCriticalStockAlerts();
      setLowStockProducts(alerts);
      setIsVisible(alerts.length > 0);
    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible || lowStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      <Alert className="border-red-200 bg-red-50 shadow-lg">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <AlertTitle className="text-red-800 font-semibold">
              ¡Alerta de Stock Crítico!
            </AlertTitle>
            <AlertDescription className="text-red-700 mt-2">
              {lowStockProducts.length === 1 ? (
                <>Hay <strong>1 producto</strong> con stock crítico:</>
              ) : (
                <>Hay <strong>{lowStockProducts.length} productos</strong> con stock crítico:</>
              )}
              
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between bg-white/50 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-sm">{product.name}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {product.currentStock}/{product.minStock}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <p className="text-sm mt-3">
                Es necesario reabastecer estos productos lo antes posible.
              </p>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-red-600 hover:text-red-800 hover:bg-red-100 h-6 w-6 p-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default StockAlerts;
