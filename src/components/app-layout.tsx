'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Settings, Menu, DatabaseBackup, Wrench, History, Undo2, Package, CalculatorIcon } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import MobileSidebar from './mobile-sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  onNewLoteClick: () => void;
}

const QuickShortcuts = ({ setActiveView, onNewLoteClick }: { setActiveView: (view: string) => void; onNewLoteClick: () => void; }) => (
    <div className="flex items-center justify-center flex-wrap gap-2 mb-6">
        <Button variant="default" onClick={() => setActiveView('register')}>
            <Wrench /> Nova Garantia
        </Button>
        <Button variant="outline" className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white" onClick={() => setActiveView('batch-register')}>
            <History /> Garantia em Lote
        </Button>
        <Button variant="accent-blue" onClick={() => setActiveView('devolucao-register')}>
            <Undo2 /> Nova Devolução
        </Button>
        <Button variant="accent-green" onClick={onNewLoteClick}>
            <Package /> Novo Lote
        </Button>
         <Button variant="outline" className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white" onClick={() => setActiveView('calculators')}>
            <CalculatorIcon /> Calculadoras
        </Button>
    </div>
);


export default function AppLayout({ children, activeView, setActiveView, isMobileMenuOpen, setMobileMenuOpen, onNewLoteClick }: AppLayoutProps) {
  
  const handleNavClick = (view: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };
  
  return (
    <div className="flex h-screen w-full bg-muted/40">
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="p-4 border-b bg-background shadow-sm sticky top-0 z-10 flex items-center justify-between gap-4 h-16">
            <div className='flex items-center gap-4'>
                 <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                             <span className="sr-only">Abrir menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                        <SheetHeader className="flex items-center gap-3 h-16 border-b px-6">
                           <Image 
                              src="/logo.jpeg" 
                              alt="Synergia OS Logo" 
                              width={32} 
                              height={32} 
                              className="h-8 w-8 rounded-md flex-shrink-0" 
                           />
                          <SheetTitle className="text-xl font-bold font-headline text-foreground whitespace-nowrap">
                            Synergia OS
                          </SheetTitle>
                        </SheetHeader>
                        <MobileSidebar 
                          activeView={activeView} 
                          onNavigate={handleNavClick}
                          className="flex-1 overflow-auto py-2"
                        />
                         <div className="mt-auto p-4 border-t">
                            <nav className='flex flex-col gap-1'>
                                 <Button
                                    key="backup"
                                    variant={activeView === 'backup' ? 'secondary' : 'ghost'}
                                    className="justify-start gap-3 text-base h-11 w-full"
                                    onClick={() => handleNavClick('backup')}
                                    >
                                    <DatabaseBackup className="h-5 w-5 flex-shrink-0" />
                                    <span>Backup</span>
                                </Button>
                                <Button
                                    key="settings"
                                    variant={activeView === 'settings' ? 'secondary' : 'ghost'}
                                    className="justify-start gap-3 text-base h-11 w-full"
                                    onClick={() => handleNavClick('settings')}
                                    >
                                    <Settings className="h-5 w-5 flex-shrink-0" />
                                    <span>Configurações</span>
                                </Button>
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <QuickShortcuts setActiveView={setActiveView} onNewLoteClick={onNewLoteClick} />
          {children}
        </main>
      </div>
    </div>
  );
}
