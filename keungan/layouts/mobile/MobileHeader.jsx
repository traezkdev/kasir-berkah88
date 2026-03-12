import React from 'react';
import { Bell, Search, HandCoins } from 'lucide-react';
import { mockUser } from '../../mock/data';

const MobileHeader = () => {
  return (
    <div className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-gray-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <HandCoins size={18} />
        </div>
        <span className="text-lg font-bold text-gray-800">FinBerkah</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-gray-400">
          <Search size={20} />
        </button>
        <button className="relative text-gray-400">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <img 
          src={mockUser.avatar} 
          alt="Profile" 
          className="w-8 h-8 rounded-lg shadow-sm"
        />
      </div>
    </div>
  );
};

export default MobileHeader;
