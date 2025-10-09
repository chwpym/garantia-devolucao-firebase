
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
import { useIsMobile } from '@/hooks/use-mobile';
import DevolucaoRegisterSection from '@/components/sections/devolucao-register-section';
import DevolucaoQuerySection from '@/components/sections/devolucao-query-section';
import DevolucaoReportSection from '@/components/sections/devolucao-report-section';
import CalculatorsSection from '@/components/sections/calculators-section';
import BatchRegisterSection from '@/components/sections/batch-register-section';
import { cn } from '@/lib/utils';
import ProductsSection from '@/components/sections/products-section';
import ProductReportSection from '@/components/sections/product-report-section';
import { useAppStore } from '@/store/app-store';

export type RegisterMode = 'edit' | 'clone';

export default function Home() {
  const {
    activeView,
    selectedLoteId,
    editingDevolucaoId,
    editingWarrantyId,
    registerMode,
    setActiveView,
    handleNavigateToLote,
    handleBackToList,
    handleEditDevolucao,
    handleDevolucaoSaved,
    handleEditWarranty,
    handleCloneWarranty,
    handleWarrantySave,
  } = useAppStore();

  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardSection setActiveView={setActiveView} />;
      case 'register':
        return <RegisterSection 
                    editingId={editingWarrantyId} 
                    mode={registerMode} 
                    onSave={handleWarrantySave} 
                    onClear={() => useAppStore.getState().clearEditingWarranty()}
                />;
      case 'batch-register':
        return <BatchRegisterSection />;
      case 'query':
        return <QuerySection 
                    setActiveView={setActiveView} 
                    onEdit={handleEditWarranty} 
                    onClone={handleCloneWarranty}
                />;
      case 'lotes':
        return <LotesSection onNavigateToLote={handleNavigateToLote} />;
      case 'loteDetail':
        return <LoteDetailSection loteId={selectedLoteId!} onBack={handleBackToList} />;
      case 'reports':
        return <ReportSection />;
      case 'persons':
        return <PersonsSection />;
      case 'suppliers':
        return <SuppliersSection />;
      case 'products':
        return <ProductsSection />;
      case 'backup':
        return <BackupSection />;
      case 'settings':
        return <SettingsSection />;
      case 'devolucao-register':
        return <DevolucaoRegisterSection editingId={editingDevolucaoId} onSave={handleDevolucaoSaved} />;
      case 'devolucao-query':
        return <DevolucaoQuerySection onEdit={handleEditDevolucao} />;
      case 'devolucao-reports':
        return <DevolucaoReportSection />;
      case 'product-reports':
        return <ProductReportSection />;
      case 'calculators':
        return <CalculatorsSection />;
      default:
        return <DashboardSection setActiveView={setActiveView} />;
    }
  };
  
  if (isMobile === undefined) return null;


  return (
    <AppLayout>
      <div className={cn(activeView === 'batch-register' ? "" : "max-w-7xl mx-auto w-full")}>
          {renderContent()}
      </div>
    </AppLayout>
  );
}
