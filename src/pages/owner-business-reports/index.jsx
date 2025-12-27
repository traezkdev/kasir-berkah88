import React from 'react';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import BusinessReportView from '../business-reports/components/BusinessReportView';
import { useTheme } from '../../contexts/ThemeContext';

const OwnerBusinessReports = ({ headerTitle }) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      <OwnerNavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || "Laporan Bisnis"} />
      <main className="pt-16 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <BusinessReportView headerTitle={headerTitle || "Laporan Bisnis"} isOwner={true} />
        </div>
      </main>
    </div>
  );
};

export default OwnerBusinessReports;
