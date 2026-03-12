import React, { useState, useEffect } from 'react';
import Sidebar from './layouts/Sidebar';
import Navbar from './layouts/Navbar';
import Dashboard from './pages/Dashboard';
import Transaksi from './pages/Transaksi';
import Utang from './pages/Utang';
import Tagihan from './pages/Tagihan';
import Budget from './pages/Budget';
import Tabungan from './pages/Tabungan';
import Laporan from './pages/Laporan';
import Pengaturan from './pages/Pengaturan';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Mobile UI Imports
import MobileHeader from './layouts/mobile/MobileHeader';
import BottomNav from './layouts/mobile/BottomNav';
import DashboardMobile from './pages/mobile/DashboardMobile';
import TransaksiMobile from './pages/mobile/TransaksiMobile';
import UtangMobile from './pages/mobile/UtangMobile';
import TagihanMobile from './pages/mobile/TagihanMobile';
import BudgetMobile from './pages/mobile/BudgetMobile';
import TabunganMobile from './pages/mobile/TabunganMobile';
import LaporanMobile from './pages/mobile/LaporanMobile';
import PengaturanMobile from './pages/mobile/PengaturanMobile';

const App = () => {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('trzUser');
    const token = localStorage.getItem('trzToken');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);

    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('trzToken');
    localStorage.removeItem('trzUser');
    setUser(null);
    setAuthMode('login');
  };

  const renderPage = () => {
    if (isMobile) {
      switch(activePage) {
        case 'dashboard': return <DashboardMobile user={user} />;
        case 'transaksi': return <TransaksiMobile user={user} />;
        case 'utang': return <UtangMobile user={user} />;
        case 'tagihan': return <TagihanMobile user={user} />;
        case 'budget': return <BudgetMobile user={user} />;
        case 'tabungan': return <TabunganMobile user={user} />;
        case 'laporan': return <LaporanMobile user={user} />;
        case 'pengaturan': return <PengaturanMobile user={user} onLogout={handleLogout} />;
        default: return <DashboardMobile user={user} />;
      }
    }

    switch(activePage) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'transaksi': return <Transaksi user={user} />;
      case 'utang': return <Utang user={user} />;
      case 'tagihan': return <Tagihan user={user} />;
      case 'budget': return <Budget user={user} />;
      case 'tabungan': return <Tabungan user={user} />;
      case 'laporan': return <Laporan user={user} />;
      case 'pengaturan': return <Pengaturan user={user} onLogout={handleLogout} />;
      default: return <Dashboard user={user} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    if (authMode === 'register') {
      return (
        <Register 
          onSwitchToLogin={() => setAuthMode('login')} 
          onRegisterSuccess={() => setAuthMode('login')} 
        />
      );
    }
    return (
      <Login 
        onSwitchToRegister={() => setAuthMode('register')} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  // Main Application
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
        <MobileHeader 
          user={user} 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onLogout={handleLogout} 
        />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <div className="ml-64">
        <Navbar user={user} />
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

