import React from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BusinessReportView from './components/BusinessReportView';
import { useTheme } from '../../contexts/ThemeContext';

const BusinessReports = ({ headerTitle }) => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen">
      {theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || "Laporan Bisnis"} />}
      <main className={`${theme === 'default' ? 'pt-20' : ''} pb-24 lg:pb-8`}>
        <BusinessReportView headerTitle={headerTitle} />
      </main>
    </div>
  );
};

export default BusinessReports;
