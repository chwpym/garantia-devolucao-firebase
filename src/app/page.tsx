'use client';

import { useState } from 'react';
import AppLayout from '@/components/app-layout';

import RegisterSection from '@/components/sections/register-section';
import QuerySection from '@/components/sections/query-section';
import ReportSection from '@/components/sections/report-section';

export default function Home() {
  const [activeView, setActiveView] = useState('register');

  const renderContent = () => {
    switch (activeView) {
      case 'register':
        return <RegisterSection />;
      case 'query':
        return <QuerySection />;
      case 'reports':
        return <ReportSection />;
      default:
        return <RegisterSection />;
    }
  };

  return (
    <AppLayout activeView={activeView} setActiveView={setActiveView}>
      {renderContent()}
    </AppLayout>
  );
}
