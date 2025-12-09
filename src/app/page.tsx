
'use client';

import { useEffect, useState, type ComponentType } from 'react';
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
import StatusSection from '@/components/sections/status-section'; // Nova importação
import ClientOnly from '@/components/client-only';

export type RegisterMode = 'edit' | 'clone';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viewComponents: { [key: string]: ComponentType<any> } = {
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
  statuses: StatusSection, // Nova view
  'devolucao-register': DevolucaoRegisterSection,
  'devolucao-query': DevolucaoQuerySection,
  'devolucao-reports': DevolucaoReportSection,
  'product-reports': ProductReportSection,
  calculators: CalculatorsSection,
};

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const {
    activeView,
    selectedLoteId,
    editingDevolucaoId,
    editingWarrantyId,
    registerMode,
    setActiveView,
    goBack,
    handleEditDevolucao,
    handleDevolucaoSaved,
    handleEditWarranty,
    handleCloneWarranty,
    handleWarrantySave,
  } = useAppStore();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  const renderContent = () => {
    const Component = viewComponents[activeView];
    if (!Component) return <DashboardSection openTab={setActiveView} />;

    switch (activeView) {
      case 'dashboard':
        return <DashboardSection openTab={setActiveView} />;
      case 'register':
        return <RegisterSection 
                    editingId={editingWarrantyId} 
                    mode={registerMode} 
                    onSave={(shouldNavigate: boolean) => handleWarrantySave(shouldNavigate)} 
                    onClear={() => useAppStore.getState().clearEditingWarranty()}
                />;
      case 'query':
        return <QuerySection 
                    setActiveView={setActiveView}
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
  
  return (
     <ClientOnly>
      <AppLayout>
        {renderContent()}
      </AppLayout>
    </ClientOnly>
  );
}
