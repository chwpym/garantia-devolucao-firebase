'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { LayoutDashboard, FileText, Search, PlusSquare, ChevronLeft, ChevronRight, DatabaseBackup, Users, Building, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';


interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function AppLayout({ children, activeView, setActiveView }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', label: 'Cadastro de Garantia', icon: PlusSquare },
    { id: 'query', label: 'Consulta de Garantias', icon: Search },
    { id: 'lotes', label: 'Lotes de Garantia', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'persons', label: 'Clientes/Mecânicos', icon: Users },
    { id: 'suppliers', label: 'Fornecedores', icon: Building },
    { id: 'backup', label: 'Backup', icon: DatabaseBackup },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className={cn(
        "flex-col border-r bg-background hidden md:flex transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className={cn(
            "flex items-center gap-3 h-16 border-b px-6",
            isSidebarCollapsed && "justify-center px-0"
        )}>
          <Logo className="h-8 w-8 text-primary-foreground fill-primary flex-shrink-0" />
          <h1 className={cn(
            "text-xl font-bold font-headline text-foreground whitespace-nowrap transition-opacity duration-200",
            isSidebarCollapsed && "opacity-0 w-0"
          )}>
            Warranty Wise
          </h1>
        </div>
        <div className="flex-1 overflow-auto py-2">
            <nav className="flex flex-col gap-1 px-4">
            {navItems.map(item => (
                <Button
                key={item.id}
                variant={activeView === item.id ? 'secondary' : 'ghost'}
                className={cn(
                    "justify-start gap-3 text-base h-11",
                    isSidebarCollapsed && "justify-center"
                )}
                onClick={() => setActiveView(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn("truncate", isSidebarCollapsed && "hidden")}>{item.label}</span>
                </Button>
            ))}
            </nav>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="p-4 border-b bg-background shadow-sm sticky top-0 z-10 flex items-center justify-between gap-4 h-16">
            <div className='flex items-center gap-4'>
                <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:inline-flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}>
                    {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>
                
                <div className="md:hidden flex items-center gap-3">
                    <Logo className="h-8 w-8 text-primary-foreground fill-primary" />
                    <h1 className="text-xl font-bold font-headline text-foreground">
                        Warranty Wise
                    </h1>
                </div>
                {/* Mobile menu could be added here */}
            </div>
            <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
