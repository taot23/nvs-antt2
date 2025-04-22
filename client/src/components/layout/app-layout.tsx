import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Home, 
  LogOut,
  UserCog
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [expanded, setExpanded] = useState(true);
  const { logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const menuItems = [
    {
      path: '/',
      icon: <Home className="h-5 w-5" />,
      label: 'Início',
      exact: true,
    },
    {
      path: '/customers',
      icon: <Users className="h-5 w-5" />,
      label: 'Clientes',
      exact: false,
    },
  ];
  
  // Componente de botão de navegação com tooltip quando minimizado
  const NavButton = ({ path, icon, label, active }: { path: string; icon: JSX.Element; label: string; active: boolean }) => {
    return expanded ? (
      <Link href={path}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start mb-1 font-normal",
            active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <div className="flex items-center">
            <div className="mr-3">{icon}</div>
            <span>{label}</span>
          </div>
        </Button>
      </Link>
    ) : (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={path}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-10 mb-1",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - sempre fixa */}
      <aside 
        className={cn(
          "h-screen border-r border-border shadow-sm z-10 flex flex-col transition-all duration-300 ease-in-out",
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
            {menuItems.map((item) => (
              <NavButton 
                key={item.path}
                path={item.path}
                icon={item.icon}
                label={item.label}
                active={
                  item.exact 
                    ? location === item.path
                    : location.startsWith(item.path)
                }
              />
            ))}
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
      
      {/* Conteúdo principal - se ajusta automaticamente */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}