import React, { useState } from 'react';
import { Plus, CreditCard, Calendar, AlertCircle, CheckCircle2, MoreVertical, Search, Filter } from 'lucide-react';
import { mockBills } from '../mock/data';

const Tagihan = () => {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Tagihan</h1>
          <p className="text-gray-500">Pantau dan kelola semua tagihan rutinmu.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={20} />
          <span>Tambah Tagihan</span>
        </button>
      </div>

      {/* Stats Summary for Bills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tagihan</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(mockBills.reduce((acc, curr) => acc + curr.amount, 0))}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Belum Dibayar</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(mockBills.filter(b => b.status === 'unpaid').reduce((acc, curr) => acc + curr.amount, 0))}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sudah Terbayar</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(mockBills.filter(b => b.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0))}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama tagihan..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-50 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
          <Filter size={18} />
          <span>Filter</span>
        </button>
      </div>

      {/* Bill Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBills.map((bill) => (
          <div key={bill.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${bill.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  <CreditCard size={24} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'
                  }`}>
                    {bill.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                  </span>
                  <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{bill.name}</h3>
                  <p className="text-xs text-gray-400 font-medium">Batas Waktu: {bill.dueDate}</p>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nominal</p>
                    <p className="text-2xl font-black text-gray-900">{formatCurrency(bill.amount)}</p>
                  </div>
                  {bill.status === 'unpaid' && (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                      Bayar Sekarang
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className={`h-1.5 w-full ${bill.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          </div>
        ))}
        
        {filteredBills.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center">
            <p className="text-gray-400 font-medium">Tidak ada tagihan ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tagihan;
