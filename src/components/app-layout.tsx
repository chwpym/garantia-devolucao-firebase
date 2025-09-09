'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { LayoutDashboard, FileText, Settings, Search, PlusSquare } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function AppLayout({ children, activeView, setActiveView }: AppLayoutProps) {
  const navItems = [
    { id: 'register', label: 'Cadastro de Garantia', icon: PlusSquare },
    { id: 'query', label: 'Consulta de Garantias', icon: Search },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ];

  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-72 flex-col border-r bg-card p-4 hidden md:flex">
        <div className="flex items-center gap-3 mb-8">
          <Logo className="h-8 w-8 text-primary-foreground fill-primary" />
          <h1 className="text-xl font-bold font-headline text-foreground">
            Warranty Wise
          </h1>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map(item => (
            <Button
              key={item.id}
              variant={activeView === item.id ? 'secondary' : 'ghost'}
              className="justify-start gap-3 text-base h-11"
              onClick={() => setActiveView(item.id)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="mt-auto">
           <Button variant="ghost" className="justify-start gap-3 w-full text-base h-11">
              <Settings className="h-5 w-5" />
              Configurações
            </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="p-4 border-b bg-card shadow-sm sticky top-0 z-10 md:hidden">
            <div className="container mx-auto flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Logo className="h-8 w-8 text-primary-foreground fill-primary" />
                    <h1 className="text-xl font-bold font-headline text-foreground">
                        Warranty Wise
                    </h1>
                </div>
                {/* Mobile menu could be added here */}
            </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <footer className="p-4 border-t bg-card text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Warranty Wise. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
