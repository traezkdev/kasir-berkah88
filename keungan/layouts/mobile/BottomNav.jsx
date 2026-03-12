import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  HandCoins, 
  CreditCard, 
  User 
} from 'lucide-react';

const BottomNav = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt },
    { id: 'utang', label: 'Utang', icon: HandCoins },
    { id: 'tagihan', label: 'Tagihan', icon: CreditCard },
    { id: 'pengaturan', label: 'Akun', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 px-6 py-3 z-50 flex justify-between items-center shadow-[0_-4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-safe transition-colors duration-300">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
            activePage === item.id 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-gray-400 dark:text-gray-500 hover:text-indigo-400'
          }`}
        >
          <div className={`p-2 rounded-lg transition-all duration-300 ${
            activePage === item.id 
              ? 'bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' 
              : 'hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}>
            <item.icon size={22} strokeWidth={activePage === item.id ? 2.5 : 2} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${activePage === item.id ? 'opacity-100' : 'opacity-60'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
