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
  const [expanded, setExpanded] = useState(true);
  const { logoutMutation, user } = useAuth();
  const [location] = useLocation();
  
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const userRole = user?.role || '';
  console.log('Sidebar userRole:', userRole);
  
  // Função para renderizar um item de menu na barra lateral
  const renderMenuItem = (path: string, icon: React.ReactNode, label: string) => {
    const isActive = path === '/' 
      ? location === path
      : location.startsWith(path);
    
    if (expanded) {
      return (
        <Link key={path} href={path}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start mb-1 font-normal",
              isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <div className="flex items-center">
              <div className="mr-3">{icon}</div>
              <span>{label}</span>
            </div>
          </Button>
        </Link>
      );
    } else {
      return (
        <TooltipProvider key={path} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={path}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-full h-10 mb-1",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {icon}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-normal">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  };

  return (
    <>
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
            {/* Home */}
            {renderMenuItem('/', <Home className="h-5 w-5" />, 'Início')}
            
            {/* Customers */}
            {renderMenuItem('/customers', <Users className="h-5 w-5" />, 'Clientes')}
            
            {/* Services - Temporarily available for everyone */}
            {renderMenuItem('/services', <ClipboardList className="h-5 w-5" />, 'Serviços')}
            
            {/* Users */}
            {renderMenuItem('/users', <UserCog className="h-5 w-5" />, 'Usuários')}
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