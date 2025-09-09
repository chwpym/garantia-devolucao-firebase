'use client';

import { useState } from 'react';
import AppLayout from '@/components/app-layout';

import WarrantyFormSection from '@/components/sections/warranty-form-section';
import ReportSection from '@/components/sections/report-section';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <WarrantyFormSection />;
      case 'reports':
        return <ReportSection />;
      default:
        return <WarrantyFormSection />;
    }
  };

  return (
    <AppLayout activeView={activeView} setActiveView={setActiveView}>
      {renderContent()}
    </AppLayout>
  );
}
