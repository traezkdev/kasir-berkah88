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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-50 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.03)] pb-safe">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activePage === item.id ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activePage === item.id ? 'bg-indigo-50' : ''}`}>
            <item.icon size={22} strokeWidth={activePage === item.id ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
