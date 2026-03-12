import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  HandCoins, 
  CreditCard, 
  PieChart, 
  Target, 
  FileText, 
  Settings, 
  LogOut 
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage }) => {
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

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <HandCoins size={24} />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">FinBerkah</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activePage === item.id 
                ? 'bg-indigo-50 text-indigo-600 font-medium' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-500'
            }`}
          >
            <item.icon size={20} className={activePage === item.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
