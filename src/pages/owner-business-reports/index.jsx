import React from 'react';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import BusinessReportView from '../business-reports/components/BusinessReportView';
import { useTheme } from '../../contexts/ThemeContext';

const OwnerBusinessReports = ({ headerTitle }) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && <OwnerNavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || "Laporan Bisnis"} hideMobileHeader={true} />}
      <div className={`${theme === 'default' ? 'lg:pt-20' : ''} pb-24 lg:pb-8`}>
        <BusinessReportView headerTitle={headerTitle || "Laporan Bisnis"} isOwner={true} />
      </div>
    </div>
  );
};

export default OwnerBusinessReports;
