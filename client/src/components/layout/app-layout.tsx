import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main 
        className={cn(
          "min-h-screen pt-4 px-4 pb-12 transition-all duration-300 ease-in-out",
          isMobile ? "pt-16" : "" // Adicionamos padding-top extra em dispositivos móveis para o botão do menu
        )}
      >
        {children}
      </main>
    </div>
  );
}