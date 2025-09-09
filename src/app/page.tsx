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

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardSection />;
      case 'register':
        return <RegisterSection />;
      case 'query':
        return <QuerySection />;
      case 'lotes':
        return <LotesSection />;
      case 'reports':
        return <ReportSection />;
      case 'persons':
        return <PersonsSection />;
      case 'suppliers':
        return <SuppliersSection />;
      case 'backup':
        return <BackupSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <AppLayout activeView={activeView} setActiveView={setActiveView}>
      {renderContent()}
    </AppLayout>
  );
}
