'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Settings, Menu, DatabaseBackup } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import MobileSidebar from './mobile-sidebar';
import QuickShortcuts from './quick-shortcuts';
import DesktopSidebar from './desktop-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  onNewLoteClick: () => void;
}

export default function AppLayout({ children, activeView, setActiveView, isMobileMenuOpen, setMobileMenuOpen, onNewLoteClick }: AppLayoutProps) {
  const isMobile = useIsMobile();

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-muted/40">
        {!isMobile && (
             <aside className="hidden md:flex flex-col w-64 border-r bg-background">
                <div className="flex items-center gap-3 h-16 border-b px-6">
                    <Image
                        src="/logo.jpeg"
                        alt="Synergia OS Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-md"
                    />
                    <h2 className="text-xl font-bold font-headline text-foreground">
                        Synergia OS
                    </h2>
                </div>
                <DesktopSidebar
                    activeView={activeView}
                    onNavigate={handleNavClick}
                    className="flex-1 overflow-auto py-2"
                />
                <div className="mt-auto p-2 border-t">
                    <nav className='flex flex-col gap-1 px-2'>
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
            </aside>
        )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="p-4 border-b bg-background shadow-sm sticky top-0 z-10 flex flex-col gap-2">
          <div className='flex items-center justify-between w-full h-12'>
            <div className='flex items-center gap-4'>
              <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(isMobile ? 'flex' : 'hidden')}>
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
               <div className={cn("items-center gap-3", isMobile ? "hidden" : "flex")}>
                  <h2 className="text-2xl font-bold font-headline text-foreground whitespace-nowrap">
                      {
                        // Capitalize and show the active view
                        activeView.charAt(0).toUpperCase() + activeView.slice(1).replace(/-/g, ' ')
                      }
                  </h2>
              </div>
            </div>
            <div className={cn("md:hidden", !isMobile ? "hidden" : "flex")}>
              <Image
                  src="/logo.jpeg"
                  alt="Synergia OS Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-md flex-shrink-0"
              />
            </div>
            <div className="flex items-center gap-2">
                <QuickShortcuts setActiveView={setActiveView} onNewLoteClick={onNewLoteClick} />
                <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
