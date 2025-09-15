
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Menu, DatabaseBackup, Wrench, Undo2, Package, Calculator, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import MobileSidebar from './mobile-sidebar';


interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  onNewLoteClick: () => void;
}

export default function AppLayout({ children, activeView, setActiveView, isMobileMenuOpen, setMobileMenuOpen, onNewLoteClick }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleMobileNavClick = (view: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };
  
  return (
    <div className="flex h-screen w-full bg-muted/40">
      <aside className={cn(
        "flex flex-col border-r bg-background hidden md:flex transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className={cn(
            "flex items-center gap-3 h-16 border-b px-6",
            isSidebarCollapsed && "justify-center px-0"
        )}>
           <Image src="/logo.jpeg" alt="Synergia OS Logo" width={32} height={32} className="h-8 w-8 rounded-md flex-shrink-0" />
          <h1 className={cn(
            "text-xl font-bold font-headline text-foreground whitespace-nowrap transition-opacity duration-200",
            isSidebarCollapsed && "opacity-0 w-0"
          )}>
            Synergia OS
          </h1>
        </div>
        <div className="flex flex-1 flex-col overflow-auto">
            <MobileSidebar 
              activeView={activeView} 
              onNavigate={setActiveView}
              isCollapsed={isSidebarCollapsed}
              className="flex-1 overflow-auto py-2 hidden md:block"
            />
            <div className="mt-auto p-4 border-t">
                <nav className='flex flex-col gap-1'>
                    <Button
                        key="backup"
                        variant={activeView === "backup" ? 'secondary' : 'ghost'}
                        className={cn(
                            "justify-start gap-3 text-base h-11 w-full",
                            isSidebarCollapsed && "justify-center"
                        )}
                        onClick={() => setActiveView("backup")}
                        title={isSidebarCollapsed ? "Backup" : undefined}
                        >
                        <DatabaseBackup className="h-5 w-5 flex-shrink-0" />
                        <span className={cn("truncate", isSidebarCollapsed && "hidden")}>Backup</span>
                    </Button>
                    <Button
                        key="settings"
                        variant={activeView === "settings" ? 'secondary' : 'ghost'}
                        className={cn(
                            "justify-start gap-3 text-base h-11 w-full",
                            isSidebarCollapsed && "justify-center"
                        )}
                        onClick={() => setActiveView("settings")}
                        title={isSidebarCollapsed ? "Configurações" : undefined}
                        >
                        <Settings className="h-5 w-5 flex-shrink-0" />
                        <span className={cn("truncate", isSidebarCollapsed && "hidden")}>Configurações</span>
                    </Button>
                </nav>
            </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="p-4 border-b bg-background shadow-sm sticky top-0 z-10 flex items-center justify-between gap-4 h-16">
            <div className='flex items-center gap-4'>
                <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:inline-flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}>
                    {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>
                
                 <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-6 w-6" />
                             <span className="sr-only">Abrir menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                         <div className="flex items-center gap-3 h-16 border-b px-6">
                           <Image src="/logo.jpeg" alt="Synergia OS Logo" width={32} height={32} className="h-8 w-8 rounded-md flex-shrink-0" />
                          <h1 className="text-xl font-bold font-headline text-foreground whitespace-nowrap">
                            Synergia OS
                          </h1>
                        </div>
                        <MobileSidebar 
                          activeView={activeView} 
                          onNavigate={handleMobileNavClick}
                          className="flex-1 overflow-auto py-2"
                        />
                         <div className="mt-auto p-4 border-t">
                            <nav className='flex flex-col gap-1'>
                                 <Button
                                    key="backup"
                                    variant={activeView === 'backup' ? 'secondary' : 'ghost'}
                                    className="justify-start gap-3 text-base h-11 w-full"
                                    onClick={() => handleMobileNavClick('backup')}
                                    >
                                    <DatabaseBackup className="h-5 w-5 flex-shrink-0" />
                                    <span>Backup</span>
                                </Button>
                                <Button
                                    key="settings"
                                    variant={activeView === 'settings' ? 'secondary' : 'ghost'}
                                    className="justify-start gap-3 text-base h-11 w-full"
                                    onClick={() => handleMobileNavClick('settings')}
                                    >
                                    <Settings className="h-5 w-5 flex-shrink-0" />
                                    <span>Configurações</span>
                                </Button>
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
                
                <div className="hidden md:flex items-center gap-3">
                    <h1 className={cn("text-xl font-bold font-headline text-foreground", !isSidebarCollapsed && 'md:hidden')}>
                        Synergia OS
                    </h1>
                </div>
            </div>

             <div className="flex-1 flex items-center justify-center gap-2">
                <Button size="sm" onClick={() => setActiveView('register')}>
                    <Wrench className="mr-2 h-4 w-4" />
                    Nova Garantia
                </Button>
                <Button size="sm" style={{ backgroundColor: 'hsl(var(--third))', color: 'hsl(var(--primary-foreground))' }}  onClick={() => setActiveView('batch-register')}>
                    <History className="mr-2 h-4 w-4" />
                    Garantia em Lote
                </Button>
                 <Button variant="accent-blue" size="sm" onClick={() => setActiveView('devolucao-register')}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    Nova Devolução
                </Button>
                <Button variant="accent-green" size="sm" onClick={onNewLoteClick}>
                    <Package className="mr-2 h-4 w-4" />
                    Novo Lote
                </Button>
                <Button style={{ backgroundColor: 'hsl(var(--third))' }} size="sm" onClick={() => setActiveView('calculators')}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculadoras
                </Button>
            </div>

            <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

    