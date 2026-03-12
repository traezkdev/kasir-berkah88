import React, { useState, useEffect } from 'react';
import Sidebar from './layouts/Sidebar';
import Navbar from './layouts/Navbar';
import { LayoutPanelLeft, Maximize2 } from 'lucide-react';
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
  const [layoutMode, setLayoutMode] = useState(
    () => localStorage.getItem('trzLayoutMode') || 'container'
  );

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

  useEffect(() => {
    if (user?.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.dark_mode]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('trzUser', JSON.stringify(userData));
  };

  const handleUpdateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('trzUser', JSON.stringify(updatedData));
  };

  const handleLogout = () => {
    localStorage.removeItem('trzToken');
    localStorage.removeItem('trzUser');
    setUser(null);
    setAuthMode('login');
  };

  const toggleLayout = () => {
    setLayoutMode(prev => {
      const next = prev === 'container' ? 'fullwide' : 'container';
      localStorage.setItem('trzLayoutMode', next);
      return next;
    });
  };

  const renderPage = () => {
    if (isMobile) {
      switch(activePage) {
        case 'dashboard': return <DashboardMobile user={user} setActivePage={setActivePage} />;
        case 'transaksi': return <TransaksiMobile user={user} />;
        case 'utang': return <UtangMobile user={user} />;
        case 'tagihan': return <TagihanMobile user={user} />;
        case 'budget': return <BudgetMobile user={user} />;
        case 'tabungan': return <TabunganMobile user={user} />;
        case 'laporan': return <LaporanMobile user={user} />;
        case 'pengaturan': return <PengaturanMobile user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
        default: return <DashboardMobile user={user} setActivePage={setActivePage} />;
      }
    }

    switch(activePage) {
      case 'dashboard': return <Dashboard user={user} setActivePage={setActivePage} />;
      case 'transaksi': return <Transaksi user={user} />;
      case 'utang': return <Utang user={user} />;
      case 'tagihan': return <Tagihan user={user} />;
      case 'budget': return <Budget user={user} />;
      case 'tabungan': return <Tabungan user={user} />;
      case 'laporan': return <Laporan user={user} />;
      case 'pengaturan': return <Pengaturan user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
      default: return <Dashboard user={user} setActivePage={setActivePage} />;
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
      <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-500">
        <MobileHeader 
          user={user} 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser}
        />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 font-sans transition-colors duration-500">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <div className="ml-64">
        <Navbar user={user} onUpdateUser={handleUpdateUser} />
        <main className={`pt-28 pb-10 transition-all duration-300 ${
          layoutMode === 'fullwide' ? 'px-6' : 'px-8 max-w-[1400px] mx-auto'
        }`}>
          {renderPage()}
        </main>
      </div>

      {/* Layout Mode Toggle Button */}
      <button
        onClick={toggleLayout}
        title={layoutMode === 'container' ? 'Ganti ke Full-Wide' : 'Ganti ke Container'}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-full shadow-xl hover:shadow-2xl hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200 group"
      >
        {layoutMode === 'container'
          ? <Maximize2 size={15} className="group-hover:scale-110 transition-transform" />
          : <LayoutPanelLeft size={15} className="group-hover:scale-110 transition-transform" />
        }
        <span className="text-[10px] font-black uppercase tracking-widest">
          {layoutMode === 'container' ? 'Full Wide' : 'Container'}
        </span>
      </button>
    </div>
  );
};

export default App;

