
'use client';

import React, { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowLeft, LogOut, Settings, LayoutDashboard, Database, ChevronLeft, ChevronRight, DatabaseBackup } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import MobileSidebar from './mobile-sidebar';
import QuickShortcuts from './quick-shortcuts';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { UserNav } from './user-nav';
import { ThemePicker } from './theme-picker';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth'; // Assuming this path for useAuth
import { cn } from '@/lib/utils'; // Assuming this path for cn

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
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const {
    activeView,
    isMobileMenuOpen,
    setMobileMenuOpen,
    setActiveView,
    navigationHistory,
    goBack,
    loadInitialData,
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

  const handleNavClick = (view: string) => {
    setActiveView(view, true); // Add to history when clicking nav items
    setMobileMenuOpen(false);
    router.push(`/${view}`);
  };

  const handleGoBack = () => {
    const { navigationHistory } = useAppStore.getState();
    if (navigationHistory.length > 0) {
      const previousViewId = navigationHistory[navigationHistory.length - 1];
      goBack();
      router.push(`/${previousViewId}`);
    }
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
      <aside className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-300 relative",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn(
          "h-16 flex items-center border-b px-4",
          isSidebarCollapsed ? "justify-center" : "justify-between"
        )}>
           {!isSidebarCollapsed && (
             <div className="flex items-center gap-3 font-bold text-xl text-primary overflow-hidden">
               <Image
                 src="/logo.png"
                 alt="Synergia OS Logo"
                 width={32}
                 height={32}
                 className="h-8 w-8 rounded-md flex-shrink-0"
               />
               <h1 className="text-xl font-bold font-headline text-foreground whitespace-nowrap truncate">
                 Synergia OS
               </h1>
             </div>
           )}
           {isSidebarCollapsed && (
             <Image
               src="/logo.png"
               alt="Synergia OS Logo"
               width={32}
               height={32}
               className="h-8 w-8 rounded-md flex-shrink-0"
             />
           )}
           
           <Button 
             variant="ghost" 
             size="icon" 
             className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm z-10 hidden md:flex"
             onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
           >
             {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
           </Button>
        </div>
        
        <div className="flex-1 overflow-auto py-4">
          <MobileSidebar
            activeView={activeView}
            onNavigate={handleNavClick}
            setMobileMenuOpen={setMobileMenuOpen}
            isCollapsed={isSidebarCollapsed}
          />
        </div>
        <div className="p-4 border-t flex flex-col gap-1">
          <Button
            key="backup"
            variant={activeView === 'backup' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start gap-3 text-base h-11 w-full",
              isSidebarCollapsed && "justify-center px-0"
            )}
            onClick={() => handleNavClick('backup')}
            title={isSidebarCollapsed ? "Backup" : ""}
          >
            <DatabaseBackup className="h-5 w-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Backup</span>}
          </Button>
          <Button
            key="settings"
            variant={activeView === 'settings' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start gap-3 text-base h-11 w-full",
              isSidebarCollapsed && "justify-center px-0"
            )}
            onClick={() => handleNavClick('settings')}
            title={isSidebarCollapsed ? "Configurações" : ""}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Configurações</span>}
          </Button>
          {!isSidebarCollapsed && (
            <div className="text-center text-[10px] text-muted-foreground mt-2">
              Versão {displayVersion}
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="px-4 py-2 border-b bg-background shadow-sm sticky top-0 z-20 flex flex-col gap-2">
          <div className='flex items-center justify-between w-full h-12'>
            <div className='flex items-center gap-2'>
              <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                  {/* ... same sheet content as before, keeping it for mobile ... */}
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
                  {isMobileMenuOpen && (
                    <MobileSidebar
                      activeView={activeView}
                      onNavigate={handleNavClick}
                      setMobileMenuOpen={setMobileMenuOpen}
                      className="flex-1 overflow-auto py-2"
                    />
                  )}
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
                  onClick={handleGoBack}
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
              <ThemePicker />
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 relative min-h-0 overflow-hidden">
          <div className="absolute inset-4 md:inset-8 flex flex-col">
            <div className="flex-1 w-full h-full overflow-auto flex flex-col rounded-lg">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
