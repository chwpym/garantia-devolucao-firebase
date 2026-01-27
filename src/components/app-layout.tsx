

'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Settings, Menu, DatabaseBackup, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from './ui/sheet';
import MobileSidebar from './mobile-sidebar';
import QuickShortcuts from './quick-shortcuts';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { UserNav } from './user-nav';
import { ThemeToggle } from './theme-toggle';

interface AppLayoutProps {
  children: React.ReactNode;
}
import { navConfig } from '@/config/nav-config';

// Helper to get label from nav config
const getViewLabel = (viewId: string): string => {
  for (const item of navConfig) {
    if (item.id === viewId) return item.label;
    if (item.items) {
      const subItem = item.items.find(sub => sub.id === viewId);
      if (subItem) return subItem.label;
    }
  }
  return 'Voltar';
};

export default function AppLayout({ children }: AppLayoutProps) {
  const {
    activeView,
    isMobileMenuOpen,
    setMobileMenuOpen,
    setActiveView,
    navigationHistory,
    goBack,
    loadInitialData,
<<<<<<< HEAD
  } = useAppStore();
  
  const isInitialLoadDone = useRef(false);

  useEffect(() => {
    // Garantir que a carga de dados e o listener sejam configurados apenas uma vez.
    if (!isInitialLoadDone.current) {
      const handleDataChanged = () => {
        loadInitialData();
      };

      loadInitialData();
      window.addEventListener('datachanged', handleDataChanged);
      
      isInitialLoadDone.current = true;

      // Retornar a função de limpeza para o useEffect
      return () => {
        window.removeEventListener('datachanged', handleDataChanged);
      };
    }
  }, [loadInitialData]);

=======
  } = useAppStore(useShallow((state) => ({
    activeView: state.activeView,
    isMobileMenuOpen: state.isMobileMenuOpen,
    setMobileMenuOpen: state.setMobileMenuOpen,
    setActiveView: state.setActiveView,
    navigationHistory: state.navigationHistory,
    goBack: state.goBack,
    loadInitialData: state.loadInitialData,
  })));

  const handleDataChanged = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    // Initial data load
    loadInitialData();

    // Set up a listener for the custom 'datachanged' event
    // This ensures that data is re-fetched whenever it's updated anywhere in the app
    window.addEventListener('datachanged', handleDataChanged);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('datachanged', handleDataChanged);
    };
  }, [handleDataChanged, loadInitialData]);
>>>>>>> feature/status-visual-pro

  const handleNavClick = (view: string) => {
    setActiveView(view, true); // Add to history when clicking nav items
    setMobileMenuOpen(false);
  };

  const showBackButton = navigationHistory.length > 0;

  // Get label for the previous view to show on back button
  const previousViewId = navigationHistory.length > 0 ? navigationHistory[navigationHistory.length - 1] : '';
  const previousViewLabel = showBackButton ? getViewLabel(previousViewId) : 'Voltar';

  // Display the first 7 characters of the commit hash, or the full version string
  const appVersion = process.env.APP_VERSION || '0.1.0';
  const displayVersion = appVersion.length > 7 ? appVersion.substring(0, 7) : appVersion;

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
                    <div>
                      <SheetTitle className="text-2xl font-bold font-headline text-foreground whitespace-nowrap">
                        Synergia OS
                      </SheetTitle>
                      <SheetDescription className="text-xs">
                        Menu de navegação principal.
                      </SheetDescription>
                    </div>
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
                  <div className="text-center text-xs text-muted-foreground pb-2">
                    Versão {displayVersion}
                  </div>
                </SheetContent>
              </Sheet>

              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  className="gap-2"
                  title={`Voltar para ${previousViewLabel}`}
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only md:not-sr-only md:inline-block">
                    Voltar
                  </span>
                </Button>
              )}
            </div>
            <QuickShortcuts />
            <div className='flex items-center gap-2'>
              <ThemeToggle />
              <UserNav />
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
