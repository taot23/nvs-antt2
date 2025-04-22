import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Home, 
  LogOut 
} from 'lucide-react';

export function Sidebar() {
  // Começar expandido por padrão e deixar o useEffect ajustar com base no tamanho da tela
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  
  // Fechar o menu no mobile quando mudar de rota
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location, isMobile]);
  
  // Ajustar o estado de expansão baseado no tamanho da tela
  useEffect(() => {
    if (isMobile) {
      setExpanded(false);
    } else {
      setExpanded(true); // Sempre expandido em telas grandes por padrão
    }
  }, [isMobile]);
  
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
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

  // Overlay para dispositivos móveis
  const MobileOverlay = () => (
    <div 
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden",
        mobileOpen ? "block" : "hidden"
      )}
      onClick={toggleMobileMenu}
    />
  );
  
  // Componente principal da sidebar
  return (
    <>
      <MobileOverlay />
      
      {/* Botão do menu mobile */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={toggleMobileMenu}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r border-border shadow-sm z-40 flex flex-col transition-all duration-300 ease-in-out",
          expanded ? "w-60" : "w-14",
          isMobile && !mobileOpen ? "-translate-x-full" : "translate-x-0"
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
      
      {/* Espaçador para empurrar o conteúdo */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out",
          expanded ? "ml-60" : "ml-14",
          isMobile && "ml-0"
        )}
      />
    </>
  );
}