import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, UserPlus, Shield, ShieldX } from 'lucide-react';
import { database, User as UserType } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

const CashierManagement: React.FC = () => {
  const [cashiers, setCashiers] = useState<UserType[]>([]);
  const [isAddingCashier, setIsAddingCashier] = useState(false);
  const [newCashier, setNewCashier] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
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
    if (!newCashier.username || !newCashier.password || !newCashier.email) {
      toast({
        title: "Error",
        description: "Usuario, email y contraseña son requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      await database.addUser({
        username: newCashier.username,
        email: newCashier.email,
        password: newCashier.password,
        role: 'cashier',
        fullName: newCashier.fullName || newCashier.username,
        isActive: true
      });

      toast({
        title: "Cajero agregado",
        description: `${newCashier.username} ha sido agregado exitosamente`
      });

      setNewCashier({ username: '', email: '', password: '', fullName: '' });
      setIsAddingCashier(false);
      loadCashiers();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el cajero",
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
              Agregar Cajero
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cajero</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  value={newCashier.username}
                  onChange={(e) => setNewCashier({...newCashier, username: e.target.value})}
                  placeholder="Nombre de usuario"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCashier.email}
                  onChange={(e) => setNewCashier({...newCashier, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newCashier.password}
                  onChange={(e) => setNewCashier({...newCashier, password: e.target.value})}
                  placeholder="Contraseña"
                />
              </div>
              <div>
                <Label htmlFor="fullName">Nombre Completo (Opcional)</Label>
                <Input
                  id="fullName"
                  value={newCashier.fullName}
                  onChange={(e) => setNewCashier({...newCashier, fullName: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              <Button onClick={handleAddCashier} className="w-full">
                Agregar Cajero
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
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-medium ${cashier.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {cashier.isActive ? 'Activo' : 'Inactivo'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cashier.isActive ? 'Operativo' : 'Suspendido'}
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
            <p className="text-gray-400 text-sm">Agrega tu primer cajero usando el botón de arriba</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashierManagement;
