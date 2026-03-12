import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import NotificationPopover from '../components/NotificationPopover';
import ThemeToggle from '../components/ThemeToggle';

const Navbar = ({ user, onUpdateUser }) => {
  return (
    <div className="h-20 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-lg w-96 border border-transparent dark:border-slate-700 transition-all">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Cari transaksi atau laporan..." 
          className="bg-transparent border-none focus:ring-0 text-sm text-gray-600 dark:text-gray-300 w-full placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ThemeToggle user={user} onUpdateUser={onUpdateUser} />
          <NotificationPopover user={user} />
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-slate-800 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-none mb-1">{user?.name || 'User'}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{user?.email}</p>
          </div>
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=4F46E5&color=fff`} 
            alt="Profile" 
            className="w-10 h-10 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
