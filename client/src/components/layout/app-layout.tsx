import { ReactNode, useState } from 'react';
import { Sidebar } from './sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronLeft, Menu } from 'lucide-react';
import { 
  User, 
  ShieldCheck, 
  UserCog, 
  UserCheck, 
  DollarSign, 
  Users 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Função para obter o ícone correto com base no perfil do usuário
  const getUserRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return <ShieldCheck className="mr-2 h-4 w-4" />;
      case 'operacional':
        return <UserCog className="mr-2 h-4 w-4" />;
      case 'vendedor':
        return <UserCheck className="mr-2 h-4 w-4" />;
      case 'financeiro':
        return <DollarSign className="mr-2 h-4 w-4" />;
      case 'supervisor':
        return <Users className="mr-2 h-4 w-4" />;
      default:
        return <User className="mr-2 h-4 w-4" />;
    }
  };
  
  // Função para obter a variação da badge com base no perfil
  const getRoleBadgeVariant = () => {
    switch (user?.role) {
      case 'admin':
        return 'destructive';
      case 'operacional':
        return 'default';
      case 'vendedor':
        return 'secondary';
      case 'financeiro':
        return 'success';
      case 'supervisor':
        return 'outline';
      default:
        return 'default';
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
      {/* Sidebar com nova prop para controlar visibilidade */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className="flex flex-col flex-1 w-full">
        {/* Header mais responsivo com botão para toggle da sidebar */}
        <header className="flex items-center justify-between p-2 bg-background/90 backdrop-blur-sm shadow-sm border-b sticky top-0 z-30 h-14">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2"
              aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              {sidebarOpen && !isMobile ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <h1 className="text-lg font-semibold truncate hidden sm:block">Sistema de Gestão</h1>
          </div>

          {/* Indicador de usuário logado com menu dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  className="h-auto p-0 hover:bg-transparent"
                >
                  <Badge 
                    variant={getRoleBadgeVariant() as any}
                    className="flex items-center py-1.5 px-3 hover:opacity-90 transition-opacity"
                  >
                    {getUserRoleIcon()}
                    <span className="font-medium hidden xs:inline">
                      {user.username} {!isMobile && `(${user.role})`}
                    </span>
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  className="cursor-pointer flex items-center text-destructive focus:text-destructive" 
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair do Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>
        
        {/* Conteúdo principal - se ajusta automaticamente com padding responsivo */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pt-4 w-full">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Overlay para fechar o sidebar em mobile quando clicado fora */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}