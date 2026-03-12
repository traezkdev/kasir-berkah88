import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { mockUser } from '../mock/data';

const Navbar = () => {
  return (
    <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-40 bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl w-96">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Cari transaksi atau laporan..." 
          className="bg-transparent border-none focus:ring-0 text-sm text-gray-600 w-full"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{mockUser.name}</p>
            <p className="text-xs text-gray-500">{mockUser.email}</p>
          </div>
          <img 
            src={mockUser.avatar} 
            alt="Profile" 
            className="w-10 h-10 rounded-xl shadow-sm border border-gray-100"
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
