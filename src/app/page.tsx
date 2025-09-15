'use client';

import { useState } from 'react';
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
import type { Warranty } from '@/lib/types';
import BatchRegisterSection from '@/components/sections/batch-register-section';
import { cn } from '@/lib/utils';

export type RegisterMode = 'edit' | 'clone';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedLoteId, setSelectedLoteId] = useState<number | null>(null);
  
  const [editingDevolucaoId, setEditingDevolucaoId] = useState<number | null>(null);
  const [editingWarrantyId, setEditingWarrantyId] = useState<number | null>(null);
  const [registerMode, setRegisterMode] = useState<RegisterMode>('edit');
  
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewLoteModalOpen, setIsNewLoteModalOpen] = useState(false);
  const isMobile = useIsMobile();


  const handleNavigateToLote = (loteId: number) => {
    setSelectedLoteId(loteId);
    setActiveView('loteDetail');
  };

  const handleBackToList = () => {
    setSelectedLoteId(null);
    setActiveView('lotes');
  }

  const handleEditDevolucao = (devolucaoId: number) => {
    setEditingDevolucaoId(devolucaoId);
    setActiveView('devolucao-register');
  }
  
  const handleDevolucaoSaved = () => {
    setEditingDevolucaoId(null);
    setActiveView('devolucao-query');
  }

  const handleEditWarranty = (warranty: Warranty) => {
    setEditingWarrantyId(warranty.id!);
    setRegisterMode('edit');
    setActiveView('register');
  }

  const handleCloneWarranty = (warranty: Warranty) => {
    setEditingWarrantyId(warranty.id!);
    setRegisterMode('clone');
    setActiveView('register');
  }
  
  const handleWarrantySave = () => {
    setEditingWarrantyId(null);
    setActiveView('query');
  }
  
  const handleViewChange = (view: string) => {
    // Reset editing states when changing views
    if (view !== 'register') {
      setEditingWarrantyId(null);
    }
    if (view !== 'devolucao-register') {
      setEditingDevolucaoId(null);
    }
    setActiveView(view);
  }


  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardSection setActiveView={handleViewChange} />;
      case 'register':
        return <RegisterSection 
                    editingId={editingWarrantyId} 
                    mode={registerMode} 
                    onSave={handleWarrantySave} 
                    onClear={() => setEditingWarrantyId(null)}
                />;
      case 'batch-register':
        return <BatchRegisterSection />;
      case 'query':
        return <QuerySection 
                    setActiveView={handleViewChange} 
                    onEdit={handleEditWarranty} 
                    onClone={handleCloneWarranty}
                />;
      case 'lotes':
        return <LotesSection onNavigateToLote={handleNavigateToLote} isNewLoteModalOpen={isNewLoteModalOpen} setIsNewLoteModalOpen={setIsNewLoteModalOpen} />;
      case 'loteDetail':
        return <LoteDetailSection loteId={selectedLoteId!} onBack={handleBackToList} />;
      case 'reports':
        return <ReportSection />;
      case 'persons':
        return <PersonsSection />;
      case 'suppliers':
        return <SuppliersSection />;
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
      case 'calculators':
        return <CalculatorsSection />;
      default:
        return <DashboardSection setActiveView={handleViewChange} />;
    }
  };
  
  if (isMobile === undefined) return null;


  return (
      <AppLayout 
        activeView={activeView} 
        setActiveView={handleViewChange} 
        isMobileMenuOpen={isMobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onNewLoteClick={() => {
            handleViewChange('lotes');
            setIsNewLoteModalOpen(true);
        }}
      >
        <div className={cn(activeView !== 'batch-register' && 'max-w-7xl mx-auto')}>
            {renderContent()}
        </div>
      </AppLayout>
  );
}
