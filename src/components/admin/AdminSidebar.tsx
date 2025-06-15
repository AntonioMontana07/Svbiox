
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, BarChart3, Package, LogOut } from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'summary',
      title: 'Resumen',
      icon: TrendingUp,
      description: 'Panel principal'
    },
    {
      id: 'cashiers',
      title: 'Cajeros',
      icon: Users,
      description: 'Gestionar cajeros'
    },
    {
      id: 'reports',
      title: 'Reportes',
      icon: BarChart3,
      description: 'Reportes del sistema'
    },
    {
      id: 'inventory',
      title: 'Inventario',
      icon: Package,
      description: 'Gestionar inventario'
    }
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-600 font-semibold">
            Sistema BIOX+
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-2">
              <div className="text-sm text-gray-600">
                <strong>{user?.fullName || user?.username}</strong>
              </div>
              <div className="text-xs text-gray-500">Administrador</div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Panel de Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span>{item.title}</span>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <Button
              onClick={logout}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
