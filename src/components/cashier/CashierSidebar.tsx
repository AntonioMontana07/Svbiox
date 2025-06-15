
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, TrendingUp, Package, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CashierSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const CashierSidebar: React.FC<CashierSidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: "Resumen",
      value: "summary",
      icon: Home,
    },
    {
      title: "Inventario",
      value: "inventory",
      icon: Package,
    },
    {
      title: "Compras",
      value: "purchases",
      icon: ShoppingCart,
    },
    {
      title: "Ventas",
      value: "sales",
      icon: TrendingUp,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-gray-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">BIOX+</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg">Cajero</h2>
            <p className="text-sm text-gray-600">{user?.fullName || user?.username}</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.value)}
                    isActive={activeTab === item.value}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          onClick={logout}
          variant="outline"
          className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CashierSidebar;
