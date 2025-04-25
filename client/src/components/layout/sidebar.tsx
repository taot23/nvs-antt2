import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Home, 
  LogOut,
  ClipboardList,
  UserCog,
  Settings,
  Menu,
  X,
  CreditCard,
  Tags,
  HardHat,
  ShoppingCart,
  Smartphone
} from 'lucide-react';

// Interface para os itens do menu
type MenuItem = {
  path: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[]; // Se definido, o item só será mostrado para esses perfis
};

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const isMobile = useIsMobile();
  const [expanded, setExpandedState] = useState(() => {
    // Ler o estado do localStorage na montagem inicial (apenas desktop)
    if (typeof window !== 'undefined' && !isMobile) {
      const saved = localStorage.getItem('sidebar-expanded');
      // Se não houver valor salvo ainda, expandir por padrão
      return saved !== null ? saved === 'true' : true;
    }
    return false;
  });
  
  // Usar o estado externo (isOpen) se fornecido, caso contrário, usar o estado interno
  const sidebarOpen = isOpen !== undefined ? isOpen : (isMobile ? false : expanded);
  
  const { logoutMutation, user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Função que atualiza o estado e salva no localStorage
  const setExpanded = (value: boolean) => {
    setExpandedState(value);
    if (typeof window !== 'undefined' && !isMobile) {
      localStorage.setItem('sidebar-expanded', value.toString());
    }
  };
  
  // Atualizar o estado apenas quando mudar entre mobile e desktop
  useEffect(() => {
    // Log para debug
    console.log("Sidebar - Mudou dispositivo:", isMobile ? "Mobile" : "Desktop");
  }, [isMobile]);
  
  // Efeito adicional que monitora mudanças de rota
  useEffect(() => {
    // Quando mudar de rota, fechar o menu mobile se controlado internamente
    if (isMobile && onToggle === undefined) {
      setExpanded(false);
    }
  }, [location, isMobile, onToggle]);
  
  const toggleSidebar = () => {
    // Se temos uma função externa de toggle, usamos ela
    if (onToggle) {
      onToggle();
    } else {
      // Caso contrário, usamos o comportamento interno
      if (isMobile) {
        setExpanded(!expanded);
      } else {
        setExpanded(!expanded);
      }
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const userRole = user?.role || '';
  
  // Definir os itens de menu
  const menuItems: MenuItem[] = [
    {
      path: '/',
      icon: <Home className="h-5 w-5" />,
      label: 'Início'
    },
    {
      path: '/sales',
      icon: <ShoppingCart className="h-5 w-5" />,
      label: 'Vendas'
      // Sem roles = todos os perfis têm acesso
    },
    {
      path: '/mobile-sales',
      icon: <Smartphone className="h-5 w-5" />,
      label: 'Versão Móvel'
    },
    {
      path: '/customers',
      icon: <Users className="h-5 w-5" />,
      label: 'Clientes'
    },
    {
      path: '/services',
      icon: <ClipboardList className="h-5 w-5" />,
      label: 'Serviços',
      roles: ['admin', 'operacional'] // Apenas admin e operacional
    },
    {
      path: '/service-types',
      icon: <Tags className="h-5 w-5" />,
      label: 'Tipos de Serviços',
      roles: ['admin', 'operacional'] // Apenas admin e operacional
    },
    {
      path: '/service-providers',
      icon: <HardHat className="h-5 w-5" />,
      label: 'Prestadores',
      roles: ['admin', 'operacional'] // Apenas admin e operacional
    },
    {
      path: '/payment-methods',
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Formas de Pagamento',
      roles: ['admin', 'financeiro'] // Apenas admin e financeiro
    },
    {
      path: '/users',
      icon: <UserCog className="h-5 w-5" />,
      label: 'Usuários',
      roles: ['admin', 'supervisor'] // Apenas admin e supervisor
    }
  ];
  
  // Filtrar os itens de menu com base no perfil do usuário
  const filteredMenuItems = menuItems.filter(item => {
    // Se não tem restrição de perfil, todos podem ver
    if (!item.roles) return true;
    // Se tem restrição, verifica se o perfil do usuário está na lista
    return item.roles.includes(userRole);
  });

  // Determina se o menu está visível
  const isVisible = isMobile ? sidebarOpen : true;
  // Determina se o conteúdo expandido deve ser mostrado
  const showExpandedContent = isMobile ? true : sidebarOpen;

  return (
    <aside 
      className={cn(
        "h-full bg-card border-r border-border shadow-sm z-40 flex flex-col transition-all duration-300 ease-in-out",
        // Layout fixo ou não baseado em mobile
        isMobile ? "fixed top-0" : "relative",
        // Visibilidade e posicionamento
        isMobile ? (sidebarOpen ? "left-0" : "-left-full") : "left-0",
        // Largura
        isMobile 
          ? "w-[85vw] max-w-[280px]" 
          : showExpandedContent 
            ? "w-64" 
            : "w-16"
      )}
    >
      <div className="flex items-center justify-between p-4 h-14 border-b border-border">
        {showExpandedContent && (
          <h2 className="text-lg font-semibold truncate">Sistema de Gestão</h2>
        )}
        
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className={cn(
              !showExpandedContent && "mx-auto"
            )}
            aria-label={showExpandedContent ? "Recolher menu" : "Expandir menu"}
          >
            {showExpandedContent ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        )}
      </div>
      
      <div className="flex-1 py-4 px-2 overflow-y-auto">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = item.path === '/' 
              ? location === item.path
              : location.startsWith(item.path);
              
            // Versão mobile ou expandida
            if (showExpandedContent) {
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  onClick={() => {
                    // Em mobile, fecha o menu via callback se disponível
                    if (isMobile && onToggle) {
                      onToggle();
                    }
                  }}
                >
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
            
            // Versão recolhida com tooltip (apenas desktop)
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
        {showExpandedContent ? (
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
  );
}