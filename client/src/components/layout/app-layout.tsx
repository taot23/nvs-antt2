import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
      {/* Sidebar importada do componente separado */}
      <Sidebar />
      
      {/* Conteúdo principal - se ajusta automaticamente com padding responsivo */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pt-4">
        {children}
      </main>
    </div>
  );
}