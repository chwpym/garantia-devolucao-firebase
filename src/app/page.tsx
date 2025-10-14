
'use client';

import AppLayout from '@/components/app-layout';

import DashboardSection from '@/components/sections/dashboard-section';
import RegisterSection from '@/components/sections/register-section';
import QuerySection from '@/components/sections/query-section';
import LotesSection from '@/components/sections/lotes-section';
import ReportSection from '@/components/sections/report-section';
import PersonsSection from '@/components/sections/persons-section';
import SuppliersSection from '@/components/sections/suppliers-section';
import BackupSection from '@/components/sections/backup-section';
import LoteDetailSection from '@/components/sections/lote-detail-section';
import SettingsSection from '@/components/sections/settings-section';
import DevolucaoRegisterSection from '@/components/sections/devolucao-register-section';
import DevolucaoQuerySection from '@/components/sections/devolucao-query-section';
import DevolucaoReportSection from '@/components/sections/devolucao-report-section';
import CalculatorsSection from '@/components/sections/calculators-section';
import BatchRegisterSection from '@/components/sections/batch-register-section';
import ProductsSection from '@/components/sections/products-section';
import ProductReportSection from '@/components/sections/product-report-section';
import { useAppStore } from '@/store/app-store';
import UsersSection from '@/components/sections/users-section';
import { TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';


export type RegisterMode = 'edit' | 'clone';

const viewComponents: { [key: string]: React.ComponentType<any> } = {
  dashboard: DashboardSection,
  register: RegisterSection,
  'batch-register': BatchRegisterSection,
  query: QuerySection,
  lotes: LotesSection,
  loteDetail: LoteDetailSection,
  reports: ReportSection,
  persons: PersonsSection,
  suppliers: SuppliersSection,
  products: ProductsSection,
  backup: BackupSection,
  settings: SettingsSection,
  users: UsersSection,
  'devolucao-register': DevolucaoRegisterSection,
  'devolucao-query': DevolucaoQuerySection,
  'devolucao-reports': DevolucaoReportSection,
  'product-reports': ProductReportSection,
  calculators: CalculatorsSection,
};

export default function Home() {
  const {
    tabs,
    activeTabId,
    selectedLoteId,
    editingDevolucaoId,
    editingWarrantyId,
    registerMode,
    openTab,
    goBack,
    handleEditDevolucao,
    handleDevolucaoSaved,
    handleEditWarranty,
    handleCloneWarranty,
    handleWarrantySave,
  } = useAppStore();

  const isMobile = useIsMobile();

  const renderContent = (viewId: string) => {
    const Component = viewComponents[viewId];
    if (!Component) return <DashboardSection openTab={openTab} />;

    switch (viewId) {
      case 'dashboard':
        return <DashboardSection openTab={openTab} />;
      case 'register':
        return <RegisterSection 
                    editingId={editingWarrantyId} 
                    mode={registerMode} 
                    onSave={(shouldNavigate: boolean) => handleWarrantySave(shouldNavigate)} 
                    onClear={() => useAppStore.getState().clearEditingWarranty()}
                />;
      case 'query':
        return <QuerySection 
                    setActiveView={openTab}
                    onEdit={handleEditWarranty} 
                    onClone={handleCloneWarranty}
                />;
      case 'loteDetail':
        return <LoteDetailSection loteId={selectedLoteId!} onBack={goBack} />;
      case 'devolucao-register':
        return <DevolucaoRegisterSection editingId={editingDevolucaoId} onSave={handleDevolucaoSaved} />;
      case 'devolucao-query':
        return <DevolucaoQuerySection onEdit={handleEditDevolucao} />;
      case 'lotes':
          return <LotesSection onNavigateToLote={(loteId) => useAppStore.getState().handleNavigateToLote(loteId)} />;
      default:
        return <Component />;
    }
  };
  
  if (isMobile === undefined) return null;

  return (
    <AppLayout>
      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id} forceMount={true} hidden={activeTabId !== tab.id} className="flex-1">
           {renderContent(tab.id)}
        </TabsContent>
      ))}
       {tabs.length === 0 && (
         <div className="flex items-center justify-center h-full text-muted-foreground">
           <p>Nenhuma aba aberta. Selecione um item no menu para começar.</p>
         </div>
      )}
    </AppLayout>
  );
}
