import React, { useState, useEffect } from 'react';
import Sidebar from './layouts/Sidebar';
import Navbar from './layouts/Navbar';
import Dashboard from './pages/Dashboard';
import Transaksi from './pages/Transaksi';
import Utang from './pages/Utang';

// Mobile UI Imports
import MobileHeader from './layouts/mobile/MobileHeader';
import BottomNav from './layouts/mobile/BottomNav';
import DashboardMobile from './pages/mobile/DashboardMobile';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderPage = () => {
    if (isMobile) {
      switch(activePage) {
        case 'dashboard': return <DashboardMobile />;
        case 'transaksi': return <Transaksi />; // Bisa dibuat versi mobile khusus nanti
        case 'utang': return <Utang />;
        default: return <DashboardMobile />;
      }
    }

    switch(activePage) {
      case 'dashboard': return <Dashboard />;
      case 'transaksi': return <Transaksi />;
      case 'utang': return <Utang />;
      default: return <Dashboard />;
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="ml-64">
        <Navbar />
        <main className="pt-28 pb-10 px-8">
          {renderPage()}
        </main>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-2xl text-[10px] font-bold border-4 border-white uppercase tracking-widest">
          Desktop Mode
        </div>
      </div>
    </div>
  );
};

export default App;
