import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Plus, UserPlus, Edit, Trash2, User } from 'lucide-react';
import { database, Customer } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dni?: string;
  description?: string;
}

const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CustomerFormData>();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const allCustomers = await database.getAllCustomers();
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsLoading(true);
      
      // Crear el objeto con todos los campos necesarios incluyendo createdAt
      const customerData = {
        ...data,
        createdAt: new Date()
      };
      
      if (editingCustomer) {
        await database.updateCustomer(editingCustomer.id!, data);
        toast({
          title: "Cliente actualizado",
          description: `${data.firstName} ${data.lastName} ha sido actualizado correctamente`,
        });
      } else {
        await database.createCustomer(customerData);
        toast({
          title: "Cliente agregado",
          description: `${data.firstName} ${data.lastName} ha sido agregado correctamente`,
        });
      }
      
      reset();
      setIsAddingCustomer(false);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setValue('firstName', customer.firstName);
    setValue('lastName', customer.lastName);
    setValue('email', customer.email || '');
    setValue('phone', customer.phone || '');
    setValue('dni', customer.dni || '');
    setValue('description', customer.description || '');
    setIsAddingCustomer(true);
  };

  const handleDelete = async (customerId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await database.deleteCustomer(customerId);
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado correctamente",
        });
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente",
          variant: "destructive",
        });
      }
    }
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.trim() === '') {
      await loadCustomers();
    } else {
      try {
        const searchResults = await database.searchCustomers(value);
        setCustomers(searchResults);
      } catch (error) {
        console.error('Error searching customers:', error);
      }
    }
  };

  const handleNewCustomer = () => {
    reset();
    setEditingCustomer(null);
    setIsAddingCustomer(true);
  };

  const handleCancel = () => {
    reset();
    setEditingCustomer(null);
    setIsAddingCustomer(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <User className="mr-2 h-6 w-6" />
          Gestión de Clientes
        </h2>
        <Sheet open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
          <SheetTrigger asChild>
            <Button onClick={handleNewCustomer} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {editingCustomer ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
              </SheetTitle>
              <SheetDescription>
                {editingCustomer 
                  ? 'Modifica los datos del cliente seleccionado' 
                  : 'Completa los datos para registrar un nuevo cliente'
                }
              </SheetDescription>
            </SheetHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombres *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName', { required: 'Los nombres son obligatorios' })}
                    placeholder="Nombres del cliente"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName', { required: 'Los apellidos son obligatorios' })}
                    placeholder="Apellidos del cliente"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="correo@ejemplo.com (opcional)"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="Número de teléfono (opcional)"
                />
              </div>

              <div>
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  {...register('dni')}
                  placeholder="Documento de identidad (opcional)"
                  maxLength={8}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Notas adicionales sobre el cliente (opcional)"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {editingCustomer ? 'Actualizar' : 'Guardar'} Cliente
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombres, apellidos, correo o DNI..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando clientes...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron clientes con ese criterio de búsqueda' : 'No hay clientes registrados'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombres</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.firstName}</TableCell>
                    <TableCell>{customer.lastName}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.dni || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(customer.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerManager;
