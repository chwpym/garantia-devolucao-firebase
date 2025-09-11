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

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedLoteId, setSelectedLoteId] = useState<number | null>(null);
  const [editingDevolucaoId, setEditingDevolucaoId] = useState<number | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
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


  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardSection setActiveView={setActiveView} />;
      case 'register':
        return <RegisterSection />;
      case 'query':
        return <QuerySection setActiveView={setActiveView} />;
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
      default:
        return <DashboardSection setActiveView={setActiveView} />;
    }
  };
  
  if (isMobile === undefined) return null;


  return (
      <AppLayout 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isMobileMenuOpen={isMobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      >
        {renderContent()}
      </AppLayout>
  );
}
