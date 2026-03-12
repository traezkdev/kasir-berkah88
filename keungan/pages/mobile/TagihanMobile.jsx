import React, { useState } from 'react';
import { Plus, CreditCard, Calendar, AlertCircle, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import { mockBills } from '../../mock/data';

const TagihanMobile = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const filteredBills = mockBills.filter(bill => 
    bill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-24 space-y-6 px-6 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Tagihan Rutin</h1>
        <button className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100 italic">
          <Plus size={20} />
        </button>
      </div>

      {/* Quick Stats Grid Mobile */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-50 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Perlu Dibayar</p>
          </div>
          <p className="text-base font-black text-gray-800">
            {formatCurrency(mockBills.filter(b => b.status === 'unpaid').reduce((acc, curr) => acc + curr.amount, 0))}
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-50 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={10} className="text-green-500" />
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Lunas</p>
          </div>
          <p className="text-base font-black text-gray-800">
            {formatCurrency(mockBills.filter(b => b.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0))}
          </p>
        </div>
      </div>

      {/* Search Input Mobile */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari tagihan..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-50 rounded-2xl focus:ring-2 focus:ring-indigo-100 text-sm shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Bills Card List Mobile */}
      <div className="space-y-4">
        {filteredBills.map((bill) => (
          <div key={bill.id} className="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm flex flex-col gap-5 active:scale-[0.98] transition-all relative overflow-hidden">
            {bill.status === 'unpaid' && (
              <div className="absolute top-0 right-0">
                <div className="bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                  Jatuh Tempo
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${bill.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{bill.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Due: {bill.dueDate}</p>
                </div>
              </div>
              <p className={`font-black text-sm ${bill.status === 'paid' ? 'text-gray-400' : 'text-gray-800'}`}>
                {formatCurrency(bill.amount)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
               <div className={`flex-1 py-1 px-3 rounded-lg text-center text-[10px] font-bold uppercase transition-all ${
                 bill.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
               }`}>
                 {bill.status === 'paid' ? 'Terbayar' : 'Belum Bayar'}
               </div>
               {bill.status === 'unpaid' ? (
                 <button className="flex-[2] bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-100 active:bg-indigo-700">
                   Bayar Sekarang
                 </button>
               ) : (
                 <button className="p-2 text-gray-300">
                   <ChevronRight size={18} />
                 </button>
               )}
            </div>
          </div>
        ))}

        {filteredBills.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-sm font-medium">Tidak ada tagihan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagihanMobile;
