import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  HandCoins, 
  Menu, 
  X, 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  PieChart, 
  Target, 
  FileText, 
  Settings,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileHeader = ({ user, activePage, setActivePage, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt },
    { id: 'utang', label: 'Utang', icon: HandCoins },
    { id: 'tagihan', label: 'Tagihan', icon: CreditCard },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'tabungan', label: 'Tabungan', icon: Target },
    { id: 'laporan', label: 'Laporan', icon: FileText },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const handleMenuClick = (id) => {
    setActivePage(id);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-gray-50 uppercase tracking-widest text-[10px] font-bold">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <HandCoins size={18} />
            </div>
            <span className="text-sm font-bold text-gray-800 lowercase tracking-normal text-base capitalize">trzfinance</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-gray-400">
            <Search size={20} />
          </button>
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=4F46E5&color=fff`} 
            alt="Profile" 
            className="w-8 h-8 rounded-lg shadow-sm border border-gray-100"
          />
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
            />
            
            {/* Drawer Content */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <HandCoins size={22} />
                  </div>
                  <span className="text-xl font-bold text-gray-800">trzfinance</span>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex items-center gap-4 bg-gray-50 mx-4 mt-6 rounded-[1.5rem] border border-gray-100">
                <img 
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=4F46E5&color=fff`} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-2xl shadow-sm border-2 border-white"
                />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-gray-500 font-medium truncate">{user?.email}</p>
                </div>
              </div>

              <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
                <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Main Menu</p>
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-200 group ${
                      activePage === item.id 
                        ? 'bg-indigo-50 text-indigo-600 font-bold' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={20} className={activePage === item.id ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                <button 
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-red-500 bg-red-50/50 hover:bg-red-50 rounded-2xl transition-colors font-bold text-sm"
                >
                  <LogOut size={20} />
                  <span>Keluar Aplikasi</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileHeader;

