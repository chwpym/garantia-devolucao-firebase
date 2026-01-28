
'use client';

import type { ComponentType } from 'react';
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
import { useShallow } from 'zustand/react/shallow';
import type { RegisterMode } from '@/lib/types';
import UsersSection from '@/components/sections/users-section';
import StatusSection from '@/components/sections/status-section';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import PendingScreen from '@/components/pending-screen';
import { useAuth } from '@/hooks/use-auth';
import { Clock, LogOut } from 'lucide-react';
import { auth as firebaseAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';



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
  statuses: StatusSection, // Correct mapping to match nav-config
  status: StatusSection, // Backward compatibility
  'devolucao-register': DevolucaoRegisterSection,
  'devolucao-query': DevolucaoQuerySection,
  'devolucao-reports': DevolucaoReportSection,
  'product-reports': ProductReportSection,
  calculators: CalculatorsSection,
};

export default function Home() {
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
  } = useAppStore(useShallow((state) => ({
    activeView: state.activeView,
    selectedLoteId: state.selectedLoteId,
    editingDevolucaoId: state.editingDevolucaoId,
    editingWarrantyId: state.editingWarrantyId,
    registerMode: state.registerMode,
    setActiveView: state.setActiveView,
    goBack: state.goBack,
    handleEditDevolucao: state.handleEditDevolucao,
    handleDevolucaoSaved: state.handleDevolucaoSaved,
    handleEditWarranty: state.handleEditWarranty,
    handleCloneWarranty: state.handleCloneWarranty,
    handleWarrantySave: state.handleWarrantySave,
  })));

  const isMobile = useIsMobile();

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

  const { user } = useAuth();
  const { toast } = useToast();

  if (isMobile === undefined) return null;

  // GATEKEEPER: Isola completamente o usuário pendente (Fase 11a)
  if (user?.profile.status === 'pending') {
    return <PendingScreen />;
  }

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  );
}
