
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Settings, Menu, DatabaseBackup, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import MobileSidebar from './mobile-sidebar';
import QuickShortcuts from './quick-shortcuts';
import { useAppStore } from '@/store/app-store';
import { UserNav } from './user-nav';
import { ThemeToggle } from './theme-toggle';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { 
    isMobileMenuOpen, 
    setMobileMenuOpen,
    tabs,
    activeTabId,
    openTab,
    closeTab,
    setActiveTabId,
  } = useAppStore();

  const handleNavClick = (view: string) => {
    openTab(view);
    setMobileMenuOpen(false);
  };
  
  return (
    <div className="flex h-screen w-full bg-muted/40">
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="p-4 border-b bg-background shadow-sm sticky top-0 z-20 flex flex-col gap-2">
          <div className='flex items-center justify-between w-full h-12'>
            <div className='flex items-center gap-2'>
              <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                  <SheetHeader className="flex flex-row items-center gap-3 h-16 border-b px-4">
                    <Image
                      src="/logo.png"
                      alt="Synergia OS Logo"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-md flex-shrink-0"
                    />
                    <SheetTitle className="text-2xl font-bold font-headline text-foreground whitespace-nowrap">
                      Synergia OS
                    </SheetTitle>
                  </SheetHeader>
                  <MobileSidebar
                    activeView={activeTabId || ''}
                    onNavigate={handleNavClick}
                    className="flex-1 overflow-auto py-2"
                  />
                  <div className="mt-auto p-4 border-t">
                    <nav className='flex flex-col gap-1'>
                      <Button
                        key="backup"
                        variant={activeTabId === 'backup' ? 'secondary' : 'ghost'}
                        className="justify-start gap-3 text-base h-11 w-full"
                        onClick={() => handleNavClick('backup')}
                      >
                        <DatabaseBackup className="h-5 w-5 flex-shrink-0" />
                        <span>Backup</span>
                      </Button>
                      <Button
                        key="settings"
                        variant={activeTabId === 'settings' ? 'secondary' : 'ghost'}
                        className="justify-start gap-3 text-base h-11 w-full"
                        onClick={() => handleNavClick('settings')}
                      >
                        <Settings className="h-5 w-5 flex-shrink-0" />
                        <span>Configurações</span>
                      </Button>
                    </nav>
                  </div>
                  <div className="text-center text-xs text-muted-foreground pb-2">
                    Versão {process.env.APP_VERSION || '0.1.0'}
                  </div>
                </SheetContent>
              </Sheet>

              {/* O botão de voltar foi removido para dar lugar à navegação por abas */}

            </div>
            <QuickShortcuts />
            <div className='flex items-center gap-2'>
              <ThemeToggle />
              <UserNav />
            </div>
          </div>
          {tabs.length > 0 && (
            <Tabs value={activeTabId || ''} onValueChange={(value) => setActiveTabId(value)} className="w-full">
              <TabsList className="h-auto justify-start overflow-x-auto">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="relative pr-8">
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      disabled={tab.id === 'dashboard'} // Dashboard não pode ser fechado
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
