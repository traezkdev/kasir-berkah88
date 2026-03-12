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
  LogOut,
  Heart 
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
    },
    {
      title: 'Informasi',
      items: [
        { id: 'credits', label: 'Credits', icon: Heart },
      ]
    }
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-900 h-screen border-r border-gray-100 dark:border-slate-800 flex flex-col fixed left-0 top-0 z-50 transition-colors">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 transform -rotate-3 transition-transform hover:rotate-0">
            <HandCoins size={22} />
          </div>
          <span className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">trzfinance</span>
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar pb-8">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.title} className={groupIdx !== 0 ? 'mt-8' : ''}>
            <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                    activePage === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30 font-bold' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <item.icon size={18} className={activePage === item.id ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'} />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50 dark:border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all font-bold text-sm"
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
