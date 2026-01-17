import React from 'react';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import BusinessReportView from '../business-reports/components/BusinessReportView';
import { useTheme } from '../../contexts/ThemeContext';

const OwnerBusinessReports = ({ headerTitle }) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && <OwnerNavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || "Laporan Bisnis"} />}
      <div className={`${theme === 'default' ? 'pt-20' : ''} pb-24 lg:pb-8`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
          <BusinessReportView headerTitle={headerTitle || "Laporan Bisnis"} isOwner={true} />
        </div>
      </div>
    </div>
  );
};

export default OwnerBusinessReports;
