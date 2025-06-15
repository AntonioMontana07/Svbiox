
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, UserPlus, Shield, ShieldX, UserCog } from 'lucide-react';
import { database, User as UserType } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

const CashierManagement: React.FC = () => {
  const [cashiers, setCashiers] = useState<UserType[]>([]);
  const [isAddingCashier, setIsAddingCashier] = useState(false);
  const [newCashier, setNewCashier] = useState({
    fullName: '',
    username: '',
    email: '',
    password: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCashiers();
  }, []);

  const loadCashiers = async () => {
    try {
      const allCashiers = await database.getAllCashiers();
      setCashiers(allCashiers);
    } catch (error) {
      console.error('Error loading cashiers:', error);
    }
  };

  const handleAddCashier = async () => {
    if (!newCashier.fullName || !newCashier.username || !newCashier.password || !newCashier.email) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      await database.addUser({
        username: newCashier.username,
        email: newCashier.email,
        passwordHash: newCashier.password, // Use passwordHash instead of password
        role: 'cashier',
        fullName: newCashier.fullName,
        isActive: true
      });

      toast({
        title: "Cajero registrado exitosamente",
        description: `${newCashier.fullName} ha sido agregado como cajero y puede ingresar al sistema`
      });

      setNewCashier({ fullName: '', username: '', email: '', password: '' });
      setIsAddingCashier(false);
      loadCashiers();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el cajero. Verifique que el usuario no exista",
        variant: "destructive"
      });
    }
  };

  const toggleCashierStatus = async (cashierId: number, currentStatus: boolean) => {
    try {
      await database.updateCashierStatus(cashierId, !currentStatus);
      toast({
        title: currentStatus ? "Cajero desactivado" : "Cajero activado",
        description: "Estado actualizado exitosamente"
      });
      loadCashiers();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del cajero",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Cajeros</h2>
        <Dialog open={isAddingCashier} onOpenChange={setIsAddingCashier}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Registrar Nuevo Cajero
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserCog className="mr-2 h-5 w-5 text-purple-600" />
                Registro de Cajero
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Información Personal */}
              <div className="space-y-3">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Información Personal
                  </h3>
                </div>
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Nombre Completo *
                  </Label>
                  <Input
                    id="fullName"
                    value={newCashier.fullName}
                    onChange={(e) => setNewCashier({...newCashier, fullName: e.target.value})}
                    placeholder="Ej: María González López"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Correo Electrónico *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCashier.email}
                    onChange={(e) => setNewCashier({...newCashier, email: e.target.value})}
                    placeholder="maria.gonzalez@empresa.com"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Credenciales de Acceso */}
              <div className="space-y-3">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Credenciales de Acceso
                  </h3>
                </div>
                <div>
                  <Label htmlFor="username" className="text-sm font-medium">
                    Usuario *
                  </Label>
                  <Input
                    id="username"
                    value={newCashier.username}
                    onChange={(e) => setNewCashier({...newCashier, username: e.target.value})}
                    placeholder="maria.gonzalez"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este será el usuario para ingresar al sistema
                  </p>
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newCashier.password}
                    onChange={(e) => setNewCashier({...newCashier, password: e.target.value})}
                    placeholder="Contraseña segura"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 6 caracteres recomendado
                  </p>
                </div>
              </div>

              {/* Información del Rol */}
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Rol: Cajero</span>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Tendrá acceso a ventas, compras e inventario
                </p>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Los datos se guardarán localmente en el sistema. El cajero podrá ingresar 
                  inmediatamente con las credenciales proporcionadas.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleAddCashier} 
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar Cajero
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {cashiers.map((cashier) => (
          <Card key={cashier.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${cashier.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {cashier.isActive ? (
                      <Shield className="h-6 w-6 text-green-600" />
                    ) : (
                      <ShieldX className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{cashier.fullName || cashier.username}</h3>
                    <p className="text-gray-600">@{cashier.username}</p>
                    <p className="text-gray-500 text-sm">{cashier.email}</p>
                    <div className="flex items-center mt-1">
                      <Shield className="h-3 w-3 text-purple-600 mr-1" />
                      <span className="text-xs text-purple-600 font-medium">Cajero</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-medium ${cashier.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {cashier.isActive ? 'Activo' : 'Inactivo'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cashier.isActive ? 'Puede ingresar' : 'Acceso bloqueado'}
                    </p>
                  </div>
                  <Switch
                    checked={cashier.isActive}
                    onCheckedChange={() => toggleCashierStatus(cashier.id!, cashier.isActive)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cashiers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No hay cajeros registrados</p>
            <p className="text-gray-400 text-sm">Registra tu primer cajero usando el botón de arriba</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashierManagement;
