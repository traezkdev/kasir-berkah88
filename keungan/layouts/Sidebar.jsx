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

const Sidebar = ({ activePage, setActivePage, onLogout }) => {
  const menuGroups = [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'laporan', label: 'Laporan', icon: FileText },
      ]
    },
    {
      title: 'Transaksi & Keuangan',
      items: [
        { id: 'transaksi', label: 'Transaksi', icon: Receipt },
        { id: 'utang', label: 'Utang', icon: HandCoins },
        { id: 'tagihan', label: 'Tagihan', icon: CreditCard },
      ]
    },
    {
      title: 'Perencanaan',
      items: [
        { id: 'budget', label: 'Budget', icon: PieChart },
        { id: 'tabungan', label: 'Tabungan', icon: Target },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
      ]
    }
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transform -rotate-3">
            <HandCoins size={22} />
          </div>
          <span className="text-xl font-black text-gray-800 tracking-tight">trzfinance</span>
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar pb-8">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.title} className={groupIdx !== 0 ? 'mt-8' : ''}>
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                    activePage === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                >
                  <item.icon size={18} className={activePage === item.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'} />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
