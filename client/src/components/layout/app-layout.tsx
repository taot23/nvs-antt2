import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="min-h-screen pt-4 px-4 pb-12 transition-all duration-300 ease-in-out">
        {children}
      </main>
    </div>
  );
}