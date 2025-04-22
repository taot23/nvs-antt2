import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Home, 
  LogOut,
  ClipboardList,
  UserCog
} from 'lucide-react';

export function Sidebar() {
  // Começar expandido por padrão
  const [expanded, setExpanded] = useState(true);
  const { logoutMutation, user } = useAuth();
  const [location] = useLocation();
  
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Definir os itens de navegação
  const navItems = [];
  
  // Início - disponível para todos
  navItems.push({
    path: '/',
    icon: <Home className="h-5 w-5" />,
    label: 'Início'
  });
  
  // Clientes - disponível para todos
  navItems.push({
    path: '/customers',
    icon: <Users className="h-5 w-5" />,
    label: 'Clientes'
  });
  
  // Serviços - apenas para admin e operacional
  if (user?.role === 'admin' || user?.role === 'operacional') {
    navItems.push({
      path: '/services',
      icon: <ClipboardList className="h-5 w-5" />,
      label: 'Serviços'
    });
  }
  
  // Usuários - apenas para admin e supervisor
  if (user?.role === 'admin' || user?.role === 'supervisor') {
    navItems.push({
      path: '/users',
      icon: <UserCog className="h-5 w-5" />,
      label: 'Usuários'
    });
  }

  return (
    <>
      {/* Sidebar - sempre visível */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r border-border shadow-sm z-40 flex flex-col transition-all duration-300 ease-in-out",
          expanded ? "w-60" : "w-14"
        )}
      >
        <div className="flex items-center justify-between p-4 h-14 border-b border-border">
          {expanded && (
            <h2 className="text-lg font-medium truncate">Gestão de Clientes</h2>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className={cn(
              "ml-auto",
              !expanded && "mx-auto"
            )}
          >
            {expanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="flex-1 py-4 px-2 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.path === '/' 
                ? location === item.path
                : location.startsWith(item.path);
                
              // Versão expandida
              if (expanded) {
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start mb-1 font-normal",
                        isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">{item.icon}</div>
                        <span>{item.label}</span>
                      </div>
                    </Button>
                  </Link>
                );
              }
              
              // Versão recolhida com tooltip
              return (
                <TooltipProvider key={item.path} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.path}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "w-full h-10 mb-1",
                            isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          {item.icon}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-normal">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>
        </div>
        
        <div className="p-2 border-t border-border mt-auto">
          {expanded ? (
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Sair</span>
            </Button>
          ) : (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-normal">
                  Sair
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </aside>
      
      {/* Espaçador para empurrar o conteúdo - sempre presente */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out",
          expanded ? "ml-60" : "ml-14"
        )}
      />
    </>
  );
}